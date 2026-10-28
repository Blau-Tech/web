import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  publishCampaign,
  reconcileCampaign,
  issueKey,
  validateCampaign,
  normalizeEmail,
  campaignHtml,
  CONSENT_TEXT,
  CONSENT_VERSION,
} from "../supabase/functions/newsletter/campaign.mjs";
const id = "11111111-1111-4111-8111-111111111111",
  broadcast = "22222222-2222-4222-8222-222222222222";
const input = {
  publicationDate: "2026-09-14",
  title: "Weekly",
  html: "<p>Content</p>",
  eventIds: [id],
  test_mode: false,
};
const config = {
  enabled: true,
  mode: "send",
  segmentId: id,
  from: "BlauTech <newsletter@example.com>",
  address: "Example street 1",
  maxContacts: 1000,
};
function fixture() {
  let row;
  const calls = [];
  const store = {
    find: async () => row,
    claim: async (data) => {
      if (row) return undefined;
      row = { id, ...data, status: "creating" };
      return { ...row };
    },
    update: async (_, patch) => {
      row = { ...row, ...patch };
    },
    complete: async () => {
      calls.push("complete");
      row.status = "sent";
    },
  };
  const provider = {
    assertAudience: async () => calls.push("audience"),
    create: async () => {
      calls.push("create");
      return { id: broadcast };
    },
    send: async () => calls.push("send"),
    get: async () => ({
      id: broadcast,
      status: "sent",
      sent_at: "2026-09-14T07:00:00Z",
    }),
  };
  return {
    store,
    provider,
    calls,
    row: () => row,
    args: { store, provider, config, input, today: "2026-09-14" },
  };
}
test("preview cannot touch database or provider", async () => {
  const f = fixture();
  f.store.find = () => assert.fail("database accessed");
  const result = await publishCampaign({
    ...f.args,
    input: { ...input, test_mode: true },
    config: { ...config, enabled: false },
  });
  assert.equal(result.status, "preview");
  assert.deepEqual(f.calls, []);
});
test("disabled live sending fails before all side effects", async () => {
  const f = fixture();
  await assert.rejects(
    publishCampaign({ ...f.args, config: { ...config, enabled: false } }),
    /disabled/,
  );
  assert.equal(f.row(), undefined);
  assert.deepEqual(f.calls, []);
});
test("normal send is recorded once, duplicate issue never sends again", async () => {
  const f = fixture();
  assert.equal((await publishCampaign(f.args)).status, "sent");
  assert.equal((await publishCampaign(f.args)).status, "sent");
  assert.deepEqual(f.calls, ["audience", "create", "send", "complete"]);
  assert.match(f.row().html, /RESEND_UNSUBSCRIBE_URL/);
});
test("simultaneous issue requests create a single broadcast", async () => {
  const f = fixture();
  await Promise.all([publishCampaign(f.args), publishCampaign(f.args)]);
  assert.equal(f.calls.filter((x) => x === "create").length, 1);
  assert.equal(f.calls.filter((x) => x === "send").length, 1);
});
test("unknown create outcome is never automatically retried", async () => {
  const f = fixture();
  f.provider.create = async () => {
    f.calls.push("create");
    throw Error("timeout");
  };
  await assert.rejects(publishCampaign(f.args), /needs_review/);
  assert.equal((await publishCampaign(f.args)).status, "needs_review");
  assert.equal(f.calls.filter((x) => x === "create").length, 1);
  assert(!f.calls.includes("send"));
});
test("send timeout reconciles by broadcast id without a second send", async () => {
  const f = fixture();
  f.provider.send = async () => {
    f.calls.push("send");
    throw Error("timeout");
  };
  await assert.rejects(publishCampaign(f.args), /needs_review/);
  assert.equal((await publishCampaign(f.args)).status, "sent");
  assert.equal(f.calls.filter((x) => x === "send").length, 1);
});
test("database failure before storing provider id never sends", async () => {
  const f = fixture();
  const update = f.store.update;
  f.store.update = async (id, patch) => {
    if (patch.resend_broadcast_id) throw Error("db");
    return update(id, patch);
  };
  await assert.rejects(publishCampaign(f.args));
  assert(!f.calls.includes("send"));
  assert.equal((await publishCampaign(f.args)).status, "needs_review");
});
test("provider acceptance alone does not mark listings posted", async () => {
  const f = fixture();
  f.provider.get = async () => ({ status: "queued", sent_at: null });
  assert.equal((await publishCampaign(f.args)).status, "sending");
  assert(!f.calls.includes("complete"));
});
test("draft mode never sends and later mode change does not auto-send the draft", async () => {
  const f = fixture();
  assert.equal(
    (await publishCampaign({ ...f.args, config: { ...config, mode: "draft" } }))
      .status,
    "draft",
  );
  f.provider.get = async () => ({ status: "draft", sent_at: null });
  assert.equal((await publishCampaign(f.args)).status, "draft");
  assert(!f.calls.includes("send"));
});
test("contact cap failure happens before campaign creation", async () => {
  const f = fixture();
  f.provider.assertAudience = async () => {
    throw Error("free_contact_limit_exceeded");
  };
  await assert.rejects(publishCampaign(f.args), /free_contact/);
  assert.equal(f.row(), undefined);
});
test("selection validation rejects stale dates, unsafe IDs and oversized content", () => {
  assert.throws(() => validateCampaign(input, "2026-09-15"), /stale/);
  assert.throws(
    () => validateCampaign({ ...input, eventIds: ["x"] }, "2026-09-14"),
    /selected/,
  );
  assert.throws(
    () =>
      validateCampaign({ ...input, html: "a".repeat(200001) }, "2026-09-14"),
    /content/,
  );
});
test("weekly key is stable across a week and year boundaries", () => {
  assert.equal(issueKey("2026-09-20"), issueKey("2026-09-14"));
  assert.equal(issueKey("2027-01-01"), "blau-tech-weekly:2026-12-28");
  assert.throws(() => issueKey("2026-02-30"));
});
test("email and template boundaries", () => {
  assert.equal(normalizeEmail(" User@Example.com "), "user@example.com");
  for (const s of ["x", "a@b.com\nBcc: hi@x.com", ""])
    assert.throws(() => normalizeEmail(s));
  assert.match(campaignHtml("<p>Hi</p>", "<script>"), /&lt;script&gt;/);
});
test("client and server consent match; signup is opt-in and default-disabled", () => {
  const client = readFileSync(
    new URL("../src/lib/newsletter.js", import.meta.url),
    "utf8",
  );
  assert(client.includes(CONSENT_TEXT));
  assert(client.includes(CONSENT_VERSION));
  assert.match(client, /const \[consent, setConsent\] = useState\(false\)/);
  const ui = readFileSync(
    new URL("../src/components/newsletter/NewsletterModal.jsx", import.meta.url),
    "utf8",
  );
  assert.match(ui, /type="checkbox"[\s\S]*required/);
  assert.match(ui, /useNewsletterSignup\(\)/);
  assert.match(ui, /signup\.confirm\(token\)/);
  const footer = readFileSync(
    new URL("../src/components/layout/SiteFooter.jsx", import.meta.url),
    "utf8",
  );
  // The footer only hands the address to the modal, which collects consent; never an email-in-URL GET.
  assert.match(footer, /openNewsletter\(email\)/);
  assert.doesNotMatch(footer, /method="get"/i);
});
test("the website no longer depends on Beehiiv and keeps newsletter links in-site", async () => {
  const { readdirSync } = await import("node:fs");
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? walk(new URL(entry.name + "/", dir))
        : [new URL(entry.name, dir)],
    );
  for (const file of walk(new URL("../src/", import.meta.url))) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /beehiiv/i, `${file.pathname} references Beehiiv`);
    assert.doesNotMatch(source, /NEWSLETTER_URL/, `${file.pathname} uses the removed NEWSLETTER_URL`);
  }
});
test("confirmation email escapes the site origin and includes a text part", async () => {
  const { confirmationEmail } = await import(
    "../supabase/functions/newsletter/campaign.mjs"
  );
  const email = confirmationEmail({
    site: 'https://example.com/"><script>',
    token: "a".repeat(64),
    address: "<b>Street</b>",
  });
  assert.doesNotMatch(email.html, /<script>|<b>Street/);
  assert.match(email.text, /#token=a{64}/);
  assert.match(email.text, /<b>Street<\/b>/);
});

test("failed/canceled provider campaigns require review rather than appearing in flight", async () => {
  for (const status of ["failed", "canceled", "unknown", "sent"]) {
    const f = fixture();
    f.provider.get = async () => ({status, sent_at: null});
    assert.equal((await publishCampaign(f.args)).status, "needs_review");
    assert(!f.calls.includes("complete"));
  }
});

test("expanded campaign accepts thirteen items and rejects either category overflow", () => {
  const ids = Array.from({length: 11}, (_, i) => `11111111-1111-4111-8111-${String(i).padStart(12, '0')}`);
  const expanded = {...input, eventIds:ids.slice(0,8), hackathonIds:ids.slice(8,10), opportunityIds:ids.slice(0,3)};
  const validated = validateCampaign(expanded, input.publicationDate);
  assert.equal(validated.event_ids.length, 10);
  assert.equal(validated.opportunity_ids.length, 3);
  assert.throws(() => validateCampaign({...expanded,eventIds:ids}, input.publicationDate), /invalid_selected_items/);
  assert.throws(() => validateCampaign({...expanded,opportunityIds:ids.slice(0,4)}, input.publicationDate), /invalid_selected_items/);
});
