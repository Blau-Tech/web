import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

import SectionHeading from '../../components/common/SectionHeading';
import ShowcaseEmptyState from '../../components/discover/ShowcaseEmptyState';
import ClosedProgramRow from '../../components/discover/programs/ClosedProgramRow';
import DeadlineRunway from '../../components/discover/programs/DeadlineRunway';
import ProgramCard from '../../components/discover/programs/ProgramCard';
import ProgramTypeTiles from '../../components/discover/programs/ProgramTypeTiles';
import { FilterBar, SearchField, SegmentedControl } from '../../components/discover/showcase/FilterControls';
import ShowcaseCta from '../../components/discover/showcase/ShowcaseCta';
import { GlassButton } from '../../components/ui/glass-button';
import { GlassMaterial } from '../../components/ui/glass-material';
import { useCity } from '../../lib/city/cityContext';
import {
  DEADLINE_FILTERS,
  PROGRAM_CATEGORY_FILTERS,
  programTypeFilterFromSearch,
  comparePrograms,
  deadlineRunway,
  matchesDeadline,
  programTypeSummaries,
  programGroup,
} from '../../lib/discovery/programBrowse';
import { programApplicationStatus } from '../../lib/discovery/discover';
import { scopeLabel } from '../../lib/discovery/programFormat';
import { useDiscoveryFilters } from '../../lib/discovery/discoveryFilterContext';
import { handleFetchError } from '../../lib/errors';
import { createLatestRequestGuard } from '../../lib/latestRequest';
import {
  discoveryTablesForOpportunityTypes,
  fetchDiscoveryItems,
} from '../../lib/member/memberDiscovery';
import { MEMBER_CITY_CODES, MEMBER_CITY_CONFIG } from '../../lib/member/memberPreferenceContract';
import { opportunityDetailPath, opportunityKey } from '../../lib/discovery/opportunityDetail';
import { useLocation, useNavigate } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import '../../styles/discover-showcase.css';

const PROGRAM_PAGE_SIZE = 9;
const PROGRAM_TYPES = Object.freeze(['programs']);
// Free-to-use Pexels footage by Keira Burton: students collaborating on campus.
const PROGRAM_HERO_VIDEO_URL = 'https://videos.pexels.com/video-files/6145421/6145421-hd_1920_1080_24fps.mp4';
const PROGRAM_SEARCH_SUGGESTIONS = Object.freeze([
  { label: 'Fellowships', query: 'fellowship' },
  { label: 'Residencies', query: 'residency' },
  { label: 'Builder communities', query: 'builder community' },
]);
const CITY_FILTERS = Object.freeze([
  { key: 'all', label: 'All cities' },
  ...MEMBER_CITY_CODES.map((cityCode) => ({ key: cityCode, label: MEMBER_CITY_CONFIG[cityCode].name })),
]);

function searchableProgramText(item) {
  return [
    item.title,
    item.organizer,
    item.description,
    item.tag,
    scopeLabel(item),
  ].filter(Boolean).join(' ').toLocaleLowerCase('en');
}

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

