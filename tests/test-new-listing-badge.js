import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { normalizeEvent, normalizeOpportunity } from '../src/lib/discovery/discover.js';
import {
  NEW_LISTING_WINDOW_DAYS,
  isNewListing,
  isRecentlyAdded,
  listingCreatedAt,
} from '../src/lib/discovery/newListings.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const source = (path) => readFileSync(`${repoRoot}${path}`, 'utf8');

const now = new Date('2026-09-13T12:00:00Z');
const hoursAgo = (hours) => new Date(now.getTime() - (hours * 60 * 60 * 1000)).toISOString();

assert.equal(NEW_LISTING_WINDOW_DAYS, 2, 'the badge covers rows added in the last two days');

// Window boundaries.
assert.equal(isRecentlyAdded(hoursAgo(1), now), true, 'an hour-old row is new');
assert.equal(isRecentlyAdded(hoursAgo(47), now), true, 'a row just inside the window is new');
assert.equal(isRecentlyAdded(hoursAgo(49), now), false, 'a row past the window is not new');
assert.equal(isRecentlyAdded(hoursAgo(48), now), false, 'the window closes exactly at two days');

// Values that must never produce a badge, and clock skew that must.
assert.equal(isRecentlyAdded(null, now), false, 'a missing timestamp is not new');
assert.equal(isRecentlyAdded('', now), false, 'an empty timestamp is not new');
assert.equal(isRecentlyAdded('not a date', now), false, 'an unparsable timestamp is not new');
assert.equal(
  isRecentlyAdded(new Date(now.getTime() + (60 * 1000)), now),
  true,
  'a row stamped slightly ahead of the visitor clock still counts as new',
);

// Rows reach the UI through the discover normalizers, so created_at must survive.
const eventItem = normalizeEvent({
  id: 'd2cb64a1-7d1e-4c66-9a5e-6f0a5d4d9a20',
  name: 'Munich AI Night',
  description: 'An evening of applied AI demos.',
  organisers: 'Blau Tech',
  link: 'https://example.com/ai-night',
  start_date: '2026-09-20',
  start_time: '18:00',
  format: 'IN_PERSON',
  location: 'Munich, Germany',
  created_at: hoursAgo(5),
}, 'events');

assert.equal(eventItem.createdAt, hoursAgo(5), 'normalizeEvent carries created_at to the UI');
assert.equal(isNewListing(eventItem, now), true, 'a freshly added event earns the badge');

const programItem = normalizeOpportunity({
  id: '0f3b4d55-8e2a-4a0e-8a3d-2a9d0c1f77ab',
  opportunity_type: 'PROGRAM',
  title: 'Founders Fellowship',
  organisation: 'Blau Tech',
  description: 'A twelve-week fellowship.',
  url: 'https://example.com/fellowship',
  deadline: '2026-10-01',
  created_at: hoursAgo(96),
});

assert.equal(
  programItem.createdAt,
  hoursAgo(96),
  'normalizeOpportunity carries created_at to the UI',
);
assert.equal(isNewListing(programItem, now), false, 'a four-day-old program has no badge');

// Community pulse rows already expose createdAt; raw Supabase rows use created_at.
assert.equal(listingCreatedAt({ createdAt: hoursAgo(2) }), hoursAgo(2));
assert.equal(listingCreatedAt({ created_at: hoursAgo(2) }), hoursAgo(2));
assert.equal(listingCreatedAt(null), null, 'a missing item has no timestamp');

// A sample or placeholder item without a timestamp must never render the badge.
assert.equal(isNewListing({ title: 'Sample program' }, now), false);

// The badge renders nothing outside the window, so surfaces can mount it freely.
const badgeSource = source('src/components/common/NewListingBadge.jsx');
assert.match(badgeSource, /if \(!isNew\) return null;/, 'the badge renders nothing when not new');
assert.match(badgeSource, /new-listing-badge/, 'the badge carries its shared class');

// Every Supabase-backed listing surface shows the badge.
const surfaces = [
  'src/components/home/CommunityPulse.jsx',
  'src/components/discover/FeaturedOpportunityCard.jsx',
  'src/components/discover/DiscoverAgenda.jsx',
  'src/components/discover/DiscoverTimeline.jsx',
  'src/components/discover/DiscoverCalendar.jsx',
  'src/components/discover/events/EventAgendaRow.jsx',
  'src/components/discover/programs/ProgramCard.jsx',
  'src/components/discover/programs/ClosedProgramRow.jsx',
  'src/pages/discover/MemberDiscoverPage.jsx',
  'src/components/opportunity-detail/OpportunityHero.jsx',
];

for (const path of surfaces) {
  const surface = source(path);
  assert.match(surface, /import NewListingBadge from/, `${path} imports the badge`);
  assert.match(surface, /<NewListingBadge/, `${path} renders the badge`);
}

// The badge stays a tiny rectangle in the brand accent rather than another rounded tag.
const styles = source('src/index.css');
assert.match(styles, /--blau-new: var\(--brand-accent\);/, 'the badge colour is the shared brand accent');
assert.match(styles, /\.new-listing-badge \{[^}]*background: var\(--blau-new\);/);
assert.match(styles, /\.new-listing-badge \{[^}]*border-radius: 3px;/, 'the badge is rectangular');

console.log('New listing badge checks passed.');
