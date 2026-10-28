import {
  MEMBER_CITY_CODES,
  normalizeMemberCityCode,
  normalizeMemberPreferences,
  normalizeOpportunityTypeCode,
  normalizeOpportunityTypes,
  OPPORTUNITY_TYPE_CODES,
} from '../member/memberPreferenceContract.js';

export const DISCOVERY_FILTER_SCHEMA_VERSION = 1;
export const DISCOVERY_FILTER_STORAGE_KEY = 'blautech.discovery.filters.v1';
export const DISCOVERY_FILTER_QUERY_KEYS = Object.freeze({
  cities: 'cities',
  opportunityTypes: 'types',
});

function freezeFilters(cities, opportunityTypes) {
  return Object.freeze({
    cities: Object.freeze([...cities]),
    opportunityTypes: Object.freeze([...opportunityTypes]),
  });
}

export function normalizeDiscoveryCities(values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Discovery cities must be an array.');
  }

  if (values.length === 0) {
    throw new RangeError('Choose at least one discovery city.');
  }

  const selected = new Set(Array.from(values, normalizeMemberCityCode));
  return Object.freeze(
    MEMBER_CITY_CODES.filter((cityCode) => selected.has(cityCode)),
  );
}

export function normalizeDiscoveryOpportunityTypes(values) {
  return normalizeOpportunityTypes(values);
}

export function normalizeDiscoveryFilters(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Discovery filters must be an object.');
  }

  return freezeFilters(
    normalizeDiscoveryCities(value.cities),
    normalizeDiscoveryOpportunityTypes(value.opportunityTypes),
  );
}

export const ALL_DISCOVERY_FILTERS = freezeFilters(
  MEMBER_CITY_CODES,
  OPPORTUNITY_TYPE_CODES,
);

export function discoveryFiltersFromMemberPreferences(value) {
  const preferences = normalizeMemberPreferences(value);
  return freezeFilters([preferences.cityCode], preferences.opportunityTypes);
}

export function isValidDiscoveryFilters(value) {
  try {
    normalizeDiscoveryFilters(value);
    return true;
  } catch {
    return false;
  }
}

function searchParams(search = '') {
  if (search instanceof URLSearchParams) return search;
  if (typeof search !== 'string') {
    throw new TypeError('Discovery filter search must be a string or URLSearchParams.');
  }

  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

function rawSearchValues(params, key) {
  return params
    .getAll(key)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function hasExplicitDiscoveryFilterSearch(search = '') {
  const params = searchParams(search);
  return params.has(DISCOVERY_FILTER_QUERY_KEYS.cities)
    || params.has(DISCOVERY_FILTER_QUERY_KEYS.opportunityTypes);
}

function safeSearchSelection(params, key, canonicalValues, normalizeValue) {
  const rawValues = rawSearchValues(params, key);
  if (rawValues.length === 0) return canonicalValues;

  const selected = new Set();
  for (const rawValue of rawValues) {
    try {
      selected.add(normalizeValue(rawValue));
    } catch {
      // Public URLs are user-controlled. Ignore unsupported values and keep
      // every valid value instead of turning a malformed link into an error.
    }
  }

  if (selected.size === 0) return canonicalValues;
  return canonicalValues.filter((value) => selected.has(value));
}

export function parseDiscoveryFilterSearch(search = '') {
  const params = searchParams(search);
  if (!hasExplicitDiscoveryFilterSearch(params)) return null;

  return freezeFilters(
    safeSearchSelection(
      params,
      DISCOVERY_FILTER_QUERY_KEYS.cities,
      MEMBER_CITY_CODES,
      normalizeMemberCityCode,
    ),
    safeSearchSelection(
      params,
      DISCOVERY_FILTER_QUERY_KEYS.opportunityTypes,
      OPPORTUNITY_TYPE_CODES,
      normalizeOpportunityTypeCode,
    ),
  );
}

export function serializeDiscoveryFilterSearch(value) {
  const filters = normalizeDiscoveryFilters(value);
  const cities = filters.cities.map((cityCode) => cityCode.toLowerCase()).join(',');
  const opportunityTypes = filters.opportunityTypes.join(',');

  return `?${DISCOVERY_FILTER_QUERY_KEYS.cities}=${cities}`
    + `&${DISCOVERY_FILTER_QUERY_KEYS.opportunityTypes}=${opportunityTypes}`;
}
