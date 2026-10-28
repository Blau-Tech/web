export const DIALOG_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getDialogFocusableElements(container) {
  if (!container?.querySelectorAll) return [];

  return Array.from(container.querySelectorAll(DIALOG_FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.disabled
      && !element.hasAttribute?.('disabled')
      && element.getAttribute?.('aria-hidden') !== 'true'
      && element.getClientRects?.().length > 0,
  );
}

export function resolveDialogTabTargetIndex({
  activeIndex,
  focusableCount,
  shiftKey,
}) {
  if (focusableCount <= 0) return -1;

  if (activeIndex < 0 || activeIndex >= focusableCount) {
    return shiftKey ? focusableCount - 1 : 0;
  }

  if (shiftKey && activeIndex === 0) return focusableCount - 1;
  if (!shiftKey && activeIndex === focusableCount - 1) return 0;

  return null;
}
