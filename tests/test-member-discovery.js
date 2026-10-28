import assert from 'node:assert/strict';

import {
  discoveryTablesForOpportunityTypes,
  fetchDiscoveryItems,
  fetchMemberDiscoveryItems,
  filterMemberDiscoveryItems,
} from '../src/lib/member/memberDiscovery.js';
import { ALL_DISCOVERY_FILTERS } from '../src/lib/discovery/discoveryFilterContract.js';
import { OPPORTUNITY_TYPE_CODES } from '../src/lib/member/memberPreferenceContract.js';
import { createLatestRequestGuard } from '../src/lib/latestRequest.js';

const FUTURE_DATES = Object.freeze({
  EVENT: '2099-01-01',
  HACKATHON: '2099-01-02',
  program: '2099-01-04',
});

const EXPECTED_ITEM_ID_BY_OPPORTUNITY_TYPE = Object.freeze({
  events: 'event-1',
  hackathons: 'hackathon-1',
  programs: 'program-1',
});

function rowsForCall(call) {
  const discriminator = Object.fromEntries(call.equalFilters);

  if (call.table === 'events' && discriminator.event_type === 'EVENT') {
    return [{ id: 'event-1', name: 'City event', start_date: FUTURE_DATES.EVENT }];
  }

  if (call.table === 'events' && discriminator.event_type === 'HACKATHON') {
    return [{ id: 'hackathon-1', name: 'City hackathon', start_date: FUTURE_DATES.HACKATHON }];
  }

  if (call.table === 'opportunities' && discriminator.opportunity_type === 'PROGRAM') {
    return [{
      id: 'program-1',
      title: 'Builder program',
      opportunity_type: 'PROGRAM',
      cities: ['MUNICH'],
      deadline: FUTURE_DATES.program,
    }];
  }

  return [];
}

