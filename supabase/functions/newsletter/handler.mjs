import {
  CONSENT_VERSION,
  UUID,
  normalizeEmail,
  confirmationEmail,
  publishCampaign,
  reconcileCampaign,
} from "./campaign.mjs";

export function createHandler({ env, db, provider, config, verifyWebhook }) {
  const site = env("NEWSLETTER_SITE_URL") || "https://www.blau-tech.de";
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
  };
  const response = (data, status = 200, origin = "") =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        ...headers,
        ...(origin
          ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
          : {}),
      },
    });
  const hash = async (text) =>
    Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
      ),
    )
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");

  async function syncSubscription(s) {
    const fresh = (
      await db.request(
        "newsletter_subscriptions?id=eq." + s.id + "&status=eq.confirmed",
      )
    )[0];
    if (!fresh) return;
    try {
      let contact = await provider.request(
        "contacts/" + encodeURIComponent(fresh.email),
        { allow404: true },
      );
      // Never undo a provider unsubscribe/suppression during retries or a migration.
      if (contact?.unsubscribed === true) {
        await db.patch(
          "newsletter_subscriptions",
          "id=eq." + s.id + "&status=eq.confirmed",
          {
            status: "unsubscribed",
            unsubscribed_at: new Date().toISOString(),
            sync_error: "provider_unsubscribed",
          },
        );
        return;
      }
      if (!contact) {
        const contacts = await provider.list("contacts", 999);
        if (contacts.length >= 1000)
          throw new Error("free_contact_limit_exceeded");
        contact = await provider.request("contacts", {
          method: "POST",
          body: { email: fresh.email, unsubscribed: false },
        });
      }
      if (!UUID.test(contact?.id || ""))
        throw new Error("invalid_contact_response");
      await db.patch(
        "newsletter_subscriptions",
        "id=eq." + s.id + "&status=eq.confirmed",
        { resend_contact_id: contact.id },
      );
      await provider.request(
        "contacts/" + contact.id + "/segments/" + config.segmentId,
        { method: "POST" },
      );
      const rows = await db.patch(
        "newsletter_subscriptions",
        "id=eq." + s.id + "&status=eq.confirmed",
        {
          status: "active",
          sync_error: null,
          updated_at: new Date().toISOString(),
        },
      );
      // A concurrent unsubscribe wins locally and must also remove delivery eligibility remotely.
      if (!rows.length)
        await provider.request("contacts/" + contact.id, {
          method: "PATCH",
          body: { unsubscribed: true },
        });
    } catch {
      await db.patch(
        "newsletter_subscriptions",
        "id=eq." + s.id + "&status=eq.confirmed",
        {
          sync_error: "resend_sync_failed",
          updated_at: new Date().toISOString(),
        },
      );
    }
  }

  return async (req) => {
    const origin = req.headers.get("origin") || "";
    const allowedOrigin = origin === new URL(site).origin ? origin : "";
    const action = new URL(req.url).pathname.split("/").filter(Boolean).at(-1);
    if (req.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: {
          ...headers,
          ...(allowedOrigin
            ? { "Access-Control-Allow-Origin": allowedOrigin }
            : {}),
          "Access-Control-Allow-Headers": "content-type, apikey, authorization",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
        },
      });
    if (req.method !== "POST")
      return response({ error: "method_not_allowed" }, 405, allowedOrigin);
    const raw = await req.text();
    if (raw.length > 250000)
      return response({ error: "request_too_large" }, 413, allowedOrigin);
    let webhookVerified = false;
    try {
      if (action === "webhook") {
        const event = verifyWebhook(raw, {
          "svix-id": req.headers.get("svix-id") || "",
          "svix-timestamp": req.headers.get("svix-timestamp") || "",
          "svix-signature": req.headers.get("svix-signature") || "",
        });
        webhookVerified = true;
        const kind = event.type;
        const accepted = [
          "contact.updated",
          "contact.deleted",
          "email.sent",
          "email.delivered",
          "email.bounced",
          "email.complained",
          "email.failed",
          "email.delivery_delayed",
        ];
        if (!accepted.includes(kind)) return response({ ok: true });
        const contactStop =
          kind === "contact.deleted" ||
          (kind === "contact.updated" && event.data?.unsubscribed === true);
        const suppress =
          kind === "email.bounced" || kind === "email.complained";
        const emails = contactStop
          ? [event.data.email]
          : suppress
            ? event.data.to || []
            : [];
        await db.rpc("newsletter_record_event", {
          p_event_id: req.headers.get("svix-id"),
          p_kind: kind,
          p_broadcast_id: UUID.test(event.data?.broadcast_id || "")
            ? event.data.broadcast_id
            : null,
          p_emails: emails
            .filter((e) => typeof e === "string")
            .map((e) => e.toLowerCase()),
          p_occurred_at: event.created_at,
        });
        return response({ ok: true });
      }
      const body = JSON.parse(raw);
      if (["campaign", "maintenance", "health"].includes(action || "")) {
        // The Edge runtime's injected service JWT can differ from n8n's external key.
        const internalKey = env("NEWSLETTER_INTERNAL_KEY") || env("SUPABASE_SERVICE_ROLE_KEY");
        if (
          req.headers.get("authorization") !==
            `Bearer ${internalKey}` ||
          !internalKey
        )
          return response({ error: "unauthorized" }, 401);
        if (action === "health") {
          const campaigns = await db.request(
            "newsletter_campaigns?select=id,issue_key,status,error_code,updated_at&order=created_at.desc&limit=8",
          );
          const pending = await db.request(
            "newsletter_subscriptions?select=id&status=eq.confirmed&limit=1000",
          );
          return response({ campaigns, pending_sync: pending.length });
        }
        // Retention must not depend on Resend configuration or reconciliation health.
        const purgedPending = action === "maintenance"
          ? await db.rpc("newsletter_purge_pending", {})
          : null;
        if (!env("RESEND_API_KEY") || !UUID.test(config.segmentId))
          throw new Error("resend_not_configured");
        if (action === "campaign") {
          if (typeof body.test_mode !== "boolean")
            return response({ error: "test_mode_required" }, 400);
          const result = await publishCampaign({
            store: db.store,
            provider,
            config,
            input: body,
          });
          return response(result, result.status === "needs_review" ? 409 : 200);
        }
        const campaigns = await db.request(
          "newsletter_campaigns?status=in.(draft,sending,needs_review,creating)&updated_at=lt." +
            encodeURIComponent(new Date(Date.now() - 300000).toISOString()) +
            "&order=updated_at.asc&limit=5",
        );
        const results = [];
        for (const campaign of campaigns) {
          results.push(
            await reconcileCampaign({ store: db.store, provider, campaign }),
          );
          await db.store.update(campaign.id, {
            updated_at: new Date().toISOString(),
          });
        }
        if (env("NEWSLETTER_SIGNUP_ENABLED") === "true") {
          const subscriptions = await db.request(
            "newsletter_subscriptions?status=eq.confirmed&order=updated_at.asc&limit=5",
          );
          for (const s of subscriptions) await syncSubscription(s);
        }
        await db.request(
          "newsletter_request_limits?expires_at=lt." +
            encodeURIComponent(new Date().toISOString()),
          { method: "DELETE" },
        );
        const failed = await db.request(
          "newsletter_subscriptions?select=id&sync_error=not.is.null&limit=1",
        );
        const unhealthy =
          results.some((r) => r.status === "needs_review") || failed.length > 0;
        const day = new Date().toISOString().slice(0, 10);
        const alert =
          unhealthy &&
          (await db.rpc("newsletter_allow_request", {
            p_bucket: "operational-alert:" + day,
            p_limit: 1,
            p_expires_at: new Date(Date.now() + 86400000).toISOString(),
          }));
        return response({ results, needs_review: Boolean(alert), purged_pending: purgedPending });
      }
      if (!["subscribe", "confirm"].includes(action || ""))
        return response({ error: "not_found" }, 404, allowedOrigin);
      if (!allowedOrigin) return response({ error: "origin_not_allowed" }, 403);
      if (
        env("NEWSLETTER_SIGNUP_ENABLED") !== "true" ||
        !env("RESEND_API_KEY") ||
        !env("NEWSLETTER_RATE_LIMIT_SALT") ||
        !config.from ||
        !UUID.test(config.segmentId)
      )
        return response(
          { error: "newsletter_unavailable" },
          503,
          allowedOrigin,
        );
      if (action === "confirm") {
        if (
          typeof body.token !== "string" ||
          !/^[0-9a-f]{64}$/.test(body.token)
        )
          return response(
            { error: "invalid_or_expired_link" },
            400,
            allowedOrigin,
          );
        const s = await db.rpc("newsletter_confirm_subscription", {
          p_hash: await hash(body.token),
        });
        if (!s?.id)
          return response(
            { error: "invalid_or_expired_link" },
            400,
            allowedOrigin,
          );
        await syncSubscription(s);
        const current = (
          await db.request(
            "newsletter_subscriptions?id=eq." + s.id + "&select=status",
          )
        )[0];
        return response({ status: current.status }, 200, allowedOrigin);
      }
      const email = normalizeEmail(body.email);
      if (body.consent !== true || body.consent_version !== CONSENT_VERSION)
        return response(
          { error: "explicit_consent_required" },
          400,
          allowedOrigin,
        );
      if (body.website)
        return response({ status: "check_email" }, 202, allowedOrigin);
      const now = new Date(),
        day = now.toISOString().slice(0, 10),
        hour = now.toISOString().slice(0, 13);
      // x-forwarded-for is supplied by the gateway. Global budget still bounds abuse if an upstream allows spoofing.
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const expiry = new Date(now.getTime() + 86400000).toISOString();
      for (const [bucket, limit] of [
        [`ip:${hour}:${await hash(ip + env("NEWSLETTER_RATE_LIMIT_SALT"))}`, 5],
        [
          `email:${day}:${await hash(email + env("NEWSLETTER_RATE_LIMIT_SALT"))}`,
          3,
        ],
        [`confirm:${day}`, 80],
      ]) {
        if (
          !(await db.rpc("newsletter_allow_request", {
            p_bucket: bucket,
            p_limit: limit,
            p_expires_at: expiry,
          }))
        )
          return response({ status: "check_email" }, 202, allowedOrigin);
      }
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("");
      const s = await db.rpc("newsletter_request_subscription", {
        p_email: email,
        p_hash: await hash(token),
        p_version: CONSENT_VERSION,
      });
      if (s?.id) {
        try {
          await provider.request("emails", {
            method: "POST",
            idempotencyKey: "newsletter-confirm:" + s.id + ":" + s.requested_at,
            body: {
              from: config.from,
              to: [email],
              ...(config.replyTo ? { reply_to: config.replyTo } : {}),
              ...confirmationEmail({ site, token, address: config.address }),
            },
          });
        } catch {
          await db.patch("newsletter_subscriptions", "id=eq." + s.id, {
            sync_error: "confirmation_email_failed",
          });
        }
      }
      return response({ status: "check_email" }, 202, allowedOrigin);
    } catch {
      // Never log the request body, provider error payloads, tokens, or recipient addresses.
      console.error(
        "newsletter_request_failed",
        [
          "webhook",
          "campaign",
          "maintenance",
          "health",
          "subscribe",
          "confirm",
        ].includes(action)
          ? action
          : "unknown",
      );
      return response(
        {
          error:
            action === "webhook"
              ? (webhookVerified ? "webhook_storage_failed" : "webhook_rejected")
              : "newsletter_request_failed",
        },
        action === "webhook" && !webhookVerified ? 400 : 503,
        allowedOrigin,
      );
    }
  };
}
