import {
  ALL_DISCOVERY_FILTERS,
  DISCOVERY_FILTER_QUERY_KEYS,
  DISCOVERY_FILTER_SCHEMA_VERSION,
  DISCOVERY_FILTER_STORAGE_KEY,
  normalizeDiscoveryFilters,
  serializeDiscoveryFilterSearch,
} from './discoveryFilterContract.js';

export const DISCOVERY_FILTER_SOURCE = Object.freeze({
  URL: 'url',
  BROWSER: 'browser',
  DEFAULT: 'default',
});

function filterState(source, filters) {
  return Object.freeze({ source, filters });
}

function safelyNormalizeFilters(value) {
  try {
    return normalizeDiscoveryFilters(value);
  } catch {
    return null;
  }
}

export function discoveryFiltersEqual(left, right) {
  if (!left || !right) return left === right;
  return left.cities.length === right.cities.length
    && left.opportunityTypes.length === right.opportunityTypes.length
    && left.cities.every((cityCode, index) => cityCode === right.cities[index])
    && left.opportunityTypes.every(
      (typeCode, index) => typeCode === right.opportunityTypes[index],
    );
}

export function serializeStoredDiscoveryFilters(value) {
  const filters = normalizeDiscoveryFilters(value);
  return JSON.stringify({
    schemaVersion: DISCOVERY_FILTER_SCHEMA_VERSION,
    cities: filters.cities,
    opportunityTypes: filters.opportunityTypes,
  });
}

export function parseStoredDiscoveryFilters(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const stored = JSON.parse(value);
    if (
      !stored
      || typeof stored !== 'object'
      || Array.isArray(stored)
      || stored.schemaVersion !== DISCOVERY_FILTER_SCHEMA_VERSION
    ) {
      return null;
    }

    return safelyNormalizeFilters(stored);
  } catch {
    return null;
  }
}

export function readStoredDiscoveryFilters(storage) {
  if (!storage?.getItem) return null;

  try {
    return parseStoredDiscoveryFilters(storage.getItem(DISCOVERY_FILTER_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredDiscoveryFilters(storage, value) {
  if (!storage?.setItem) return false;

  try {
    storage.setItem(DISCOVERY_FILTER_STORAGE_KEY, serializeStoredDiscoveryFilters(value));
    return true;
  } catch {
    return false;
  }
}

export function resolveDiscoveryFilterState({
  urlFilters = null,
  storedFilters = null,
} = {}) {
  const normalizedUrlFilters = safelyNormalizeFilters(urlFilters);
  if (normalizedUrlFilters) {
    return filterState(DISCOVERY_FILTER_SOURCE.URL, normalizedUrlFilters);
  }

  const normalizedStoredFilters = safelyNormalizeFilters(storedFilters);
  if (normalizedStoredFilters) {
    return filterState(DISCOVERY_FILTER_SOURCE.BROWSER, normalizedStoredFilters);
  }

  return filterState(DISCOVERY_FILTER_SOURCE.DEFAULT, ALL_DISCOVERY_FILTERS);
}

export function mergeDiscoveryFilterSearch(search, value) {
  const extras = new URLSearchParams(
    typeof search === 'string' && search.startsWith('?') ? search.slice(1) : search,
  );
  extras.delete(DISCOVERY_FILTER_QUERY_KEYS.cities);
  extras.delete(DISCOVERY_FILTER_QUERY_KEYS.opportunityTypes);

  const filterSearch = serializeDiscoveryFilterSearch(value).slice(1);
  const extraSearch = extras.toString();
  return `?${extraSearch ? `${filterSearch}&${extraSearch}` : filterSearch}`;
}
