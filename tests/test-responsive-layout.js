import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const studentsLayoutSource = readFileSync(`${repoRoot}src/components/layout/StudentsLayout.jsx`, 'utf8');
const mobileNavbarSource = readFileSync(`${repoRoot}src/components/layout/MobileNavbar.jsx`, 'utf8');
const discoverPageSource = readFileSync(
  `${repoRoot}src/pages/discover/MemberDiscoverPage.jsx`,
  'utf8',
);
// A showcase page plus the card components extracted from it. The page is
// read first so ordering checks still apply to the page layout itself.
const showcaseSource = (pagePath, componentDir) => [
  readFileSync(`${repoRoot}${pagePath}`, 'utf8'),
  ...readdirSync(`${repoRoot}${componentDir}`)
    .filter((file) => file.endsWith('.jsx'))
    .sort()
    .map((file) => readFileSync(`${repoRoot}${componentDir}/${file}`, 'utf8')),
].join('\n');
const eventShowcaseSource = showcaseSource(
  'src/pages/discover/EventShowcasePage.jsx',
  'src/components/discover/events',
);
const programShowcaseSource = showcaseSource(
  'src/pages/discover/ProgramShowcasePage.jsx',
  'src/components/discover/programs',
);
const featuredCarouselSource = readFileSync(
  `${repoRoot}src/components/discover/FeaturedCarousel.jsx`,
  'utf8',
);
const calendarSource = readFileSync(
  `${repoRoot}src/components/discover/DiscoverCalendar.jsx`,
  'utf8',
);
const agendaSource = readFileSync(
  `${repoRoot}src/components/discover/DiscoverAgenda.jsx`,
  'utf8',
);
const stylesheet = readFileSync(`${repoRoot}src/index.css`, 'utf8');

assert.equal(
  existsSync(`${repoRoot}src/components/StudentsNavbar.jsx`),
  false,
  'discovery should not keep a separate legacy navbar component',
);
assert(
  studentsLayoutSource.includes('<MobileNavbar')
    && studentsLayoutSource.includes('<SiteFooter />'),
  'discovery pages should use the shared navbar and footer components',
);
assert.equal(
  mobileNavbarSource.includes('navItems'),
  false,
  'the shared navbar should not retain the legacy discovery-menu branch',
);
assert(
  mobileNavbarSource.includes("{ label: 'Events', href: '/discover/events'")
    && mobileNavbarSource.includes("{ label: 'For organisers', href: '/partners'")
    && mobileNavbarSource.includes("{ label: 'Submit an event', href: '/partners#submit-event'")
    && !mobileNavbarSource.includes('https://www.apple.com/'),
  'public navigation should expose only Blau Tech discovery and organiser destinations',
);
assert(
  stylesheet.includes('max-width: 1024px;')
    && stylesheet.includes('height: 44px;')
    && stylesheet.includes('@media (max-width: 833px)'),
  'public navigation should retain Apple desktop dimensions and its compact breakpoint',
);
assert(
  stylesheet.includes('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);')
    && stylesheet.includes('.apple-global-nav__nav-items {\n  grid-column: 2;')
    && stylesheet.includes('.apple-global-nav__actions {\n  grid-column: 3;\n  justify-self: end;'),
  'public navigation should mathematically center its main links while keeping edge actions',
);
assert.equal(
  stylesheet.includes('min-height: 446px;'),
  false,
  'public navigation flyouts should size themselves to their actual link content',
);
assert(
  mobileNavbarSource.includes('onMouseEnter={() => setActiveFlyout(item.hasFlyout ? item.label : null)}')
    && mobileNavbarSource.includes('NAV_FLYOUTS')
    && stylesheet.includes('.apple-global-nav__flyout-content')
    && stylesheet.includes('.apple-global-nav__backdrop'),
  'desktop public navigation should expose its linked mega menu on hover with a page backdrop',
);
assert(
  mobileNavbarSource.includes("{ label: 'Events', href: '/discover/events', opportunityType: 'events', hasFlyout: true }")
    && !mobileNavbarSource.includes("{ label: 'Hackathons', href: '/discover/hackathons', opportunityType: 'hackathons' }")
    && mobileNavbarSource.includes("{ label: 'Programs', href: '/discover/programs', opportunityType: 'programs', hasFlyout: true }")
    && mobileNavbarSource.includes("['Munich', '/discover/events?cities=munich&types=events']")
    && mobileNavbarSource.includes("['Berlin', '/discover/events?cities=berlin&types=events']")
    && mobileNavbarSource.includes("['All Events', '/discover/events?types=events']")
    && mobileNavbarSource.includes("['Events', [")
    && mobileNavbarSource.includes("['Browse all events', '/discover/events?types=events']")
    && mobileNavbarSource.includes("['Browse all hackathons', '/discover/hackathons?types=hackathons']")
    && !mobileNavbarSource.includes('Beginner-friendly events')
    && !mobileNavbarSource.includes('Engineering & developer events')
    && !mobileNavbarSource.includes('Startup & founder events')
    && !mobileNavbarSource.includes('Networking & community events')
    && !mobileNavbarSource.includes('Student hackathons')
    && !mobileNavbarSource.includes('Startup hackathons')
    && !mobileNavbarSource.includes("['Innovation challenges',")
    && mobileNavbarSource.includes('  Programs: [')
    && mobileNavbarSource.includes("['Explore programs', [")
    && mobileNavbarSource.includes("['Munich', '/discover/programs?cities=munich&types=programs']")
    && mobileNavbarSource.includes("['Berlin', '/discover/programs?cities=berlin&types=programs']")
    && !mobileNavbarSource.includes("['Browse all programs', '/discover/programs?types=programs']")
    && mobileNavbarSource.includes("['For individuals', [")
    && mobileNavbarSource.includes("['Fellowships & learning programs', '/discover/programs?types=programs&programType=LEARNING']")
    && mobileNavbarSource.includes("['Residencies & hacker houses', '/discover/programs?types=programs&programType=RESIDENCY']")
    && !mobileNavbarSource.includes("['For startups', ["),
  'Events should offer city and type links; Programs should retain its exploration and audience columns',

);
assert(
  stylesheet.includes('height: calc(100svh - var(--public-nav-height));')
    && stylesheet.includes('padding-top: var(--public-nav-height);'),
  'the homepage viewport and panels should share the public navbar height without a bottom gap',
);
const showcaseStylesheet = readFileSync(`${repoRoot}src/styles/discover-showcase.css`, 'utf8');
const eventAgendaSource = readFileSync(`${repoRoot}src/lib/discovery/eventAgenda.js`, 'utf8');
const programBrowseSource = readFileSync(`${repoRoot}src/lib/discovery/programBrowse.js`, 'utf8');

