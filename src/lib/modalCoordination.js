export const MODAL_OPEN_REQUEST_EVENT = 'blautech:modal-open-request';

export function hasActiveModal(documentObject = globalThis.document) {
  return Boolean(documentObject?.querySelector?.('[aria-modal="true"]'));
}

export function requestModalOwnership(windowObject = globalThis.window) {
  windowObject?.dispatchEvent?.(new Event(MODAL_OPEN_REQUEST_EVENT));
}
