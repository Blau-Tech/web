import {
  buildOpportunityQueryPlan,
  normalizeOpportunityTypes,
  OPPORTUNITY_TYPE_CONFIG,
} from './memberPreferenceContract.js';
import {
  discoveryFiltersFromMemberPreferences,
  normalizeDiscoveryFilters,
} from '../discovery/discoveryFilterContract.js';
import {
  filterItems,
  normalizeEvent,
  normalizeOpportunity,
  sortByDate,
} from '../discovery/discover.js';

const NORMALIZERS = Object.freeze({
  normalizeEvent,
  normalizeOpportunity,
});

function normalizeIdentityValue(value) {
  return value == null
    ? ''
    : String(value).normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function discoveryItemIdentity(item) {
  const title = normalizeIdentityValue(item?.title);
  const date = normalizeIdentityValue(item?.date);
  const time = normalizeIdentityValue(item?.time);
  const organizer = normalizeIdentityValue(item?.organizer);
  const location = normalizeIdentityValue(item?.location);

  // A title and date alone can describe multiple real listings. Require at
  // least one additional event-specific value before applying semantic
  // deduplication; otherwise only an identical source primary key is removed.
  if (!title || !date || (!time && !organizer && !location)) return null;

  return [
    item?.source,
    item?.category,
    item?.programType,
    item?.opportunityType,
    title,
    date,
    time,
    item?.endDate,
    item?.endTime,
    organizer,
    location,
    item?.format,
  ].map(normalizeIdentityValue).join('\u001f');
}

export function deduplicateMemberDiscoveryItems(items) {
  if (!Array.isArray(items)) throw new TypeError('Discovery items must be an array.');

  const seenPrimaryKeys = new Set();
  const seenIdentities = new Set();

  return items.filter((item) => {
    const source = normalizeIdentityValue(item?.source);
    const id = normalizeIdentityValue(item?.id);
    const primaryKey = source && id ? `${source}\u001f${id}` : null;
    const identity = discoveryItemIdentity(item);

    if (primaryKey && seenPrimaryKeys.has(primaryKey)) return false;
    if (identity && seenIdentities.has(identity)) return false;

    if (primaryKey) seenPrimaryKeys.add(primaryKey);
    if (identity) seenIdentities.add(identity);
    return true;
  });
}

async function fetchOpportunityType(client, cityCode, opportunityType) {
  const plan = buildOpportunityQueryPlan(cityCode, opportunityType);
  let query = client.from(plan.table).select('*');

  for (const filter of plan.equalFilters) {
    query = query.eq(filter.column, filter.value);
  }

  query = query.or(plan.orFilter);
  const { column, ...orderOptions } = plan.order;
  const result = await query.order(column, orderOptions);

  if (result.error) throw result.error;

  const normalize = NORMALIZERS[plan.normalizer];
  return (result.data || []).map((row) => normalize(row, plan.normalizerCategory));
}

export async function fetchDiscoveryItems(client, value) {
  if (!client?.from) throw new TypeError('A Supabase client is required.');

  const filters = normalizeDiscoveryFilters(value);
  const itemGroups = await Promise.all(
    filters.cities.flatMap((cityCode) => (
      filters.opportunityTypes.map((opportunityType) => (
        fetchOpportunityType(client, cityCode, opportunityType)
      ))
    )),
  );

  return sortByDate(deduplicateMemberDiscoveryItems(itemGroups.flat()));
}

export function fetchMemberDiscoveryItems(client, value) {
  return fetchDiscoveryItems(client, discoveryFiltersFromMemberPreferences(value));
}

export function discoveryTablesForOpportunityTypes(values) {
  const types = normalizeOpportunityTypes(values);
  const tables = types.map((typeCode) => OPPORTUNITY_TYPE_CONFIG[typeCode].table);
  return Object.freeze([...new Set(tables)]);
}

export function filterMemberDiscoveryItems(items, mode) {
  const upcomingItems = filterItems(items, { category: 'all' });

  if (mode === 'events' || mode === 'hackathons') {
    return upcomingItems.filter((item) => item.category === mode);
  }

  if (mode === 'programs') {
    return upcomingItems.filter((item) => item.programType === 'program');
  }

  throw new RangeError(`Unsupported discovery mode: ${mode}`);
}
