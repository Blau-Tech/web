import assert from 'node:assert/strict';

import {
  ALL_DISCOVERY_FILTERS,
  DISCOVERY_FILTER_QUERY_KEYS,
  DISCOVERY_FILTER_SCHEMA_VERSION,
  DISCOVERY_FILTER_STORAGE_KEY,
  discoveryFiltersFromMemberPreferences,
  hasExplicitDiscoveryFilterSearch,
  isValidDiscoveryFilters,
  normalizeDiscoveryCities,
  normalizeDiscoveryFilters,
  normalizeDiscoveryOpportunityTypes,
  parseDiscoveryFilterSearch,
  serializeDiscoveryFilterSearch,
} from '../src/lib/discovery/discoveryFilterContract.js';

assert.equal(DISCOVERY_FILTER_SCHEMA_VERSION, 1);
assert.equal(DISCOVERY_FILTER_STORAGE_KEY, 'blautech.discovery.filters.v1');
assert.deepEqual(DISCOVERY_FILTER_QUERY_KEYS, {
  cities: 'cities',
  opportunityTypes: 'types',
});

assert.deepEqual(ALL_DISCOVERY_FILTERS, {
  cities: ['BERLIN', 'MUNICH'],
  opportunityTypes: ['events', 'hackathons', 'programs'],
});
assert(Object.isFrozen(ALL_DISCOVERY_FILTERS));
assert(Object.isFrozen(ALL_DISCOVERY_FILTERS.cities));
assert(Object.isFrozen(ALL_DISCOVERY_FILTERS.opportunityTypes));

assert.deepEqual(
  normalizeDiscoveryCities(['munich', 'BERLIN', 'munich']),
  ['BERLIN', 'MUNICH'],
);
assert.deepEqual(
  normalizeDiscoveryOpportunityTypes(['Programs', 'events', 'programs']),
  ['events', 'programs'],
);
assert.deepEqual(
  normalizeDiscoveryFilters({
    cities: [' berlin '],
    opportunityTypes: ['hackathons', 'events'],
  }),
  {
    cities: ['BERLIN'],
    opportunityTypes: ['events', 'hackathons'],
  },
);
const normalizedFilters = normalizeDiscoveryFilters({
  cities: ['BERLIN'],
  opportunityTypes: ['events'],
});
assert(Object.isFrozen(normalizedFilters));
assert(Object.isFrozen(normalizedFilters.cities));
assert(Object.isFrozen(normalizedFilters.opportunityTypes));

const memberFilters = discoveryFiltersFromMemberPreferences({
  cityCode: 'munich',
  opportunityTypes: ['programs', 'events'],
});
assert.deepEqual(
  memberFilters,
  {
    cities: ['MUNICH'],
    opportunityTypes: ['events', 'programs'],
  },
);
assert(Object.isFrozen(memberFilters));
assert(Object.isFrozen(memberFilters.cities));
assert(Object.isFrozen(memberFilters.opportunityTypes));

assert.equal(hasExplicitDiscoveryFilterSearch(''), false);
assert.equal(hasExplicitDiscoveryFilterSearch('?utm_source=community'), false);
assert.equal(hasExplicitDiscoveryFilterSearch('?cities='), true);
assert.equal(hasExplicitDiscoveryFilterSearch('?types=events'), true);

assert.equal(isValidDiscoveryFilters({
  cities: ['BERLIN'],
  opportunityTypes: ['events'],
}), true);
assert.equal(isValidDiscoveryFilters({
  cities: [],
  opportunityTypes: ['events'],
}), false);
assert.equal(isValidDiscoveryFilters({
  cities: ['MADRID'],
  opportunityTypes: ['events'],
}), false);
assert.equal(isValidDiscoveryFilters({
  cities: ['BERLIN'],
  opportunityTypes: [],
}), false);

assert.equal(parseDiscoveryFilterSearch(''), null);
assert.equal(parseDiscoveryFilterSearch('?utm_source=community'), null);
assert.deepEqual(
  parseDiscoveryFilterSearch('?cities=munich&types=programs,events'),
  {
    cities: ['MUNICH'],
    opportunityTypes: ['events', 'programs'],
  },
);
assert.deepEqual(
  parseDiscoveryFilterSearch('?types=events'),
  {
    cities: ['BERLIN', 'MUNICH'],
    opportunityTypes: ['events'],
  },
);
assert.deepEqual(
  parseDiscoveryFilterSearch('?cities=munich&cities=berlin&types=events&types=hackathons'),
  {
    cities: ['BERLIN', 'MUNICH'],
    opportunityTypes: ['events', 'hackathons'],
  },
);
assert.deepEqual(
  parseDiscoveryFilterSearch('?cities=madrid,berlin&types=jobs,events'),
  {
    cities: ['BERLIN'],
    opportunityTypes: ['events'],
  },
);
assert.deepEqual(
  parseDiscoveryFilterSearch('?cities=madrid&types=jobs'),
  ALL_DISCOVERY_FILTERS,
);
assert.deepEqual(
  parseDiscoveryFilterSearch('?cities=&types='),
  ALL_DISCOVERY_FILTERS,
);
const parsedFilters = parseDiscoveryFilterSearch('?cities=berlin&types=events');
assert(Object.isFrozen(parsedFilters));
assert(Object.isFrozen(parsedFilters.cities));
assert(Object.isFrozen(parsedFilters.opportunityTypes));

assert.equal(
  serializeDiscoveryFilterSearch({
    cities: ['munich'],
    opportunityTypes: ['programs', 'events'],
  }),
  '?cities=munich&types=events,programs',
);
const allSearch = serializeDiscoveryFilterSearch(ALL_DISCOVERY_FILTERS);
assert.equal(
  allSearch,
  '?cities=berlin,munich&types=events,hackathons,programs',
);
assert.deepEqual(parseDiscoveryFilterSearch(allSearch), ALL_DISCOVERY_FILTERS);
assert.deepEqual(
  parseDiscoveryFilterSearch(serializeDiscoveryFilterSearch({
    cities: ['BERLIN'],
    opportunityTypes: ['events', 'hackathons'],
  })),
  {
    cities: ['BERLIN'],
    opportunityTypes: ['events', 'hackathons'],
  },
);

for (const invalidValue of [
  null,
  [],
  {},
  { cities: 'BERLIN', opportunityTypes: ['events'] },
  { cities: ['BERLIN'], opportunityTypes: 'events' },
]) {
  assert.throws(() => normalizeDiscoveryFilters(invalidValue));
}

assert.throws(() => parseDiscoveryFilterSearch(null), TypeError);

console.log('Discovery filter contract checks passed.');
