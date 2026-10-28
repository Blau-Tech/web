// Live material for the home page's closing section: three totals and the
// listings most recently added to Blau Tech.
import { normalizeEvent, normalizeOpportunity } from './discover.js';

const PUBLISHED_FILTER = Object.freeze({ column: 'is_published', value: true });
const RECENT_EVENT_LIMIT = 10;
const RECENT_PROGRAM_LIMIT = 4;

function applyCityScope(query, table, cityCode) {
  if (!cityCode) return query;
  if (table === 'organisations') return query.eq('city', cityCode);
  if (table === 'events') return query.or(`city.eq.${cityCode},city.is.null`);
  return query.or(`cities.eq.{},cities.cs.{${cityCode}}`);
}

function countQuery(client, table, cityCode, equalFilters = []) {
  let query = client.from(table).select('id', { count: 'exact', head: true });
  for (const filter of equalFilters) query = query.eq(filter.column, filter.value);
  return applyCityScope(query, table, cityCode);
}

function recentQuery(client, table, cityCode, limit) {
  return applyCityScope(client.from(table).select('*').eq('is_published', true), table, cityCode)
    .order('created_at', { ascending: false })
    .limit(limit);
}

function assertResults(results) {
  const failedResult = results.find(({ error }) => error);
  if (failedResult) throw failedResult.error;
}

function timestamp(value) {
  const parsed = Date.parse(value || '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Newest first, and only listings a visitor can still go to or apply for. */
export function recentListings(events, programs, today = new Date()) {
  const isoToday = today.toISOString().slice(0, 10);
  return [
    ...events.map((row) => normalizeEvent(row)).filter((item) => item.date && item.date >= isoToday),
    ...programs.map((row) => normalizeOpportunity(row)).filter((item) => !item.date || item.date >= isoToday),
  ].sort((first, second) => timestamp(second.createdAt) - timestamp(first.createdAt));
}

export async function fetchCommunityPulse(client, cityCode = null, today = new Date()) {
  if (!client?.from) throw new TypeError('A Supabase client is required.');

  const results = await Promise.all([
    countQuery(client, 'events', cityCode, [PUBLISHED_FILTER]),
    countQuery(client, 'organisations', cityCode),
    countQuery(client, 'organisations', cityCode, [{ column: 'type', value: 'COMMUNITY' }]),
    recentQuery(client, 'events', cityCode, RECENT_EVENT_LIMIT),
    recentQuery(client, 'opportunities', cityCode, RECENT_PROGRAM_LIMIT),
  ]);
  assertResults(results);

  const [events, organisations, communities, recentEvents, recentPrograms] = results;
  return {
    stats: [
      { label: 'Events and hackathons', value: events.count ?? 0 },
      { label: 'Organisations', value: organisations.count ?? 0 },
      { label: 'Communities', value: communities.count ?? 0 },
    ],
    recent: recentListings(recentEvents.data || [], recentPrograms.data || [], today),
  };
}
