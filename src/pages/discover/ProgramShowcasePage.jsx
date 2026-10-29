import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

import ShowcaseEmptyState from '../../components/discover/ShowcaseEmptyState';
import ClosedProgramRow from '../../components/discover/programs/ClosedProgramRow';
import ProgramCard from '../../components/discover/programs/ProgramCard';
import {
  FilterBar,
  FilterStatus,
  SearchField,
  SegmentedControl,
  SelectControl,
  ToggleControl,
} from '../../components/discover/showcase/FilterControls';
import PageHero from '../../components/discover/showcase/PageHero';
import ShowcaseCta from '../../components/discover/showcase/ShowcaseCta';
import { useCity } from '../../lib/city/cityContext';
import {
  DEADLINE_FILTERS,
  PROGRAM_CATEGORY_FILTERS,
  programTypeFilterFromSearch,
  comparePrograms,
  matchesDeadline,
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
  const visiblePrograms = filteredPrograms.slice(0, visibleCount);
  const hasFilters = searchQuery !== '' || deadlineFilter !== 'all' || typeFilter !== 'all' || studentOnly;

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

  const getOpportunityHref = useCallback(
    (item) => opportunityDetailPath(item, location.search),
    [location.search],
  );

  return (
    <div className="ds-page ds-page--programs">
      <PageHero id="program-hero-heading" title="Find your next program." media="glacier">
        {loading
          ? 'Fellowships, residencies and builder communities.'
          : `${plural(currentPrograms.length, 'program')} for ${selectedCityLabel}.`}
      </PageHero>

      <FilterBar>
        <SearchField
          label="Search programs"
          value={searchQuery}
          onChange={(value) => { setSearchQuery(value); setVisibleCount(PROGRAM_PAGE_SIZE); }}
          placeholder="Search programs or organisations"
        />
        <SegmentedControl label="Filter programs by city" options={CITY_FILTERS} value={activeCityKey} onChange={selectCity} />
        <SelectControl
          label="Filter programs by type"
          options={typeOptions}
          value={typeFilter}
          onChange={(key) => { setTypeFilter(key); setVisibleCount(PROGRAM_PAGE_SIZE); }}
        />
        <SelectControl
          label="Filter programs by deadline"
          options={DEADLINE_FILTERS}
          value={deadlineFilter}
          onChange={(key) => { setDeadlineFilter(key); setVisibleCount(PROGRAM_PAGE_SIZE); }}
        />
        <ToggleControl
          label="For students"
          pressed={studentOnly}
          onChange={(next) => { setStudentOnly(next); setVisibleCount(PROGRAM_PAGE_SIZE); }}
        />
      </FilterBar>
      <FilterStatus
        summary={!loading && hasFilters ? `${plural(filteredPrograms.length, 'program')} match` : null}
        onClear={clearFilters}
      />

      <section id="all-programs" className="ds-shell ds-results" aria-label="Programs">
        {loading ? (
          <div className="ds-progs" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => <span key={index} className="ds-prog ds-skeleton" />)}
          </div>
        ) : null}

        {!loading && error ? (
          <ShowcaseEmptyState title={error} description="Check your connection and try once more." onAction={fetchPrograms} />
        ) : null}

        {!loading && !error && filteredPrograms.length === 0 ? (
          <ShowcaseEmptyState
            title={hasFilters ? 'No programs match those filters.' : `No current programs in ${selectedCityLabel} right now.`}
            description={hasFilters ? 'Try another type, deadline or search term.' : 'New applications appear here as soon as they are published.'}
            onAction={hasFilters ? clearFilters : undefined}
            actionLabel="Clear filters"
          />
        ) : null}

        {!loading && !error && filteredPrograms.length > 0 ? (
          <div className="ds-progs">
            {visiblePrograms.map((item) => (
              <ProgramCard key={opportunityKey(item)} item={item} href={getOpportunityHref(item)} />
            ))}
          </div>
        ) : null}

        {!loading && filteredPrograms.length > visibleCount ? (
          <div className="ds-more">
            <button type="button" className="ds-button ds-button--quiet" onClick={() => setVisibleCount((count) => count + PROGRAM_PAGE_SIZE)}>
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
  );
}
