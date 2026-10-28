import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

import DiscoverCalendar from '../../components/discover/DiscoverCalendar';
import DiscoverAgenda from '../../components/discover/DiscoverAgenda';
import DiscoverTimeline from '../../components/discover/DiscoverTimeline';
import FeaturedCarousel from '../../components/discover/FeaturedCarousel';
import FeaturedOpportunityCard from '../../components/discover/FeaturedOpportunityCard';
import NewListingBadge from '../../components/common/NewListingBadge';
import PopUp from '../../components/feedback/PopUp';
import { handleFetchError } from '../../lib/errors';
import { createLatestRequestGuard } from '../../lib/latestRequest';
import {
  discoveryTablesForOpportunityTypes,
  fetchDiscoveryItems,
  filterMemberDiscoveryItems,
} from '../../lib/member/memberDiscovery';
import { MEMBER_CITY_CONFIG } from '../../lib/member/memberPreferenceContract';
import { NEWSLETTER_ENABLED, openNewsletter } from '../../lib/newsletter';
import { useCity } from '../../lib/city/cityContext';
import { opportunityDetailPath, opportunityKey } from '../../lib/discovery/opportunityDetail';
import { useLocation, useNavigate } from '../../lib/router';
import { supabase } from '../../lib/supabase';

const MODE_LABEL = Object.freeze({
  events: 'Events',
  hackathons: 'Hackathons',
  programs: 'Programs',
});

const MODE_DESCRIPTION = Object.freeze({
  events: 'Meetups, talks, and community gatherings selected for ambitious people in tech.',
  hackathons: 'Build with sharp teams, solve real problems, and turn a weekend into momentum.',
  programs: 'Programs and opportunities chosen to help you make your next move.',
});

function formatLongDate(value) {
  if (!value) return 'Date to be announced';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return null;
  return String(value).slice(0, 5);
}