export default function ProgramShowcasePage() {
  const { setFilters } = useDiscoveryFilters();
  const { selectedDiscoveryCityCodes, selectedOpportunityTypes } = useCity();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('all');
  const [studentOnly, setStudentOnly] = useState(false);
  const navigate = useNavigate();
  const typeFilter = programTypeFilterFromSearch(location.search);
  const setTypeFilter = useCallback((key) => {
    const params = new URLSearchParams(location.search);
    const category = PROGRAM_CATEGORY_FILTERS.find((item) => item.key === key);
    if (category) params.set('programType', category.code);
    else params.delete('programType');
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params}` : '' }, { replace: true });
  }, [location.pathname, location.search, navigate]);
  const [visibleCount, setVisibleCount] = useState(PROGRAM_PAGE_SIZE);
  const discoveryControlsRef = useRef(null);
  const [requestGuard] = useState(createLatestRequestGuard);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const activeCityKey = selectedDiscoveryCityCodes.length === 1
    ? selectedDiscoveryCityCodes[0]
    : 'all';
  const selectedCityLabel = selectedDiscoveryCityCodes
    .map((cityCode) => MEMBER_CITY_CONFIG[cityCode]?.name)
    .filter(Boolean)
    .join(' and ') || 'Berlin and Munich';
  const requestKey = selectedDiscoveryCityCodes.join(',');

  useEffect(() => {
    const isProgramsOnly = selectedOpportunityTypes.length === PROGRAM_TYPES.length
      && selectedOpportunityTypes.every((type) => type === PROGRAM_TYPES[0]);
    if (isProgramsOnly) return;

    setFilters({
      cities: selectedDiscoveryCityCodes,
      opportunityTypes: PROGRAM_TYPES,
    }, { replace: true });
  }, [selectedDiscoveryCityCodes, selectedOpportunityTypes, setFilters]);

  useLayoutEffect(() => {
    requestGuard.activate(requestKey);
  }, [requestGuard, requestKey]);

  const fetchPrograms = useCallback(async () => {
    const canCommit = requestGuard.begin(requestKey);
    if (!canCommit()) return;

    try {
      setLoading(true);
      setError(null);
      const nextItems = await fetchDiscoveryItems(supabase, {
        cities: selectedDiscoveryCityCodes,
        opportunityTypes: PROGRAM_TYPES,
      });
      if (!canCommit()) return;

      setItems(nextItems);
    } catch (fetchError) {
      if (!canCommit()) return;
      handleFetchError(fetchError, setError, `${selectedCityLabel} programs`);
    } finally {
      if (canCommit()) setLoading(false);
    }
  }, [requestGuard, requestKey, selectedCityLabel, selectedDiscoveryCityCodes]);

  useEffect(() => {
    void fetchPrograms();
    const channel = supabase
      .channel(`program_showcase_${selectedDiscoveryCityCodes.join('_')}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: discoveryTablesForOpportunityTypes(PROGRAM_TYPES)[0] },
        fetchPrograms,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPrograms, selectedDiscoveryCityCodes]);

  const availablePrograms = useMemo(
    () => items.filter((item) => item.programType === 'program' && programGroup(item) !== null),
    [items],
  );

  // Keep unknown and upcoming applications visible without calling them open.
  const currentPrograms = useMemo(
    () => availablePrograms.filter((item) => programApplicationStatus(item) !== 'CLOSED').sort(comparePrograms),
    [availablePrograms],
  );
  const runway = useMemo(() => deadlineRunway(currentPrograms), [currentPrograms]);
  const programTypes = useMemo(() => programTypeSummaries(currentPrograms), [currentPrograms]);
  const typeOptions = useMemo(() => [
    { key: 'all', label: 'All programs' },
    ...PROGRAM_CATEGORY_FILTERS.map(({ key, label }) => ({ key, label })),
  ], []);

  const normalizedSearch = deferredSearchQuery.trim().toLocaleLowerCase('en');
  const matchesSearch = useCallback(
    (item) => !normalizedSearch || searchableProgramText(item).includes(normalizedSearch),
    [normalizedSearch],
  );
  const filteredPrograms = useMemo(() => currentPrograms.filter((item) => (
    matchesSearch(item)
    && (!studentOnly || item.programSubtype === 'STUDENT_PROGRAM')
    && matchesDeadline(item, deadlineFilter)
    && (typeFilter === 'all' || programGroup(item) === typeFilter)
  )), [deadlineFilter, matchesSearch, currentPrograms, typeFilter, studentOnly]);
  const closedPrograms = useMemo(() => availablePrograms
    .filter((item) => programApplicationStatus(item) === 'CLOSED' && matchesSearch(item)
      && (!studentOnly || item.programSubtype === 'STUDENT_PROGRAM')
      && (typeFilter === 'all' || programGroup(item) === typeFilter))
    .sort((first, second) => comparePrograms(second, first)), [availablePrograms, matchesSearch, typeFilter, studentOnly]);
  const featuredKey = useMemo(() => {
    const highlight = filteredPrograms.find((item) => item.isHighlight);
    return highlight ? opportunityKey(highlight) : null;
  }, [filteredPrograms]);
  const visiblePrograms = filteredPrograms.slice(0, visibleCount);
  const hasFilters = searchQuery !== '' || deadlineFilter !== 'all' || typeFilter !== 'all' || studentOnly;

  const scrollToResults = useCallback(() => {
    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      discoveryControlsRef.current?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }, []);

  const selectCity = useCallback((cityCode) => {
    setFilters({
      cities: cityCode === 'all' ? MEMBER_CITY_CODES : [cityCode],
      opportunityTypes: PROGRAM_TYPES,
    }, { replace: true });
    setVisibleCount(PROGRAM_PAGE_SIZE);
  }, [setFilters]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setDeadlineFilter('all');
    setStudentOnly(false);
    setTypeFilter('all');
    setVisibleCount(PROGRAM_PAGE_SIZE);
  }, [setTypeFilter]);

  const runHeroSearch = useCallback((query) => {
    setSearchQuery(query.trim());
    setVisibleCount(PROGRAM_PAGE_SIZE);
    scrollToResults();
  }, [scrollToResults]);

  const selectType = useCallback((typeKey) => {
    setTypeFilter(typeFilter === typeKey ? 'all' : typeKey);
    setVisibleCount(PROGRAM_PAGE_SIZE);
    scrollToResults();
  }, [scrollToResults, setTypeFilter, typeFilter]);

  const getOpportunityHref = useCallback(
    (item) => opportunityDetailPath(item, location.search),
    [location.search],
  );

  return (
    <>
      <section className="program-showcase-hero" aria-labelledby="program-hero-heading">
        <video
          className="program-showcase-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/assets/nav-community/programs.webp"
          aria-hidden="true"
        >
          <source src={PROGRAM_HERO_VIDEO_URL} type="video/mp4" />
        </video>
        <div className="program-showcase-hero-content">
          <h1 id="program-hero-heading">Find your next program.</h1>
          <p>Explore fellowships, residencies and selective communities for ambitious builders.</p>

          <form
            className="program-showcase-hero-search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              runHeroSearch(searchQuery);
            }}
          >
            <GlassMaterial
              className="program-showcase-hero-field"
              materialClassName="program-showcase-hero-field-surface"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Describe the program you want to find"
                placeholder="What kind of program are you looking for?"
              />
              <GlassButton
                type="submit"
                size="icon"
                className="program-showcase-hero-submit"
                contentClassName="program-showcase-hero-submit-label"
                aria-label="Search programs with AI"
              >
                <MagnifyingGlassIcon aria-hidden="true" />
              </GlassButton>
            </GlassMaterial>
          </form>

          <div className="program-showcase-hero-suggestions" aria-label="Example program searches">
            {PROGRAM_SEARCH_SUGGESTIONS.map((suggestion) => (
              <GlassButton
                key={suggestion.query}
                type="button"
                size="sm"
                className="program-showcase-hero-prompt"
                contentClassName="program-showcase-hero-prompt-label"
                onClick={() => runHeroSearch(suggestion.query)}
              >
                {suggestion.label}
              </GlassButton>
            ))}
          </div>
        </div>
      </section>

      <div className="ds-page ds-page--programs">
        {!loading && runway.marks.length > 0 ? (
          <section className="ds-section ds-shell" aria-labelledby="runway-heading">
            <SectionHeading
              className="ds-section__heading"
              titleId="runway-heading"
              title="Closing soon."
              description="The next application deadlines, on a real calendar."
            />
            <DeadlineRunway runway={runway} getHref={getOpportunityHref} />
          </section>
        ) : null}

        {!loading && programTypes.length > 1 ? (
          <section className="ds-section ds-shell" aria-labelledby="types-heading">
            <SectionHeading
              className="ds-section__heading"
              titleId="types-heading"
              title="What are you after?"
              description="Open programs, grouped by type."
            />
            <ProgramTypeTiles types={programTypes} activeKey={typeFilter} onSelect={selectType} />
          </section>
        ) : null}

        <section
          ref={discoveryControlsRef}
          id="all-programs"
          className="ds-section ds-shell ds-programs-section"
          aria-labelledby="programs-heading"
        >
          <SectionHeading className="ds-section__heading" titleId="programs-heading" title="Programs to explore." />

          <FilterBar
            summary={loading ? null : `${plural(filteredPrograms.length, 'program')} for ${selectedCityLabel}`}
          >
            <SearchField
              label="Search programs"
              value={searchQuery}
              onChange={(value) => { setSearchQuery(value); setVisibleCount(PROGRAM_PAGE_SIZE); }}
              placeholder="Search programs or organisations"
            />
            <SegmentedControl label="Filter programs by city" options={CITY_FILTERS} value={activeCityKey} onChange={selectCity} />
            <SegmentedControl
              label="Filter programs by type"
              options={typeOptions}
              value={typeFilter}
              onChange={(key) => { setTypeFilter(key); setVisibleCount(PROGRAM_PAGE_SIZE); }}
            />
            <SegmentedControl
              label="Filter programs by deadline"
              options={DEADLINE_FILTERS}
              value={deadlineFilter}
              onChange={(key) => { setDeadlineFilter(key); setVisibleCount(PROGRAM_PAGE_SIZE); }}
            />
            <label><input type="checkbox" checked={studentOnly} onChange={event => { setStudentOnly(event.target.checked); setVisibleCount(PROGRAM_PAGE_SIZE); }} /> Student-focused programs</label>
          </FilterBar>

          {loading ? (
            <div className="ds-progs" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => <span key={index} className="ds-prog ds-skeleton" />)}
            </div>
          ) : null}

          {!loading && error ? (
            <ShowcaseEmptyState variant="programs" title={error} description="Check your connection and try once more." onAction={fetchPrograms} />
          ) : null}

          {!loading && !error && filteredPrograms.length === 0 ? (
            <ShowcaseEmptyState
              variant="programs"
              title={hasFilters ? 'No programs match those filters.' : `No current programs in ${selectedCityLabel} right now.`}
              description={hasFilters ? 'Try another type, deadline or search term.' : 'New applications appear here as soon as they are published.'}
              onAction={hasFilters ? clearFilters : undefined}
              actionLabel="Clear filters"
            />
          ) : null}

          {!loading && !error && filteredPrograms.length > 0 ? (
            <div className="ds-progs">
              {visiblePrograms.map((item) => (
                <ProgramCard
                  key={opportunityKey(item)}
                  item={item}
                  href={getOpportunityHref(item)}
                  featured={opportunityKey(item) === featuredKey}
                />
              ))}
            </div>
          ) : null}

          {!loading && filteredPrograms.length > visibleCount ? (
            <div className="ds-more">
              <button type="button" className="btn-secondary" onClick={() => setVisibleCount((count) => count + PROGRAM_PAGE_SIZE)}>
                Show more programs
              </button>
            </div>
          ) : null}

          {!loading && !error && closedPrograms.length > 0 ? (
            <details className="ds-closed">
              <summary>
                Recently closed
                <span>{plural(closedPrograms.length, 'program')}, useful for their next round</span>
              </summary>
              <ul>
                {closedPrograms.map((item) => (
                  <ClosedProgramRow key={opportunityKey(item)} item={item} href={getOpportunityHref(item)} />
                ))}
              </ul>
            </details>
          ) : null}
        </section>

        <ShowcaseCta
          id="programs-cta-heading"
          title="Running a program?"
          action="Submit a program"
          href="/partners#submit-event"
        />
      </div>
    </>
  );
}
