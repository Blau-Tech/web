import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  ALL_DISCOVERY_FILTERS,
  DISCOVERY_FILTER_STORAGE_KEY,
  parseDiscoveryFilterSearch,
  serializeDiscoveryFilterSearch,
} from '../src/lib/discovery/discoveryFilterContract.js';
import {
  DISCOVERY_FILTER_SOURCE,
  discoveryFiltersEqual,
  mergeDiscoveryFilterSearch,
  parseStoredDiscoveryFilters,
  readStoredDiscoveryFilters,
  resolveDiscoveryFilterState,
  serializeStoredDiscoveryFilters,
  writeStoredDiscoveryFilters,
} from '../src/lib/discovery/guestDiscoveryFilters.js';

const berlinEvents = Object.freeze({
  cities: Object.freeze(['BERLIN']),
  opportunityTypes: Object.freeze(['events']),
});
const munichPrograms = Object.freeze({
  cities: Object.freeze(['MUNICH']),
  opportunityTypes: Object.freeze(['programs']),
});

const storedValue = serializeStoredDiscoveryFilters(berlinEvents);
assert.deepEqual(JSON.parse(storedValue), {
  schemaVersion: 1,
  cities: ['BERLIN'],
  opportunityTypes: ['events'],
});
assert.deepEqual(parseStoredDiscoveryFilters(storedValue), berlinEvents);
assert.equal(parseStoredDiscoveryFilters(''), null);
assert.equal(parseStoredDiscoveryFilters('{not-json'), null);
assert.equal(parseStoredDiscoveryFilters(JSON.stringify({
  schemaVersion: 2,
  cities: ['BERLIN'],
  opportunityTypes: ['events'],
})), null);
assert.equal(parseStoredDiscoveryFilters(JSON.stringify({
  schemaVersion: 1,
  cities: ['MADRID'],
  opportunityTypes: ['events'],
})), null);
assert.equal(parseStoredDiscoveryFilters(JSON.stringify({
  schemaVersion: 1,
  cities: ['BERLIN'],
  opportunityTypes: [],
})), null);

const memoryStorage = {
  value: null,
  getItem(key) {
    assert.equal(key, DISCOVERY_FILTER_STORAGE_KEY);
    return this.value;
  },
  setItem(key, value) {
    assert.equal(key, DISCOVERY_FILTER_STORAGE_KEY);
    this.value = value;
  },
};
assert.equal(writeStoredDiscoveryFilters(memoryStorage, munichPrograms), true);
assert.deepEqual(readStoredDiscoveryFilters(memoryStorage), munichPrograms);
assert.equal(writeStoredDiscoveryFilters({ setItem() { throw new Error('denied'); } }, berlinEvents), false);
assert.equal(readStoredDiscoveryFilters({ getItem() { throw new Error('denied'); } }), null);

const explicitAll = parseDiscoveryFilterSearch(
  serializeDiscoveryFilterSearch(ALL_DISCOVERY_FILTERS),
);
assert.deepEqual(resolveDiscoveryFilterState({
  urlFilters: explicitAll,
  storedFilters: munichPrograms,
}), {
  source: DISCOVERY_FILTER_SOURCE.URL,
  filters: ALL_DISCOVERY_FILTERS,
});
assert.deepEqual(resolveDiscoveryFilterState({ storedFilters: munichPrograms }), {
  source: DISCOVERY_FILTER_SOURCE.BROWSER,
  filters: munichPrograms,
});
assert.deepEqual(resolveDiscoveryFilterState(), {
  source: DISCOVERY_FILTER_SOURCE.DEFAULT,
  filters: ALL_DISCOVERY_FILTERS,
});
assert.deepEqual(resolveDiscoveryFilterState({
  urlFilters: { cities: ['MADRID'], opportunityTypes: ['events'] },
  storedFilters: munichPrograms,
}), {
  source: DISCOVERY_FILTER_SOURCE.BROWSER,
  filters: munichPrograms,
});

assert.equal(discoveryFiltersEqual(berlinEvents, {
  cities: ['BERLIN'],
  opportunityTypes: ['events'],
}), true);
assert.equal(discoveryFiltersEqual(berlinEvents, munichPrograms), false);
assert.equal(
  mergeDiscoveryFilterSearch('?utm_source=whatsapp&cities=munich&types=programs', berlinEvents),
  '?cities=berlin&types=events&utm_source=whatsapp',
);

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const contextSource = readFileSync(
  new URL('../src/lib/discovery/discoveryFilterContext.jsx', import.meta.url),
  'utf8',
);
const cityContextSource = readFileSync(
  new URL('../src/lib/city/cityContext.jsx', import.meta.url),
  'utf8',
);
assert.match(
  appSource,
  /<Router>[\s\S]*<DiscoveryFilterProvider>[\s\S]*<CityProvider>/,
);
assert.match(
  cityContextSource,
  /const \{ filters: discoveryFilters \} = useDiscoveryFilters\(\)/,
  'discovery queries should consume the persisted filter state',
);
assert.match(contextSource, /window\.addEventListener\('storage', handleStorage\)/);
assert.match(contextSource, /window\.removeEventListener\('storage', handleStorage\)/);
assert.match(
  contextSource,
  /isDiscoveryRoute \? parseDiscoveryFilterSearch\(location\.search\) : null/,
);
assert.match(
  contextSource,
  /providerGeneratedRouteRef\.current = `\$\{location\.pathname\}\$\{nextSearch\}`/,
  'provider-generated URLs should retain their origin until persistence runs',
);
assert.match(
  contextSource,
  /providerGeneratedRouteRef\.current === routeKey[\s\S]*providerGeneratedRouteRef\.current = null;[\s\S]*return;/,
  'stored and default canonical URLs must not overwrite guest storage',
);
const persistEffect = contextSource.match(
  /useEffect\(\(\) => \{\n    if \(!urlFilters\)[\s\S]*?\n  \}, \[location\.pathname, location\.search, urlFilters\]\);/,
)?.[0];
assert(persistEffect, 'URL persistence should be isolated in a URL-driven effect');
assert.doesNotMatch(
  persistEffect,
  /\[.*storedFilters.*\]/,
  'storage events must not retrigger URL persistence in another tab',
);
assert.doesNotMatch(storedValue, /email|token|userId|session/i);

console.log('Guest discovery filter checks passed.');
