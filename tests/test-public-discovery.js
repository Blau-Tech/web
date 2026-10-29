import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const source = (path) => readFileSync(`${repoRoot}${path}`, 'utf8');

const appSource = source('src/App.jsx');
const cityContextSource = source('src/lib/city/cityContext.jsx');
const discoverPageSource = source('src/pages/discover/MemberDiscoverPage.jsx');
const eventPageSource = source('src/pages/discover/EventShowcasePage.jsx');
const programPageSource = source('src/pages/discover/ProgramShowcasePage.jsx');
const detailPageSource = source('src/pages/discover/OpportunityDetailPage.jsx');
const studentsLayoutSource = source('src/components/layout/StudentsLayout.jsx');

assert.match(
  appSource,
  /function LegacyDiscoverRedirect[\s\S]*\/discover\/programs[\s\S]*path="\/discover"[\s\S]*<LegacyDiscoverRedirect/,
  'the former public discover route should redirect to the programs experience',
);
assert.doesNotMatch(appSource, /path="\/(?:login|signup|member\/)/);
assert.doesNotMatch(appSource, /AuthProvider|RequireMemberSession/);
assert.doesNotMatch(appSource, /path="\/(?:berlin|munich)"/);
assert.match(appSource, /<MotionConfig reducedMotion="user">/);

assert.match(
  cityContextSource,
  /useDiscoveryFilters\(\)/,
  'public discovery should consume the shared URL and browser filter state',
);
assert.match(cityContextSource, /selectedDiscoveryCityCodes: discoveryFilters\.cities/);
assert.match(cityContextSource, /selectedOpportunityTypes: discoveryFilters\.opportunityTypes/);

assert.match(discoverPageSource, /fetchDiscoveryItems\(supabase, \{/);
assert.match(discoverPageSource, /cities: selectedDiscoveryCityCodes/);
assert.match(discoverPageSource, /href=\{opportunityDetailPath\(item, location\.search\)\}/);
assert.match(discoverPageSource, /animate-pulse[^"]*motion-reduce:animate-none/);
assert.match(
  appSource,
  /path="\/discover\/programs"[\s\S]*<ProgramShowcasePage/,
  'the redesigned programs route should remain available to anonymous visitors',
);
assert.match(programPageSource, /fetchDiscoveryItems\(supabase, \{/);
assert.match(programPageSource, /cities: selectedDiscoveryCityCodes/);
assert.doesNotMatch(programPageSource, /SAMPLE_PROGRAMS|samplePrograms/,
  'an empty approved catalogue must not show sample programs with fabricated application dates');
assert.doesNotMatch(programPageSource, /program[^`'"]*\}\s+open\b/,
  'program totals include upcoming and unknown applications and must not label them open');
assert.doesNotMatch(detailPageSource, /findSampleProgram|samplePrograms/,
  'direct program links must also load a published database row');
assert.doesNotMatch(eventPageSource, /<PopUp/);
assert.doesNotMatch(programPageSource, /<PopUp/);
assert.match(
  appSource,
  /path="\/discover\/events\/:id\/:slug"[\s\S]*path="\/discover\/hackathons\/:id\/:slug"[\s\S]*path="\/discover\/programs\/:id\/:slug"/,
  'events, hackathons, and programs should share indexable detail routes',
);
assert.match(detailPageSource, /EducationalOccupationalProgram/);
assert.match(detailPageSource, /'@type': 'Event'/);
assert.match(detailPageSource, /application\/ld\+json/);
assert.match(detailPageSource, /link\[rel="canonical"\]/);
assert.match(source('src/components/opportunity-detail/OpportunityHero.jsx'), /View original listing/);
assert.match(studentsLayoutSource, /<MobileNavbar \/>/);
assert.doesNotMatch(studentsLayoutSource, /navItems/);

console.log('Public discovery route contract checks passed.');
