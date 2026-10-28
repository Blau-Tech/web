import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

import SectionHeading from '../../components/common/SectionHeading';
import ShowcaseEmptyState from '../../components/discover/ShowcaseEmptyState';
import EventAgendaRow from '../../components/discover/events/EventAgendaRow';
import EventDayStrip from '../../components/discover/events/EventDayStrip';
import EventSpotlightCard from '../../components/discover/events/EventSpotlightCard';
import HackathonShelfCard from '../../components/discover/events/HackathonShelfCard';
import { FilterBar, SearchField, SegmentedControl } from '../../components/discover/showcase/FilterControls';
import ShowcaseCta from '../../components/discover/showcase/ShowcaseCta';
import { useDiscoveryFilters } from '../../lib/discovery/discoveryFilterContext';
import { MEMBER_CITY_CODES, MEMBER_CITY_CONFIG } from '../../lib/member/memberPreferenceContract';
import { EVENT_TOPICS, eventMatchesTopic, eventSearchText } from '../../lib/discovery/eventFormat';
import {
  WHEN_FILTERS,
  groupByDay,
  matchesWhen,
  relativeDayLabel,
  selectSpotlight,
  stripDays,
  upcomingEvents,
} from '../../lib/discovery/eventAgenda';
import {
  discoveryTablesForOpportunityTypes,
  fetchDiscoveryItems,
} from '../../lib/member/memberDiscovery';
import { useCity } from '../../lib/city/cityContext';
import { opportunityDetailPath } from '../../lib/discovery/opportunityDetail';
import { Link, useLocation } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import '../../styles/discover-showcase.css';

