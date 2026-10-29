import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

import ShowcaseEmptyState from '../../components/discover/ShowcaseEmptyState';
import EventAgendaRow from '../../components/discover/events/EventAgendaRow';
import {
  FilterBar,
  FilterStatus,
  SearchField,
  SegmentedControl,
  SelectControl,
} from '../../components/discover/showcase/FilterControls';
import PageHero from '../../components/discover/showcase/PageHero';
import ShowcaseCta from '../../components/discover/showcase/ShowcaseCta';
import { useDiscoveryFilters } from '../../lib/discovery/discoveryFilterContext';
import { MEMBER_CITY_CODES, MEMBER_CITY_CONFIG } from '../../lib/member/memberPreferenceContract';
import { EVENT_TOPICS, eventMatchesTopic, eventSearchText } from '../../lib/discovery/eventFormat';
import {
  WHEN_FILTERS,
  groupByDay,
  matchesWhen,
  relativeDayLabel,
  upcomingEvents,
} from '../../lib/discovery/eventAgenda';
import {
  discoveryTablesForOpportunityTypes,
  fetchDiscoveryItems,
} from '../../lib/member/memberDiscovery';
import { useCity } from '../../lib/city/cityContext';
import { opportunityDetailPath } from '../../lib/discovery/opportunityDetail';
import { useLocation } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import '../../styles/discover-showcase.css';

const SHOWCASE_TYPES = Object.freeze(['events', 'hackathons']);
const DAY_PAGE_SIZE = 8;
// Hackathons are one more way to narrow the list, so they sit with the interests.
const INTEREST_FILTERS = Object.freeze([
  { key: 'all', label: 'All interests' },
  { key: 'hackathons', label: 'Hackathons' },
  ...EVENT_TOPICS.filter((topic) => topic.key !== 'all').map(({ key, label }) => ({ key, label })),
]);
const CITY_FILTERS = Object.freeze([
  { key: 'all', label: 'All cities' },
  ...MEMBER_CITY_CODES.map((cityCode) => ({ key: cityCode, label: MEMBER_CITY_CONFIG[cityCode].name })),
]);

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

