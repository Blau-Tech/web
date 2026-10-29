export const CONSENT_VERSION = "2026-10-28-v4";
export const CONSENT_TEXT =
  "Send me the Blau Tech newsletter. See our Privacy Policy.";
export const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function berlinDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function issueKey(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new Error("invalid_publication_date");
  const day = new Date(date + "T12:00:00Z");
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== date)
    throw new Error("invalid_publication_date");
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return "blau-tech-weekly:" + day.toISOString().slice(0, 10);
}
export function normalizeEmail(value) {
  if (typeof value !== "string") throw new Error("invalid_email");
  const email = value.trim().toLowerCase();
  if (
    email.length > 254 ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(
      email,
    )
  )
    throw new Error("invalid_email");
  return email;
}
export function validateCampaign(input, today = berlinDate()) {
  if (!input || input.publicationDate !== today)
    throw new Error("stale_publication_date");
  const eventIds = [
    ...new Set([...(input.eventIds || []), ...(input.hackathonIds || [])]),
  ];
  const opportunityIds = [...new Set(input.opportunityIds || [])];
  if (
    eventIds.length + opportunityIds.length < 1 ||
    eventIds.length > 10 ||
    opportunityIds.length > 3 ||
    ![...eventIds, ...opportunityIds].every(
      (id) => typeof id === "string" && UUID.test(id),
    )
  )
    throw new Error("invalid_selected_items");
  if (
    typeof input.html !== "string" ||
    input.html.length > 200000 ||
    !input.html.trim() ||
    typeof input.title !== "string" ||
    input.title.length > 200 ||
    /[\r\n]/.test(input.title)
  )
    throw new Error("invalid_campaign_content");
  return {
    issue_key: issueKey(today),
    publication_date: today,
    title: input.title,
    html: input.html,
    event_ids: eventIds,
    opportunity_ids: opportunityIds,
  };
}
export function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
export function campaignHtml(html, address) {
  if (!address?.trim()) throw new Error("sender_address_missing");
  return (
    html +
    `<p style="font-size:12px;text-align:center;color:#64748b">BlauTech · ${esc(address)}<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a> · <a href="https://www.blau-tech.de/privacy">Privacy</a></p>`
  );
}

export function confirmationEmail({ site, token, address }) {
  const link = `${site}/newsletter#token=${token}`;
  const footer = address?.trim() ? `BlauTech · ${address.trim()}` : "BlauTech";
  const html = `<!doctype html><html><body style="margin:0;background:#edf1f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0b0f19">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf1f6;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;padding:36px 32px">
<tr><td>
<p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#1e5fa6">Blau Tech newsletter</p>
<h1 style="margin:14px 0 0;font-size:26px;line-height:1.15;font-weight:600">Confirm your subscription</h1>
<p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#626770">Tap the button below to start receiving a weekly selection of events, hackathons and programs from Berlin, Munich and beyond.</p>
<p style="margin:28px 0 0"><a href="${esc(link)}" style="display:inline-block;background:#0b0f19;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 24px;border-radius:9999px">Confirm subscription</a></p>
<p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#626770">You are confirming: “${esc(CONSENT_TEXT)}”</p>
<p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#626770">This link expires in 24 hours. If you did not request this, ignore this email and you will not be subscribed.</p>
</td></tr></table>
<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#626770">${esc(footer)} · <a href="${esc(site)}/privacy" style="color:#626770">Privacy</a></p>
</td></tr></table></body></html>`;
  const text = [
    "Confirm your newsletter subscription",
    "",
    `You are confirming: "${CONSENT_TEXT}"`,
    "",
    `Confirm here: ${link}`,
    "",
    "This link expires in 24 hours. If you did not request this, ignore this email and you will not be subscribed.",
    "",
    footer,
  ].join("\n");
  return { subject: "Confirm your BlauTech newsletter subscription", html, text };
}

// Dependencies are injected so timeout/crash/duplicate paths can be tested without sending mail.
export async function publishCampaign({
  store,
  provider,
  config,
  input,
  today = berlinDate(),
}) {
  const proposed = validateCampaign(input, today);
  if (input.test_mode === true)
    return {
      status: "preview",
      ...proposed,
      html: campaignHtml(proposed.html, config.address),
    };
  if (config.enabled !== true) throw new Error("newsletter_sending_disabled");
  const existing = await store.find(proposed.issue_key);
  if (existing)
    return reconcileCampaign({ store, provider, campaign: existing });
  await provider.assertAudience(config.segmentId, config.maxContacts);
  // claim() is INSERT ... ON CONFLICT DO NOTHING. Exactly one caller owns creation.
  const campaign = await store.claim({
    ...proposed,
    html: campaignHtml(proposed.html, config.address),
  });
  if (!campaign)
    return { status: "already_claimed", issue_key: proposed.issue_key };
  try {
    const broadcast = await provider.create({
      name: campaign.issue_key,
      segment_id: config.segmentId,
      from: config.from,
      reply_to: config.replyTo,
      subject: campaign.title,
      html: campaign.html,
      send: false,
    });
    if (!UUID.test(broadcast.id || ""))
      throw new Error("invalid_broadcast_response");
    // Persist ID before any send. An uncertain draft creation can never accidentally send.
    await store.update(campaign.id, {
      resend_broadcast_id: broadcast.id,
      status: "draft",
    });
    if (config.mode !== "send")
      return {
        status: "draft",
        campaign_id: campaign.id,
        broadcast_id: broadcast.id,
      };
    // Freeze the fact that a send was attempted before contacting the provider.
    await store.update(campaign.id, { status: "sending" });
    await provider.send(broadcast.id);
    return await reconcileCampaign({
      store,
      provider,
      campaign: {
        ...campaign,
        status: "sending",
        resend_broadcast_id: broadcast.id,
      },
    });
  } catch (error) {
    // No blind retry of create/send: the provider may have accepted a timed-out request.
    await store.update(campaign.id, {
      status: "needs_review",
      error_code: "provider_or_storage_failure",
    });
    throw new Error("campaign_needs_review", { cause: error });
  }
}
export async function reconcileCampaign({ store, provider, campaign }) {
  if (campaign.status === "sent")
    return { status: "sent", campaign_id: campaign.id };
  if (!campaign.resend_broadcast_id)
    return { status: "needs_review", campaign_id: campaign.id };
  const remote = await provider.get(campaign.resend_broadcast_id);
  if (remote.status === "sent" && remote.sent_at) {
    await store.complete(campaign.id, campaign.resend_broadcast_id);
    return { status: "sent", campaign_id: campaign.id };
  }
  // A preview draft is never implicitly sent by a later scheduled execution.
  return {
    status:
      remote.status === "draft"
        ? (campaign.status === "draft" ? "draft" : "needs_review")
        : ["queued", "scheduled", "sending"].includes(remote.status)
          ? "sending"
          : "needs_review",
    campaign_id: campaign.id,
    broadcast_id: campaign.resend_broadcast_id,
  };
}