const SHOWCASE_TYPES = Object.freeze(['events', 'hackathons']);
const DAY_PAGE_SIZE = 8;
const HACKATHON_LIMIT = 3;
const TYPE_FILTERS = Object.freeze([
  { key: 'all', label: 'All types' },
  { key: 'events', label: 'Events' },
  { key: 'hackathons', label: 'Hackathons' },
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
  const [typeKey, setTypeKey] = useState('all');
  const [topicKey, setTopicKey] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleDayCount, setVisibleDayCount] = useState(DAY_PAGE_SIZE);
  const [pendingDayKey, setPendingDayKey] = useState(null);
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
  const days = useMemo(() => stripDays(upcoming), [upcoming]);
  const spotlight = useMemo(() => selectSpotlight(upcoming), [upcoming]);
  const hackathons = useMemo(
    () => upcoming.filter((item) => item.category === 'hackathons'),
    [upcoming],
  );

  const filtered = useMemo(() => {
    const topic = EVENT_TOPICS.find((entry) => entry.key === topicKey) || EVENT_TOPICS[0];
    const query = deferredSearchQuery.trim().toLocaleLowerCase('en');

    return upcoming.filter((item) => (
      (typeKey === 'all' || item.category === typeKey)
      && matchesWhen(item, whenKey)
      && eventMatchesTopic(item, topic)
      && (!query || eventSearchText(item).includes(query))
    ));
  }, [deferredSearchQuery, topicKey, typeKey, upcoming, whenKey]);
  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  const visibleGroups = groups.slice(0, visibleDayCount);
  const hasFilters = whenKey !== 'all' || typeKey !== 'all' || topicKey !== 'all' || searchQuery !== '';

  const resetPaging = () => setVisibleDayCount(DAY_PAGE_SIZE);

  const clearFilters = useCallback(() => {
    setWhenKey('all');
    setTypeKey('all');
    setTopicKey('all');
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

  // Picking a day in the strip shows the whole agenda down to that day.
  const jumpToDay = useCallback((dayKey) => {
    const dayIndex = groupByDay(upcoming).findIndex((group) => group.key === dayKey);
    clearFilters();
    setVisibleDayCount(Math.max(DAY_PAGE_SIZE, dayIndex + 1));
    setPendingDayKey(dayKey);
  }, [clearFilters, upcoming]);

  useEffect(() => {
    if (!pendingDayKey) return;
    const target = document.getElementById(`day-${pendingDayKey}`);
    if (!target) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    setPendingDayKey(null);
  }, [pendingDayKey, visibleGroups]);

  const getOpportunityHref = useCallback(
    (item) => opportunityDetailPath(item, location.search),
    [location.search],
  );

  return (
    <div className="ds-page ds-page--events">
      <section className="ds-events-hero" aria-labelledby="events-hero-heading">
        <div className="ds-shell">
          <div className="ds-events-hero__head">
            <h1 id="events-hero-heading">What’s on.</h1>
            <p>
              {loading
                ? 'Gathering what is coming up…'
                : `${plural(upcoming.length, 'event')} and hackathons coming up in ${cityLabel}.`}
            </p>
          </div>
          <EventDayStrip days={days} loading={loading} onSelectDay={jumpToDay} />
        </div>
      </section>

      {loading || spotlight.length > 0 ? (
        <section className="ds-section ds-shell" aria-labelledby="spotlight-heading">
          <SectionHeading
            className="ds-section__heading"
            titleId="spotlight-heading"
            title="Don’t miss."
            description="Standout events in the next two weeks."
          />
          <div className="ds-spotlight">
            {loading
              ? Array.from({ length: 3 }, (_, index) => (
                <span key={index} className={`ds-spot ds-skeleton${index === 0 ? ' ds-spot--lead' : ''}`} aria-hidden="true" />
              ))
              : spotlight.map((item, index) => (
                <EventSpotlightCard
                  key={`${item.source}-${item.id}`}
                  item={item}
                  href={getOpportunityHref(item)}
                  lead={index === 0}
                />
              ))}
          </div>
        </section>
      ) : null}

      <section id="all-events" className="ds-section ds-shell ds-agenda-section" aria-labelledby="agenda-heading">
        <SectionHeading
          className="ds-section__heading"
          titleId="agenda-heading"
          title="Everything coming up."
          description="Every upcoming event, day by day. Filter by city, date or interest."
        />

        <FilterBar
          summary={loading ? null : `${plural(filtered.length, 'listing')} across ${plural(groups.length, 'day')}`}
        >
          <SearchField
            label="Search events and hackathons"
            value={searchQuery}
            onChange={(value) => { setSearchQuery(value); resetPaging(); }}
            placeholder="Search events, organisers or venues"
          />
          <SegmentedControl label="Filter by city" options={CITY_FILTERS} value={activeCityKey} onChange={selectCity} />
          <SegmentedControl
            label="Filter by date"
            options={WHEN_FILTERS}
            value={whenKey}
            onChange={(key) => { setWhenKey(key); resetPaging(); }}
          />
          <SegmentedControl
            label="Filter by opportunity type"
            options={TYPE_FILTERS}
            value={typeKey}
            onChange={(key) => { setTypeKey(key); resetPaging(); }}
          />
          <div className="ds-chips" role="group" aria-label="Filter by interest">
            {EVENT_TOPICS.map((topic) => (
              <button
                key={topic.key}
                type="button"
                aria-pressed={topicKey === topic.key}
                onClick={() => { setTopicKey(topic.key); resetPaging(); }}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </FilterBar>

        {loading ? (
          <ol className="ds-agenda" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index} className="ds-agenda__day">
                <span className="ds-agenda__date ds-skeleton" />
                <span className="ds-agenda__rows ds-skeleton ds-skeleton--rows" />
              </li>
            ))}
          </ol>
        ) : null}

        {!loading && error ? (
          <ShowcaseEmptyState variant="events" title={error} description="Check your connection and try once more." onAction={fetchEvents} />
        ) : null}

        {!loading && !error && groups.length === 0 ? (
          <ShowcaseEmptyState
            variant="events"
            title={hasFilters ? 'Nothing matches those filters.' : `Nothing is listed in ${cityLabel} yet.`}
            description={hasFilters ? 'Try another date range or interest.' : 'New events appear here as soon as they are published.'}
            actionLabel="Clear filters"
            onAction={hasFilters ? clearFilters : undefined}
          />
        ) : null}

        {!loading && !error && groups.length > 0 ? (
          <ol className="ds-agenda">
            {visibleGroups.map((group) => (
              <li key={group.key} id={`day-${group.key}`} className="ds-agenda__day">
                <div className="ds-agenda__date">
                  <span>{relativeDayLabel(group.date)}</span>
                  <strong>{group.date.getDate()}</strong>
                  <span>{group.date.toLocaleDateString('en-GB', { month: 'long' })}</span>
                </div>
                <ul className="ds-agenda__rows">
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
            <button type="button" className="btn-secondary" onClick={() => setVisibleDayCount((count) => count + DAY_PAGE_SIZE)}>
              Show more dates
            </button>
          </div>
        ) : null}
      </section>

      {!loading && hackathons.length > 0 ? (
        <section className="ds-section ds-shell" aria-labelledby="hackathons-heading">
          <div className="ds-section__row">
            <SectionHeading
              className="ds-section__heading"
              titleId="hackathons-heading"
              title="Build something."
              description="Hackathons and build weekends with open spots."
            />
            {hackathons.length > HACKATHON_LIMIT ? (
              <Link to="/discover/hackathons?types=hackathons" className="ds-textlink">
                All hackathons <ArrowRightIcon aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          <div className="ds-hacks">
            {hackathons.slice(0, HACKATHON_LIMIT).map((item) => (
              <HackathonShelfCard key={`${item.source}-${item.id}`} item={item} href={getOpportunityHref(item)} />
            ))}
          </div>
        </section>
      ) : null}

      <ShowcaseCta
        id="events-cta-heading"
        title="Hosting something?"
        action="Submit an event"
        href="/partners#submit-event"
      />
    </div>
  );
}