const MemberDiscoverPage = ({ mode = 'hackathons' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    city,
    selectedDiscoveryCityCodes,
    selectedOpportunityTypes,
  } = useCity();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [view, setView] = useState(() => (
    mode === 'events' || mode === 'hackathons' ? 'cards' : 'calendar'
  ));
  const [calendarMode, setCalendarMode] = useState('month');
  const [discoveryRequestGuard] = useState(createLatestRequestGuard);

  const selectedCityNames = selectedDiscoveryCityCodes
    .map((selectedCityCode) => MEMBER_CITY_CONFIG[selectedCityCode].name);
  const selectedCityLabel = selectedCityNames.join(' and ');
  const communityCity = selectedDiscoveryCityCodes.length === 1
    ? MEMBER_CITY_CONFIG[selectedDiscoveryCityCodes[0]]
    : null;
  const pageTitle = `${MODE_LABEL[mode]} in ${selectedCityLabel}`;
  const noMatchesTitle = `No matching opportunities in ${selectedCityLabel}`;
  const noMatchesDescription = selectedDiscoveryCityCodes.length === 1
    ? `Check back soon for newly curated opportunities for ${selectedCityLabel}.`
    : 'Check back soon for newly curated opportunities.';
  const discoveryFilterKey = [
    selectedDiscoveryCityCodes.join(','),
    selectedOpportunityTypes.join(','),
  ].join('|');

  useLayoutEffect(() => {
    discoveryRequestGuard.activate(discoveryFilterKey);
  }, [discoveryFilterKey, discoveryRequestGuard]);

  const fetchItems = useCallback(async () => {
    const canCommit = discoveryRequestGuard.begin(discoveryFilterKey);
    if (!canCommit()) return;

    try {
      setLoading(true);
      setError(null);

      const nextItems = await fetchDiscoveryItems(supabase, {
        cities: selectedDiscoveryCityCodes,
        opportunityTypes: selectedOpportunityTypes,
      });
      if (!canCommit()) return;

      setItems(nextItems);
    } catch (fetchError) {
      if (!canCommit()) return;
      handleFetchError(fetchError, setError, `${selectedCityLabel} opportunities`);
    } finally {
      if (canCommit()) setLoading(false);
    }
  }, [
    discoveryFilterKey,
    discoveryRequestGuard,
    selectedCityLabel,
    selectedDiscoveryCityCodes,
    selectedOpportunityTypes,
  ]);

  useEffect(() => {
    fetchItems();

    let channel = supabase.channel(
      `discover_${selectedDiscoveryCityCodes.join('_')}_${selectedOpportunityTypes.join('_')}`,
    );

    for (const table of discoveryTablesForOpportunityTypes(selectedOpportunityTypes)) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        fetchItems,
      );
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems, selectedDiscoveryCityCodes, selectedOpportunityTypes]);

  const filteredItems = useMemo(
    () => filterMemberDiscoveryItems(items, mode),
    [items, mode],
  );

  const featuredHackathons = useMemo(
    () => (mode === 'hackathons' ? filteredItems.slice(0, 6) : []),
    [filteredItems, mode],
  );

  const displayItems = useMemo(
    () => filteredItems.map((item) => ({
      ...item,
      time: formatTime(item.time),
    })),
    [filteredItems],
  );

  const calendarItems = useMemo(
    () => displayItems.map((item) => ({
      ...item,
      name: item.title,
    })),
    [displayItems],
  );

  const openOpportunity = useCallback((item) => {
    navigate(opportunityDetailPath(item, location.search));
  }, [location.search, navigate]);

  return (
    <>
      <div className={`discover-page discover-page--${mode} section-container !max-w-[96rem] -mt-3 lg:-mt-11`}>
        <div className="relative mx-auto mt-1 max-w-5xl lg:max-w-[85.5rem]">
          {mode === 'hackathons' ? (
            <FeaturedCarousel
              className="event-showcase-feature discover-featured-carousel"
              headingClassName="event-showcase-section-header"
              viewportClassName="event-showcase-feature-grid"
              headingId="featured-hackathons-heading"
              title="Featured hackathons"
              description="The next hackathons worth clearing a weekend for."
              items={featuredHackathons}
              loading={loading}
              skeletonCount={6}
              getItemKey={opportunityKey}
              renderSkeleton={() => (
                <span className="event-showcase-feature-card event-showcase-skeleton" aria-hidden="true" />
              )}
              renderItem={(item, index, { isDuplicate }) => (
                <FeaturedOpportunityCard
                  item={item}
                  eager={!isDuplicate && index < 2}
                  href={opportunityDetailPath(item, location.search)}
                />
              )}
              fallback={error ? null : (
                <div className="event-showcase-feature-empty discover-surface">
                  <p className="blau-text-secondary text-sm">
                    New hackathons will appear here as soon as they are announced.
                  </p>
                </div>
              )}
            />
          ) : null}
          <section
            className="relative pb-10 lg:pb-16"
            aria-labelledby="discover-results-heading"
          >
          <header className="discover-product-header">
            <div className="discover-product-copy">
              <h1
                id="discover-results-heading"
                className="discover-page-title"
              >
                {pageTitle}
              </h1>
              <p className="discover-product-description">{MODE_DESCRIPTION[mode]}</p>
            </div>

            <div className="discover-product-toolbar">
              <nav
                className="discover-product-links"
                aria-label={communityCity
                  ? `${communityCity.name} community links`
                  : 'Blau Tech community links'}
              >
              {communityCity?.whatsappUrl && (
                <a
                  href={communityCity.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="discover-utility-link"
                  aria-label={`Join ${communityCity.name} WhatsApp`}
                  title={`Join ${communityCity.name} WhatsApp`}
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              )}
              {NEWSLETTER_ENABLED && (
                <button
                  type="button"
                  onClick={() => openNewsletter()}
                  className="discover-utility-link"
                  aria-label="Subscribe to the Blau Tech newsletter"
                  title="Subscribe to the newsletter"
                >
                  <EnvelopeIcon className="h-4 w-4 shrink-0" aria-hidden />
                  Newsletter
                </button>
              )}
              {city.linkedinUrl && (
                <a
                  href={city.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="discover-utility-link"
                  aria-label="Follow Blau Tech on LinkedIn"
                  title="Follow Blau Tech on LinkedIn"
                >
                  <svg
                    className="h-4 w-4 shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              )}
              </nav>

              <div className="discover-product-actions">
              <div className="discover-view-switcher" aria-label="Choose discovery view">
                <button
                  type="button"
                  onClick={() => setView('cards')}
                  className="discover-view-option"
                  aria-pressed={view === 'cards'}
                >
                  <Squares2X2Icon className="h-4 w-4" aria-hidden />
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setView('timeline')}
                  className="discover-view-option"
                  aria-pressed={view === 'timeline'}
                >
                  <ListBulletIcon className="h-4 w-4" aria-hidden />
                  Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setView('calendar')}
                  className="discover-view-option"
                  aria-pressed={view === 'calendar'}
                >
                  <CalendarDaysIcon className="h-4 w-4" aria-hidden />
                  Calendar
                </button>
              </div>
              </div>
            </div>
          </header>

          {loading && (
            <div className="discover-skeleton-grid relative" aria-label="Loading opportunities">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="discover-skeleton h-72 animate-pulse rounded-[2rem] motion-reduce:animate-none"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="discover-surface relative p-6 text-center">
              <p className="blau-text-primary font-semibold">{error}</p>
              <button type="button" onClick={fetchItems} className="btn-primary mt-4">
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredItems.length === 0 && (
            <div className="discover-surface relative p-7 text-center">
              <h3 className="text-lg font-semibold">{noMatchesTitle}</h3>
              <p className="blau-text-secondary mt-1 text-sm">
                {noMatchesDescription}
              </p>
            </div>
          )}

          {!loading && !error && filteredItems.length > 0 && (
            view === 'calendar' ? (
              <div className="blau-surface discover-calendar-surface discover-product-panel relative p-4 sm:p-5">
                <DiscoverCalendar
                  items={calendarItems}
                  mode={calendarMode}
                  onModeChange={setCalendarMode}
                  onItemClick={openOpportunity}
                  onShowDay={(day) => {
                    setSelectedDay(day);
                  }}
                />
              </div>
            ) : view === 'timeline' ? (
              <DiscoverTimeline
                items={displayItems}
                onItemClick={openOpportunity}
              />
            ) : (
              <div>
                <DiscoverAgenda
                  items={displayItems}
                  onItemClick={openOpportunity}
                  />
              </div>
            )
          )}
          </section>
        </div>
      </div>

      <PopUp
        isOpen={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatLongDate(selectedDay.date) : undefined}
        size="lg"
      >
        {selectedDay ? (
          <div className="space-y-2">
            {selectedDay.items.map((item) => (
              <button
                key={`${item.source}-${item.id}`}
                type="button"
                onClick={() => openOpportunity(item)}
                className="discover-day-item group flex w-full items-center gap-3 rounded-xl p-3 text-left transition focus-visible:outline-hidden focus-visible:ring-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <NewListingBadge item={item} />
                    <span className="discover-day-time text-xs font-bold">
                      {formatTime(item.time) || 'Time TBA'}
                    </span>
                    {item.tag && (
                      <span className="discover-day-tag text-[10px] font-semibold uppercase tracking-[0.12em]">
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <p className="discover-day-title mt-1 truncate text-sm font-semibold">
                    {item.title}
                  </p>
                  {(item.organizer || item.location) && (
                    <p className="discover-day-meta mt-1 truncate text-xs">
                      {[item.organizer, item.location].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <ChevronRightIcon
                  className="discover-day-chevron h-4 w-4 shrink-0 transition"
                  aria-hidden
                />
              </button>
            ))}
          </div>
        ) : null}
      </PopUp>
    </>
  );
};

export default MemberDiscoverPage;
