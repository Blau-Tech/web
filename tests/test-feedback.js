import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  FEEDBACK_LIMITS,
  normalizeFeedbackDraft,
  submitProductFeedback,
  validateFeedbackDraft,
} from '../src/lib/feedback.js';

assert.deepEqual(normalizeFeedbackDraft({
  name: '  Ada Lovelace ',
  email: ' ADA@EXAMPLE.COM ',
  feedback: '  More filters, please. ',
}), {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  feedback: 'More filters, please.',
  website: '',
});

assert.equal(validateFeedbackDraft({}).ok, false);
assert.deepEqual(Object.keys(validateFeedbackDraft({}).errors), ['name', 'email', 'feedback']);
assert.equal(validateFeedbackDraft({
  name: 'Ada',
  email: 'ada@example.com',
  feedback: 'More filters, please.',
}).ok, true);
assert.equal(validateFeedbackDraft({
  name: 'Ada',
  email: 'not-an-email',
  feedback: 'Hello',
}).errors.email, 'Enter a valid email address.');
assert.equal(validateFeedbackDraft({
  name: 'Ada',
  email: 'ada@example.com',
  feedback: 'x'.repeat(FEEDBACK_LIMITS.feedback + 1),
}).errors.feedback, 'Keep your feedback under 4,000 characters.');

let submittedPayload = null;
const successfulClient = {
  async rpc(name, payload) {
    submittedPayload = { name, payload };
    return { error: null };
  },
};

const submitted = await submitProductFeedback(successfulClient, {
  name: ' Ada ',
  email: 'ADA@example.com',
  feedback: ' Great work. ',
}, '/discover/programs?types=programs');
assert.equal(submitted.ok, true);
assert.equal(submittedPayload.name, 'submit_product_feedback');
assert.deepEqual(submittedPayload.payload, {
  p_name: 'Ada',
  p_email: 'ada@example.com',
  p_feedback: 'Great work.',
  p_page_path: '/discover/programs?types=programs',
});

let honeypotCalled = false;
const trapped = await submitProductFeedback({
  async rpc() {
    honeypotCalled = true;
    return { error: null };
  },
}, {
  name: 'Ada',
  email: 'ada@example.com',
  feedback: 'Hello',
  website: 'https://spam.example',
});
assert.equal(trapped.ok, true);
assert.equal(honeypotCalled, false);

const componentSource = readFileSync(new URL('../src/components/feedback/FeedbackWidget.jsx', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
assert(componentSource.includes('aria-haspopup="dialog"'));
assert(componentSource.includes('aria-modal="false"'));
assert(componentSource.includes("event.key !== 'Escape'"));
assert(componentSource.includes('autoComplete="name"'));
assert(componentSource.includes('autoComplete="email"'));
assert(componentSource.includes('aria-busy={status === \'submitting\'}'));
assert(componentSource.includes('if (!isVisible) return null;'));
assert(componentSource.includes("import { GlassButton } from '../ui/glass-button';"));
assert(componentSource.includes('<GlassButton'));
assert(componentSource.includes('contentClassName="feedback-widget__submit-content"'));
assert(!componentSource.includes('Help us improve'));
assert(!componentSource.includes('feedback-widget__privacy-note'));
assert(!componentSource.includes('{draft.feedback.length}/{FEEDBACK_LIMITS.feedback}'));
assert(componentSource.includes('useGSAP'));
assert(componentSource.includes('setIsPanelMounted'));
assert(componentSource.includes('getBoundingClientRect'));
assert(componentSource.includes('targetScaleX'));
assert(componentSource.includes('Any ideas or thoughts on how we could improve?'));
assert(componentSource.includes('size="icon"'));
assert(appSource.includes('<FeedbackWidget />'));
assert(stylesSource.includes('.feedback-widget--visible'));

console.log('Feedback widget checks passed.');
