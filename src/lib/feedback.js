export const FEEDBACK_LIMITS = Object.freeze({
  name: 80,
  email: 254,
  feedback: 4000,
  pagePath: 500,
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeFeedbackDraft(draft = {}) {
  return Object.freeze({
    name: String(draft.name ?? '').trim(),
    email: String(draft.email ?? '').trim().toLowerCase(),
    feedback: String(draft.feedback ?? '').trim(),
    website: String(draft.website ?? '').trim(),
  });
}

export function validateFeedbackDraft(draft = {}) {
  const value = normalizeFeedbackDraft(draft);
  const errors = {};

  if (!value.name) errors.name = 'Please add your name.';
  else if (value.name.length > FEEDBACK_LIMITS.name) errors.name = 'Keep your name under 80 characters.';

  if (!value.email) errors.email = 'Please add your email.';
  else if (value.email.length > FEEDBACK_LIMITS.email || !EMAIL_PATTERN.test(value.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!value.feedback) errors.feedback = 'Tell us what you think.';
  else if (value.feedback.length > FEEDBACK_LIMITS.feedback) {
    errors.feedback = 'Keep your feedback under 4,000 characters.';
  }

  return Object.freeze({
    ok: Object.keys(errors).length === 0,
    errors: Object.freeze(errors),
    value,
  });
}

export async function submitProductFeedback(supabaseClient, draft, pagePath = '/') {
  const validation = validateFeedbackDraft(draft);
  if (!validation.ok) {
    return Object.freeze({ ok: false, code: 'validation_failed', errors: validation.errors });
  }

  // A filled hidden field is almost certainly an automated submission. Return
  // success without storing it so bots do not learn that they were detected.
  if (validation.value.website) {
    return Object.freeze({ ok: true, code: null });
  }

  try {
    const { error } = await supabaseClient.rpc('submit_product_feedback', {
      p_name: validation.value.name,
      p_email: validation.value.email,
      p_feedback: validation.value.feedback,
      p_page_path: String(pagePath || '/').slice(0, FEEDBACK_LIMITS.pagePath),
    });

    if (!error) return Object.freeze({ ok: true, code: null });

    const rateLimited = error.message?.includes('feedback_rate_limit');
    return Object.freeze({
      ok: false,
      code: rateLimited ? 'rate_limited' : 'submission_failed',
      errors: Object.freeze({}),
    });
  } catch {
    return Object.freeze({ ok: false, code: 'submission_failed', errors: Object.freeze({}) });
  }
}
