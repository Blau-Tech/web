import { useCallback, useState } from "react";

export const NEWSLETTER_ENABLED =
  import.meta.env?.VITE_NEWSLETTER_ENABLED === "true";
// Only kept so confirmation links (/newsletter#token=…) keep working; signup itself is a modal.
export const NEWSLETTER_PATH = "/newsletter";
export const NEWSLETTER_OPEN_EVENT = "blautech:newsletter-open";

export function openNewsletter(email = "") {
  window.dispatchEvent(new CustomEvent(NEWSLETTER_OPEN_EVENT, { detail: { email } }));
}
// Must match CONSENT_VERSION/CONSENT_TEXT in supabase/functions/newsletter/campaign.mjs.
export const NEWSLETTER_CONSENT_VERSION = "2026-09-29-v2";
export const NEWSLETTER_CONSENT_TEXT =
  "I would like to receive the BlauTech Weekly newsletter by email. I can unsubscribe at any time. See our Privacy Policy.";

const ERROR_MESSAGES = {
  invalid_or_expired_link:
    "This link has expired. Enter your email for a new one.",
  newsletter_unavailable:
    "Signup is paused. Try again later.",
  explicit_consent_required:
    "Tick the box to subscribe.",
};
const GENERIC_ERROR = "Something went wrong. Try again.";

export class NewsletterRequestError extends Error {
  constructor(code) {
    super(ERROR_MESSAGES[code] || GENERIC_ERROR);
    this.code = code || "request_failed";
  }
}

export async function newsletterRequest(action, body) {
  let response;
  try {
    response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter/${action}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000),
      },
    );
  } catch {
    throw new NewsletterRequestError("network_error");
  }
  // Gateway failures can return HTML; never surface a JSON parse error to people.
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new NewsletterRequestError(result.error);
  return result;
}

// Shared by the /newsletter page and the footer form so both send the same consent record.
export function useNewsletterSignup() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(async (action, body) => {
    setBusy(true);
    setError("");
    try {
      const result = await newsletterRequest(action, body);
      setStatus(result.status || "check_email");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, []);

  const subscribe = useCallback(
    (event) => {
      event?.preventDefault();
      return run("subscribe", {
        email,
        consent,
        website,
        consent_version: NEWSLETTER_CONSENT_VERSION,
      });
    },
    [run, email, consent, website],
  );

  const confirm = useCallback((token) => run("confirm", { token }), [run]);

  const reset = useCallback(() => {
    setStatus("");
    setError("");
    setConsent(false);
  }, []);

  return {
    email,
    setEmail,
    consent,
    setConsent,
    website,
    setWebsite,
    busy,
    status,
    error,
    setError,
    subscribe,
    confirm,
    reset,
  };
}
