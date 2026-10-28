// Rows reach the UI from several Supabase tables (events, opportunities,
// organisations). They all stamp `created_at`, so "recently added" is one rule
// applied to that timestamp rather than a per-table notion of freshness.
export const NEW_LISTING_WINDOW_DAYS = 2;

const NEW_LISTING_WINDOW_MS = NEW_LISTING_WINDOW_DAYS * 24 * 60 * 60 * 1000;

function toTimestamp(value) {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (!value) return null;

  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

// A row stamped slightly ahead of the visitor's clock is still a new row, so the
// window is only bounded at the older end.
export function isRecentlyAdded(value, now = new Date()) {
  const createdAt = toTimestamp(value);
  const reference = toTimestamp(now);
  if (createdAt === null || reference === null) return false;
  return createdAt > reference - NEW_LISTING_WINDOW_MS;
}

export function listingCreatedAt(item) {
  if (!item || typeof item !== 'object') return null;
  return item.createdAt ?? item.created_at ?? null;
}

export function isNewListing(item, now = new Date()) {
  return isRecentlyAdded(listingCreatedAt(item), now);
}