export default function EventShowcasePage() {
  const { setFilters } = useDiscoveryFilters();
  const { selectedDiscoveryCityCodes, selectedOpportunityTypes } = useCity();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [whenKey, setWhenKey] = useState('all');
  const [interestKey, setInterestKey] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleDayCount, setVisibleDayCount] = useState(DAY_PAGE_SIZE);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const cityLabel = selectedDiscoveryCityCodes
    .map((cityCode) => MEMBER_CITY_CONFIG[cityCode]?.name)
    .filter(Boolean)
    .join(' and ') || 'Berlin and Munich';
  const activeCityKey = selectedDiscoveryCityCodes.length === 1
    ? selectedDiscoveryCityCodes[0]
    : 'all';

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const nextItems = await fetchDiscoveryItems(supabase, {
        cities: selectedDiscoveryCityCodes,
        opportunityTypes: SHOWCASE_TYPES,
      });
      const strictCityItems = selectedDiscoveryCityCodes.length === 1
        ? nextItems.filter((item) => String(item.city || '').toUpperCase() === selectedDiscoveryCityCodes[0])
        : nextItems;
      setItems(strictCityItems);
    } catch (fetchError) {
      console.error('Could not load events and hackathons', fetchError);
      setError('Events and hackathons could not be loaded right now.');
    } finally {
      setLoading(false);
    }
  }, [selectedDiscoveryCityCodes]);

  useEffect(() => {
    void fetchEvents();

    const channel = supabase
      .channel(`event_showcase_${selectedDiscoveryCityCodes.join('_')}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: discoveryTablesForOpportunityTypes(SHOWCASE_TYPES)[0] },
        fetchEvents,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents, selectedDiscoveryCityCodes]);

  // Past events stay in the database for their detail pages; browsing only
  // ever shows what is still ahead.
  const upcoming = useMemo(() => upcomingEvents(items), [items]);

  const filtered = useMemo(() => {
    const topic = EVENT_TOPICS.find((entry) => entry.key === interestKey);
    const query = deferredSearchQuery.trim().toLocaleLowerCase('en');

    return upcoming.filter((item) => (
      matchesWhen(item, whenKey)
      && (interestKey === 'all'
        || (interestKey === 'hackathons' ? item.category === 'hackathons' : eventMatchesTopic(item, topic)))
      && (!query || eventSearchText(item).includes(query))
    ));
  }, [deferredSearchQuery, interestKey, upcoming, whenKey]);
  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  const visibleGroups = groups.slice(0, visibleDayCount);
  const hasFilters = whenKey !== 'all' || interestKey !== 'all' || searchQuery !== '';

  const resetPaging = () => setVisibleDayCount(DAY_PAGE_SIZE);

  const clearFilters = useCallback(() => {
    setWhenKey('all');
    setInterestKey('all');
    setSearchQuery('');
    setVisibleDayCount(DAY_PAGE_SIZE);
  }, []);

  const selectCity = useCallback((cityCode) => {
    setFilters({
      cities: cityCode === 'all' ? MEMBER_CITY_CODES : [cityCode],
      opportunityTypes: selectedOpportunityTypes,
    }, { replace: true });
    setVisibleDayCount(DAY_PAGE_SIZE);
  }, [selectedOpportunityTypes, setFilters]);

  const getOpportunityHref = useCallback(
    (item) => opportunityDetailPath(item, location.search),
    [location.search],
  );

  return (
    <div className="ds-page ds-page--events">
      <PageHero id="events-hero-heading" title="What’s on.">
        {loading
          ? 'Checking what is on.'
          : `${upcoming.length} ${upcoming.length === 1 ? 'event or hackathon' : 'events and hackathons'} in ${cityLabel}.`}
      </PageHero>

      <FilterBar>
        <SearchField
          label="Search events and hackathons"
          value={searchQuery}
          onChange={(value) => { setSearchQuery(value); resetPaging(); }}
          placeholder="Search events, organisers or venues"
        />
        <SegmentedControl label="Filter by city" options={CITY_FILTERS} value={activeCityKey} onChange={selectCity} />
        <SelectControl
          label="Filter by date"
          options={WHEN_FILTERS}
          value={whenKey}
          onChange={(key) => { setWhenKey(key); resetPaging(); }}
        />
        <SelectControl
          label="Filter by interest"
          options={INTEREST_FILTERS}
          value={interestKey}
          onChange={(key) => { setInterestKey(key); resetPaging(); }}
        />
      </FilterBar>
      <FilterStatus
        summary={!loading && hasFilters ? `${plural(filtered.length, 'listing')} across ${plural(groups.length, 'day')}` : null}
        onClear={clearFilters}
      />

      <section id="all-events" className="ds-shell ds-results" aria-label="Upcoming events">
        {loading ? (
          <ol className="ds-agenda" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index} className="ds-day">
                <span className="ds-day__date" />
                <span className="ds-day__rows ds-skeleton" />
              </li>
            ))}
          </ol>
        ) : null}

        {!loading && error ? (
          <ShowcaseEmptyState title={error} description="Check your connection and try once more." onAction={fetchEvents} />
        ) : null}

        {!loading && !error && groups.length === 0 ? (
          <ShowcaseEmptyState
            title={hasFilters ? 'Nothing matches those filters.' : `Nothing is listed in ${cityLabel} yet.`}
            description={hasFilters ? 'Try another date range or interest.' : 'New events appear here as soon as they are published.'}
            actionLabel="Clear filters"
            onAction={hasFilters ? clearFilters : undefined}
          />
        ) : null}

        {!loading && !error && groups.length > 0 ? (
          <ol className="ds-agenda">
            {visibleGroups.map((group) => (
              <li key={group.key} id={`day-${group.key}`} className="ds-day">
                <div className="ds-day__date">
                  <span className="ds-day__label">{relativeDayLabel(group.date)}</span>
                  <strong className="ds-day__number">{group.date.getDate()}</strong>
                  <span className="ds-day__month">{group.date.toLocaleDateString('en-GB', { month: 'long' })}</span>
                </div>
                <ul className="ds-day__rows">
                  {group.items.map((item) => (
                    <EventAgendaRow key={`${item.source}-${item.id}`} item={item} href={getOpportunityHref(item)} />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : null}

        {!loading && groups.length > visibleDayCount ? (
          <div className="ds-more">
            <button type="button" className="ds-button ds-button--quiet" onClick={() => setVisibleDayCount((count) => count + DAY_PAGE_SIZE)}>
              Show more dates
            </button>
          </div>
        ) : null}
      </section>

      <ShowcaseCta
        id="events-cta-heading"
        title="Hosting something?"
        action="Submit an event"
        href="/partners#submit-event"
      />
    </div>
  );
}
