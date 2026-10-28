import assert from 'node:assert/strict';

import {
  fetchPublishedOpportunity,
  normalizeOpportunityKind,
  opportunityCanonicalUrl,
  opportunityDetailPath,
  opportunityListPath,
  slugifyOpportunityTitle,
} from '../src/lib/discovery/opportunityDetail.js';

const event = {
  id: '8e0fc41c-6e69-4dd7-a2db-a7fdf5149411',
  category: 'events',
  title: 'München R&D: AI & Climate',
};

assert.equal(normalizeOpportunityKind('HACKATHONS'), 'hackathons');
assert.equal(normalizeOpportunityKind('scholarships'), null);
assert.equal(slugifyOpportunityTitle(event.title), 'munchen-r-and-d-ai-and-climate');
assert.equal(
  opportunityDetailPath(event, '?cities=MUNICH'),
  '/discover/events/8e0fc41c-6e69-4dd7-a2db-a7fdf5149411/munchen-r-and-d-ai-and-climate?cities=MUNICH',
);
assert.equal(
  opportunityCanonicalUrl(event),
  'https://www.blau-tech.de/discover/events/8e0fc41c-6e69-4dd7-a2db-a7fdf5149411/munchen-r-and-d-ai-and-climate',
);
assert.equal(
  opportunityListPath('events', '?cities=MUNICH&types=programs'),
  '/discover/events?cities=MUNICH&types=events',
);

const filters = [];
const query = {
  select() { return this; },
  eq(column, value) { filters.push([column, value]); return this; },
  async maybeSingle() { return { data: null, error: null }; },
};
const emptyClient = {
  from(table) {
    assert.equal(table, 'opportunities', 'public details never fetch the private review queue');
    return query;
  },
};
assert.deepEqual(
  await fetchPublishedOpportunity(emptyClient, 'programs', '00000000-0000-4000-8000-000000000001'),
  { item: null, error: null },
  'a former sample ID has no public detail unless a published database row exists',
);
assert.deepEqual(filters, [
  ['id', '00000000-0000-4000-8000-000000000001'],
  ['is_published', true],
  ['opportunity_type', 'PROGRAM'],
]);

console.log('Opportunity detail route checks passed.');
