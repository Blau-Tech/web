import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  getDialogFocusableElements,
  resolveDialogTabTargetIndex,
} from '../src/lib/dialogFocus.js';

assert.equal(
  resolveDialogTabTargetIndex({ activeIndex: -1, focusableCount: 2, shiftKey: false }),
  0,
  'Tab from outside the dialog should enter its first control',
);
assert.equal(
  resolveDialogTabTargetIndex({ activeIndex: -1, focusableCount: 2, shiftKey: true }),
  1,
  'Shift+Tab from outside the dialog should enter its last control',
);
assert.equal(
  resolveDialogTabTargetIndex({ activeIndex: 1, focusableCount: 2, shiftKey: false }),
  0,
  'Tab from the last control should wrap to the first control',
);
assert.equal(
  resolveDialogTabTargetIndex({ activeIndex: 0, focusableCount: 2, shiftKey: true }),
  1,
  'Shift+Tab from the first control should wrap to the last control',
);
assert.equal(
  resolveDialogTabTargetIndex({ activeIndex: 0, focusableCount: 2, shiftKey: false }),
  null,
  'Tab between internal controls should use native browser order',
);
assert.equal(
  resolveDialogTabTargetIndex({ activeIndex: -1, focusableCount: 0, shiftKey: false }),
  -1,
  'A dialog without controls should focus its panel',
);

const visibleControl = {
  getAttribute: () => null,
  getClientRects: () => [{}],
};
const ariaHiddenControl = {
  getAttribute: (name) => (name === 'aria-hidden' ? 'true' : null),
  getClientRects: () => [{}],
};
const visuallyHiddenControl = {
  getAttribute: () => null,
  getClientRects: () => [],
};
const disabledControl = {
  disabled: true,
  getAttribute: () => null,
  getClientRects: () => [{}],
  hasAttribute: (name) => name === 'disabled',
};
const focusableContainer = {
  querySelectorAll: () => [
    visibleControl,
    ariaHiddenControl,
    visuallyHiddenControl,
    disabledControl,
  ],
};

assert.deepEqual(
  getDialogFocusableElements(focusableContainer),
  [visibleControl],
  'Only visible, assistive-technology-accessible controls belong in the focus loop',
);
assert.deepEqual(getDialogFocusableElements(null), []);

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const popupSource = readFileSync(`${repoRoot}src/components/feedback/PopUp.jsx`, 'utf8');

assert(popupSource.includes('aria-modal="true"'));
assert(popupSource.includes('tabIndex={-1}'));
assert(popupSource.includes("event.key === 'Escape'"));
assert(popupSource.includes("event.key !== 'Tab'"));
assert(popupSource.includes("document.addEventListener('keydown', handleKey, true)"));
assert(popupSource.includes('previousTarget.focus({ preventScroll: true })'));
assert.equal(
  popupSource.includes("aria-labelledby={title ? 'popup-title' : undefined}"),
  false,
  'Every dialog instance should use its own React-generated title ID',
);

console.log('Popup accessibility contract checks passed.');