function createDiscoveryClient({ failTable = null, resolveRows = rowsForCall } = {}) {
  const calls = [];

  return {
    calls,
    client: {
      from(table) {
        const call = {
          table,
          columns: null,
          equalFilters: [],
          orFilter: null,
          order: null,
        };
        calls.push(call);

        const query = {
          select(columns) {
            call.columns = columns;
            return query;
          },
          eq(column, value) {
            call.equalFilters.push([column, value]);
            return query;
          },
          or(filter) {
            call.orFilter = filter;
            return query;
          },
          async order(column, options) {
            call.order = { column, ...options };
            if (table === failTable) {
              return { data: null, error: { code: 'query_failed' } };
            }
            return { data: resolveRows(call), error: null };
          },
        };

        return query;
      },
    },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

const requestGuard = createLatestRequestGuard();
const berlinResponse = deferred();
const munichResponse = deferred();
const committedResponses = [];
const commitWhenCurrent = async (filterKey, response) => {
  const canCommit = requestGuard.begin(filterKey);
  const value = await response;
  if (canCommit()) committedResponses.push(value);
};

requestGuard.activate('berlin|events');
const pendingBerlinCommit = commitWhenCurrent('berlin|events', berlinResponse.promise);
requestGuard.activate('munich|programs');
const pendingMunichCommit = commitWhenCurrent('munich|programs', munichResponse.promise);
munichResponse.resolve('munich-program');
await pendingMunichCommit;
berlinResponse.resolve('berlin-event');
await pendingBerlinCommit;
assert.deepEqual(
  committedResponses,
  ['munich-program'],
  'an older filter response must not overwrite the current discovery selection',
);

const duplicateEventRows = Object.freeze([
  {
    id: 'event-clean-link',
    name: 'Getting European AI Right - with Europe 2031 Co-author Dr. Philip Fox',
    start_date: '2099-01-01',
    start_time: '18:30:00',
    end_date: '2099-01-01',
    end_time: '22:00:00',
    event_type: 'EVENT',
    organisers: 'AI Safety Berlin',
    location: 'Hertie School',
    format: 'IN_PERSON',
    link: 'https://events-b.example/ehhkm7xg?tk=BBAW7P',
  },
  {
    id: 'event-tracked-link',
    name: 'Getting European AI Right - with Europe 2031 Co-author Dr. Philip Fox',
    start_date: '2099-01-01',
    start_time: '18:30:00',
    end_date: '2099-01-01',
    end_time: '22:00:00',
    event_type: 'EVENT',
    organisers: 'AI Safety Berlin',
    location: 'Hertie School',
    format: 'IN_PERSON',
    link: 'https://events-b.example/ehhkm7xg?lm_medium=email&utm_source=example',
  },
]);

const duplicateDiscovery = createDiscoveryClient({
  resolveRows(call) {
    const discriminator = Object.fromEntries(call.equalFilters);
    return call.table === 'events' && discriminator.event_type === 'EVENT'
      ? duplicateEventRows
      : rowsForCall(call);
  },
});
const deduplicatedItems = await fetchMemberDiscoveryItems(duplicateDiscovery.client, {
  cityCode: 'BERLIN',
  opportunityTypes: ['events'],
});
assert.deepEqual(
  deduplicatedItems.map((item) => item.id),
  ['event-clean-link'],
  'separate published rows for the same real event should render once',
);

const distinctEventDiscovery = createDiscoveryClient({
  resolveRows(call) {
    const discriminator = Object.fromEntries(call.equalFilters);
    if (call.table !== 'events' || discriminator.event_type !== 'EVENT') {
      return rowsForCall(call);
    }

    return duplicateEventRows.map((row, index) => ({
      ...row,
      id: `distinct-event-${index + 1}`,
      location: index === 0 ? 'Hertie School' : 'Technical University Berlin',
    }));
  },
});
const distinctItems = await fetchMemberDiscoveryItems(distinctEventDiscovery.client, {
  cityCode: 'BERLIN',
  opportunityTypes: ['events'],
});
assert.deepEqual(
  distinctItems.map((item) => item.id),
  ['distinct-event-1', 'distinct-event-2'],
  'same-name events at different venues must remain separate',
);

for (const cityCode of ['BERLIN', 'MUNICH']) {
  const discovery = createDiscoveryClient();
  const items = await fetchMemberDiscoveryItems(discovery.client, {
    cityCode,
    opportunityTypes: OPPORTUNITY_TYPE_CODES,
  });

  assert.equal(discovery.calls.length, 3);
  assert.deepEqual(items.map((item) => item.id), [
    'event-1',
    'hackathon-1',
    'program-1',
  ]);

  for (const call of discovery.calls) {
    assert.equal(call.columns, '*');
    assert.equal(Object.fromEntries(call.equalFilters).is_published, true);
    assert.match(call.orFilter, new RegExp(cityCode));
  }
}

for (const cityCode of ['BERLIN', 'MUNICH']) {
  for (const opportunityType of OPPORTUNITY_TYPE_CODES) {
    const discovery = createDiscoveryClient();
    const items = await fetchMemberDiscoveryItems(discovery.client, {
      cityCode,
      opportunityTypes: [opportunityType],
    });

    assert.equal(discovery.calls.length, 1);
    assert.deepEqual(items.map((item) => item.id), [
      EXPECTED_ITEM_ID_BY_OPPORTUNITY_TYPE[opportunityType],
    ]);
    assert.equal(Object.fromEntries(discovery.calls[0].equalFilters).is_published, true);
    assert.match(discovery.calls[0].orFilter, new RegExp(cityCode));
  }
}

const publicDiscovery = createDiscoveryClient();
const publicItems = await fetchDiscoveryItems(
  publicDiscovery.client,
  ALL_DISCOVERY_FILTERS,
);
assert.equal(publicDiscovery.calls.length, 6);
assert.deepEqual(publicItems.map((item) => item.id), [
  'event-1',
  'hackathon-1',
  'program-1',
]);
for (const cityCode of ['BERLIN', 'MUNICH']) {
  assert.equal(
    publicDiscovery.calls.filter((call) => call.orFilter.includes(cityCode)).length,
    3,
    `public discovery should query every supported type for ${cityCode}`,
  );
}
for (const call of publicDiscovery.calls) {
  assert.equal(Object.fromEntries(call.equalFilters).is_published, true);
}

assert.deepEqual(
  discoveryTablesForOpportunityTypes(['events', 'hackathons', 'programs']),
  ['events', 'opportunities'],
);

const allItems = await fetchMemberDiscoveryItems(createDiscoveryClient().client, {
  cityCode: 'MUNICH',
  opportunityTypes: OPPORTUNITY_TYPE_CODES,
});
assert.deepEqual(filterMemberDiscoveryItems(allItems, 'events').map((item) => item.id), ['event-1']);
assert.deepEqual(filterMemberDiscoveryItems(allItems, 'hackathons').map((item) => item.id), ['hackathon-1']);
assert.deepEqual(filterMemberDiscoveryItems(allItems, 'programs').map((item) => item.id), ['program-1']);
assert.deepEqual(
  filterMemberDiscoveryItems(allItems, 'programs')[0].audienceCities,
  ['MUNICH'],
  'program normalization should retain real city reach for filters and labels',
);
assert.throws(
  () => filterMemberDiscoveryItems(allItems, 'invalid'),
  /Unsupported discovery mode/,
);

await assert.rejects(
  fetchMemberDiscoveryItems(createDiscoveryClient({ failTable: 'opportunities' }).client, {
    cityCode: 'BERLIN',
    opportunityTypes: ['programs'],
  }),
  (error) => error?.code === 'query_failed',
);
