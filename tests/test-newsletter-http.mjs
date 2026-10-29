import test from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../supabase/functions/newsletter/handler.mjs";
import { CONSENT_TEXT } from "../supabase/functions/newsletter/campaign.mjs";
const id = "11111111-1111-4111-8111-111111111111";
const contactId = "22222222-2222-4222-8222-222222222222";
function fixture(overrides = {}) {
  const calls = [];
  let status = "pending";
  const values = {
    SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
    RESEND_API_KEY: "test-provider-key",
    NEWSLETTER_SIGNUP_ENABLED: "true",
    NEWSLETTER_SITE_URL: "https://example.com",
    NEWSLETTER_RATE_LIMIT_SALT: "test-salt",
    ...overrides,
  };
  const db = {
    rpc: async (name, data) => {
      calls.push({ name, data });
      if (name === "newsletter_allow_request") return true;
      if (name === "newsletter_request_subscription")
        return {
          id,
          email: data.p_email,
          status: "pending",
          requested_at: "2026-09-11T00:00:00Z",
        };
      if (name === "newsletter_confirm_subscription") {
        status = "confirmed";
        return { id, email: "person@example.com", status };
      }
      return null;
    },
    request: async (path) => {
      calls.push({ path });
      return [{ id, email: "person@example.com", status }];
    },
    patch: async (table, query, data) => {
      calls.push({ table, query, data });
      if (data.status) status = data.status;
      return [{ id, status }];
    },
  };
  const provider = {
    request: async (path, options) => {
      calls.push({ provider: path, options });
      if (path.startsWith("contacts/"))
        return { id: contactId, unsubscribed: false };
      return { id: contactId };
    },
    list: async () => [],
  };
  const config = {
    enabled: false,
    mode: "draft",
    segmentId: id,
    from: "BlauTech <newsletter@example.com>",
    address: "Example address",
    maxContacts: 1000,
  };
  const dependencies = {
    env: (name) => values[name] || "",
    db,
    provider,
    config,
    verifyWebhook: () => {
      throw Error("invalid signature");
    },
  };
  const handler = createHandler(dependencies);
  const request = (
    action,
    body,
    headers = { origin: "https://example.com" },
    method = "POST",
  ) =>
    handler(
      new Request("https://local.test/functions/v1/newsletter/" + action, {
        method,
        headers: { "content-type": "application/json", ...headers },
        ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
      }),
    );
  return { request, calls, db, provider, dependencies };
}
const signup = {
  email: "Person@Example.com",
  consent: true,
  consent_version: "2026-10-28-v4",
};
test("configured n8n key authenticates independently of the injected runtime JWT", async () => {
  const f = fixture({ NEWSLETTER_INTERNAL_KEY: "n8n-service-key" });
  assert.equal((await f.request("health", {}, { authorization: "Bearer n8n-service-key" })).status, 200);
  assert.equal((await f.request("health", {}, { authorization: "Bearer test-service-key" })).status, 401);
});
test("public callers cannot trigger campaigns, health, or maintenance", async () => {
  const f = fixture();
  for (const a of ["campaign", "health", "maintenance"])
    assert.equal((await f.request(a, {})).status, 401);
  assert.equal(f.calls.length, 0);
});
test("signup stays disabled until configured", async () => {
  const f = fixture({ NEWSLETTER_SIGNUP_ENABLED: "false" });
  assert.equal((await f.request("subscribe", signup)).status, 503);
  assert.equal(f.calls.length, 0);
});
test("maintenance purges abandoned requests while signup remains disabled", async () => {
  const f = fixture({ NEWSLETTER_SIGNUP_ENABLED: "false" });
  f.db.request = async () => [];
  f.db.rpc = async (name) => {
    assert.equal(name, "newsletter_purge_pending");
    return 2;
  };
  const result = await f.request("maintenance", {}, { authorization: "Bearer test-service-key" });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).purged_pending, 2);
});
test("maintenance purges before rejecting missing Resend configuration", async () => {
  const f = fixture({ RESEND_API_KEY: "" });
  let purged = false;
  f.db.rpc = async (name) => {
    assert.equal(name, "newsletter_purge_pending");
    purged = true;
    return 1;
  };
  assert.equal((await f.request("maintenance", {}, { authorization: "Bearer test-service-key" })).status, 503);
  assert.equal(purged, true);
});
test("cross-origin requests cannot send confirmation emails", async () => {
  const f = fixture();
  assert.equal(
    (await f.request("subscribe", signup, { origin: "https://evil.example" }))
      .status,
    403,
  );
  assert.equal(f.calls.length, 0);
});
test("consent is explicit and must use current wording version", async () => {
  const f = fixture();
  for (const body of [
    { ...signup, consent: false },
    { ...signup, consent: "true" },
    { ...signup, consent_version: "old" },
  ])
    assert.equal((await f.request("subscribe", body)).status, 400);
  assert.equal(f.calls.length, 0);
});
test("rate-limited signup returns the same response without sending", async () => {
  const f = fixture();
  f.db.rpc = async () => false;
  const result = await f.request("subscribe", signup);
  assert.equal(result.status, 202);
  assert.deepEqual(await result.json(), { status: "check_email" });
  assert.equal(f.calls.length, 0);
});
test("signup stores only token hash and sends confirmation, never a marketing contact", async () => {
  const f = fixture();
  const result = await f.request("subscribe", signup);
  assert.equal(result.status, 202);
  const saved = f.calls.find(
    (c) => c.name === "newsletter_request_subscription",
  );
  assert.equal(saved.data.p_email, "person@example.com");
  assert.match(saved.data.p_hash, /^[0-9a-f]{64}$/);
  const sends = f.calls.filter((c) => c.provider);
  assert.equal(sends.length, 1);
  assert.equal(sends[0].provider, "emails");
  assert(!sends[0].options.body.html.includes(saved.data.p_hash));
  assert.match(sends[0].options.body.html, /#token=[0-9a-f]{64}/);
  assert(!JSON.stringify(await result.json()).includes("person@example.com"));
});
test("confirmation email has a matching plain-text part and sender footer", async () => {
  const f = fixture();
  await f.request("subscribe", signup);
  const { body } = f.calls.find((c) => c.provider === "emails").options;
  const htmlToken = body.html.match(/#token=([0-9a-f]{64})/)[1];
  assert.match(body.text, new RegExp(`https://example\\.com/newsletter#token=${htmlToken}`));
  assert(body.text.includes(CONSENT_TEXT));
  assert(body.html.includes("Example address"));
  assert(body.text.includes("Example address"));
  assert.equal(body.subject, "Confirm your BlauTech newsletter subscription");
});
test("link scanners cannot confirm subscriptions with GET", async () => {
  const f = fixture();
  assert.equal((await f.request("confirm", undefined, {}, "GET")).status, 405);
  assert.equal(f.calls.length, 0);
});
test("expired/replayed token never reaches provider", async () => {
  const f = fixture();
  f.db.rpc = async () => null;
  assert.equal(
    (await f.request("confirm", { token: "a".repeat(64) })).status,
    400,
  );
  assert(!f.calls.some((c) => c.provider));
});
test("confirmed subscriber is added to segment and becomes active", async () => {
  const f = fixture();
  const result = await f.request("confirm", { token: "a".repeat(64) });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).status, "active");
  assert(
    f.calls.some((c) => c.provider === `contacts/${contactId}/segments/${id}`),
  );
});
test("existing provider unsubscribe cannot be reset by signup or retries", async () => {
  const f = fixture();
  f.provider.request = async () => ({ id: contactId, unsubscribed: true });
  const result = await f.request("confirm", { token: "a".repeat(64) });
  assert.equal((await result.json()).status, "unsubscribed");
  assert(f.calls.some((c) => c.data?.sync_error === "provider_unsubscribed"));
});
test("provider outage preserves confirmed state for maintenance retry", async () => {
  const f = fixture();
  f.provider.request = async () => {
    throw Error("provider down");
  };
  const result = await f.request("confirm", { token: "a".repeat(64) });
  assert.equal((await result.json()).status, "confirmed");
  assert(f.calls.some((c) => c.data?.sync_error === "resend_sync_failed"));
});
test("invalid webhook signature cannot change subscribers", async () => {
  const f = fixture();
  assert.equal(
    (
      await f.request("webhook", {
        type: "contact.updated",
        data: { email: "person@example.com", unsubscribed: true },
      })
    ).status,
    400,
  );
  assert.equal(f.calls.length, 0);
});
test("verified webhook persists only allowlisted event fields", async () => {
  const f = fixture();
  f.dependencies.verifyWebhook = () => ({
    type: "contact.updated",
    created_at: "2026-09-11T00:00:00Z",
    data: {
      email: "Person@Example.com",
      unsubscribed: true,
      secret: "do not store",
    },
  });
  const handler = createHandler(f.dependencies);
  const result = await handler(
    new Request("https://local.test/newsletter/webhook", {
      method: "POST",
      body: "{}",
      headers: { "svix-id": "event-test" },
    }),
  );
  assert.equal(result.status, 200);
  const event = f.calls.find((c) => c.name === "newsletter_record_event");
  assert.deepEqual(event.data.p_emails, ["person@example.com"]);
  assert(!JSON.stringify(event).includes("do not store"));
});