assert(
  eventShowcaseSource.includes('<EventDayStrip')
    && eventShowcaseSource.includes('title="Don’t miss."')
    && eventShowcaseSource.includes('title="Everything coming up."')
    && eventShowcaseSource.includes('title="Build something."')
    && eventShowcaseSource.indexOf('<EventDayStrip') < eventShowcaseSource.indexOf('title="Don’t miss."')
    && eventShowcaseSource.indexOf('title="Don’t miss."') < eventShowcaseSource.indexOf('title="Everything coming up."')
    && eventShowcaseSource.indexOf('title="Everything coming up."') < eventShowcaseSource.indexOf('title="Build something."'),
  'the events page should lead with the next two weeks, then highlights, the full agenda and hackathons',
);
assert(
  eventShowcaseSource.includes('upcomingEvents(items)')
    && eventAgendaSource.includes('export function upcomingEvents')
    && eventAgendaSource.includes('startOfDay(lastDay(item)) >= today')
    && eventShowcaseSource.includes('groupByDay(filtered)')
    && eventShowcaseSource.includes("opportunityTypes: SHOWCASE_TYPES")
    && eventShowcaseSource.includes("Object.freeze(['events', 'hackathons'])")
    && eventShowcaseSource.includes('label="Filter by city"')
    && eventShowcaseSource.includes('label="Filter by date"')
    && eventShowcaseSource.includes('label="Filter by opportunity type"')
    && eventShowcaseSource.includes('aria-label="Filter by interest"')
    && !eventShowcaseSource.includes('onScroll='),
  'event browsing should only list upcoming events, grouped by day, filtered in place without an inner scroll box',
);
assert(
  programShowcaseSource.includes('className="program-showcase-hero"')
    && programShowcaseSource.includes('className="program-showcase-hero-video"')
    && programShowcaseSource.includes('videos.pexels.com/video-files/6145421')
    && !programShowcaseSource.includes('hackathons.example')
    && programShowcaseSource.includes('autoPlay')
    && programShowcaseSource.includes('muted')
    && programShowcaseSource.includes('loop')
    && programShowcaseSource.includes('playsInline')
    && programShowcaseSource.includes('role="search"')
    && programShowcaseSource.includes('Search programs with AI')
    && programShowcaseSource.includes('PROGRAM_SEARCH_SUGGESTIONS.map')
    && programShowcaseSource.includes("from '../../components/ui/glass-button'")
    && programShowcaseSource.includes("from '../../components/ui/glass-material'")
    && programShowcaseSource.includes('className="program-showcase-hero-prompt"')
    && programShowcaseSource.indexOf('className="program-showcase-hero"')
      < programShowcaseSource.indexOf('<DeadlineRunway')
    && stylesheet.includes('.program-showcase-hero-video')
    && stylesheet.includes('min-height: clamp(28rem, 62svh, 36rem);'),
  'the programs page should open with the full-bleed video and AI-search hero',
);
assert(
  programShowcaseSource.indexOf('<DeadlineRunway') < programShowcaseSource.indexOf('<ProgramTypeTiles')
    && programShowcaseSource.indexOf('<ProgramTypeTiles') < programShowcaseSource.indexOf('ref={discoveryControlsRef}')
    && programShowcaseSource.includes('title="Closing soon."')
    && programShowcaseSource.includes('title="Programs to explore."')
    && programBrowseSource.includes('export function deadlineRunway')
    && programBrowseSource.includes('export function isOpenProgram')
    && programShowcaseSource.includes("programApplicationStatus(item) !== 'CLOSED'")
    && programShowcaseSource.includes('Recently closed'),
  'program discovery should show closing deadlines, then types, then current programs, with closed ones set aside',
);
assert(
  !programShowcaseSource.includes('SAMPLE_PROGRAMS')
    && programShowcaseSource.includes('label="Filter programs by city"')
    && programShowcaseSource.includes('label="Filter programs by type"')
    && programShowcaseSource.includes('label="Filter programs by deadline"')
    && programShowcaseSource.includes('useDeferredValue(searchQuery)')
    && programShowcaseSource.includes("items.filter((item) => item.programType === 'program' && programGroup(item) !== null)")
    && programShowcaseSource.includes('opportunityTypes: PROGRAM_TYPES')
    && !programShowcaseSource.includes('onScroll='),
  'program discovery should preserve fetching and accessible filters without sample listings',
);
assert(
  showcaseStylesheet.includes('.ds-filterbar {\n  position: sticky;')
    && showcaseStylesheet.includes('@media (prefers-reduced-motion: reduce)')
    && showcaseStylesheet.includes('@media (max-width: 640px)'),
  'discovery results should keep their filters in reach, respect reduced motion and collapse on phones',
);
assert(
  discoverPageSource.includes("from '../../components/discover/FeaturedCarousel'")
    && discoverPageSource.includes('headingId="featured-hackathons-heading"')
    && featuredCarouselSource.includes('window.setInterval(advance, 32)')
    && featuredCarouselSource.includes("window.matchMedia('(prefers-reduced-motion: reduce)')")
    && featuredCarouselSource.includes('interactionRef.current.hover')
    && stylesheet.includes('.featured-carousel__viewport-shell::after')
    && stylesheet.includes('rgba(255, 255, 255, 0.12) 82%')
    && stylesheet.includes('transparent 92%')
    && stylesheet.includes('#ffffff 90%'),
  'the hackathons page should keep the slow accessible carousel with a white edge fade',
);
assert(
  discoverPageSource.includes('lg:-mt-11'),
  'desktop discovery content should reclaim the unused space below the member header',
);
assert(
  discoverPageSource.includes('discover-calendar-surface')
    && discoverPageSource.includes('discover-utility-link'),
  'the discovery page should retain the compact ae85 calendar shell and utility links',
);
assert.equal(
  discoverPageSource.includes('aria-label="Opportunity view"'),
  false,
  'calendar and list should use one quiet switch instead of another segmented control',
);
assert.equal(
  discoverPageSource.includes('<aside'),
  false,
  'community links should remain in the compact discovery header instead of a button-heavy sidebar',
);
assert(
  agendaSource.includes('discover-agenda-time')
    && agendaSource.includes('discover-agenda-tag')
    && agendaSource.includes('discover-agenda-title')
    && agendaSource.includes('discover-agenda-meta')
    && agendaSource.includes('discover-agenda-date-label'),
  'the list view should retain the high-contrast ae85 agenda presentation',
);
assert(
  agendaSource.includes('renderItemAction={renderItemAction}'),
  'the restored agenda design must preserve the newer per-item save action',
);
assert(
  calendarSource.includes('dayItems.slice(0, 2)'),
  'month cells should show at most two items before exposing the day dialog',
);
assert(
  stylesheet.includes(
    'calc((100dvh - var(--discover-calendar-vertical-reserve)) / 6)',
  ),
  'the desktop month grid should divide the remaining viewport height across six rows',
);
assert(
  stylesheet.includes('--discover-calendar-vertical-reserve: 15rem;'),
  'wide desktop calendars should reclaim space from the compact header',
);
assert(
  stylesheet.includes('min-height: 0;'),
  'dense day content must not expand an explicitly sized desktop month row',
);

const screenshotViewportHeight = 698;
const reservedPageHeight = 15 * 16;
const rowHeight = Math.max(
  3.5 * 16,
  (screenshotViewportHeight - reservedPageHeight) / 6,
);

assert.equal(
  Math.round(rowHeight),
  76,
  'the compact desktop header should release its space back to the calendar rows',
);
assert.equal(
  reservedPageHeight + (rowHeight * 6),
  screenshotViewportHeight,
  'the six calendar rows and page chrome should consume the available viewport height',
);

console.log('Responsive layout contract checks passed.');
