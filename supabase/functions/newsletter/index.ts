import { Webhook } from "npm:svix@2.4.0";
import { database, resend } from "./adapters.mjs";
import { createHandler } from "./handler.mjs";

const env = (name: string) => Deno.env.get(name) || "";
const db = database(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
const provider = resend(env("RESEND_API_KEY"));
const config = {
  enabled: env("NEWSLETTER_SENDING_ENABLED") === "true",
  mode: env("NEWSLETTER_MODE") || "draft",
  segmentId: env("RESEND_NEWSLETTER_SEGMENT_ID"),
  from: env("NEWSLETTER_FROM"),
  replyTo: env("NEWSLETTER_REPLY_TO"),
  address: env("NEWSLETTER_POSTAL_ADDRESS"),
  maxContacts: 1000,
};

Deno.serve(
  createHandler({
    env,
    db,
    provider,
    config,
    verifyWebhook: (raw: string, headers: Record<string, string>) => {
      new Webhook(env("RESEND_WEBHOOK_SECRET")).verify(raw, headers);
      return JSON.parse(raw);
    },
  }),
);
