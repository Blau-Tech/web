/**
 * Central error-handling utilities.
 *
 * ─── Functions ───────────────────────────────────────────────────────────────
 *
 * normalizeError(err, resource?)
 *   Converts any thrown value into a user-facing string.
 *
 * handleFetchError(err, setError, resource?)
 *   Standard catch-block body: logs to console and pipes a normalized
 *   message to the component's setError setter.
 */

/**
 * Converts any thrown value into a user-facing error string.
 *
 * @param {unknown} err
 * @param {string} [resource] - e.g. 'events', 'hackathons', 'organisations'
 * @returns {string}
 */
export function normalizeError(err, resource) {
  const base = resource ? `Failed to load ${resource}` : 'Something went wrong';
  if (!err) return `${base}. Please try again later.`;
  const detail =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
      ? err
      : err?.message ?? null;
  return detail ? `${base}: ${detail}` : `${base}. Please try again later.`;
}

/**
 * Standard catch-block body for all data-fetching operations.
 * Logs the error and calls setError with a normalized message.
 *
 * Usage:
 *   } catch (err) {
 *     handleFetchError(err, setError, 'events');
 *   }
 *
 * @param {unknown} err
 * @param {(msg: string) => void} setError
 * @param {string} [resource]
 */
export function handleFetchError(err, setError, resource) {
  console.error(`[fetch:${resource ?? 'unknown'}]`, err);
  setError(normalizeError(err, resource));
}
