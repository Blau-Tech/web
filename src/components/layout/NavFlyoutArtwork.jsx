import { useEffect, useState } from 'react';
import '@fontsource-variable/mona-sans/wght.css';
import { useCity } from '../../lib/city/cityContext';
import { eventOfTheWeek, upcomingEvents } from '../../lib/discovery/eventAgenda';
import { opportunityDetailPath } from '../../lib/discovery/opportunityDetail';
import { fetchDiscoveryItems, filterMemberDiscoveryItems } from '../../lib/member/memberDiscovery';
import { supabase } from '../../lib/supabase';
import { Link } from '../../lib/router';

const ORGANISERS_ARTWORK = {
  label: 'Partner',
  className: 'nav-flyout-art--organisers',
};

// The event the Discover flyout leads with. Once it has passed, the flyout falls
// back to the best event of the coming week.
const FEATURED_EVENT_ID = '24d5585a-628b-4a92-a7cc-ee86fa7da817';

// The flyout remounts on every hover, so the lookup is shared per city set.
const eventLookups = new Map();

function loadEventOfTheWeek(cityKey) {
  if (!eventLookups.has(cityKey)) {
    const lookup = fetchDiscoveryItems(supabase, {
      cities: cityKey.split(','),
      opportunityTypes: ['events'],
    })
      .then((items) => {
        const events = filterMemberDiscoveryItems(items, 'events');
        const featured = upcomingEvents(events).find((item) => item.id === FEATURED_EVENT_ID);
        return { event: featured || eventOfTheWeek(events), label: 'Featured' };
      })
      .catch((error) => {
        eventLookups.delete(cityKey);
        console.error('Could not load the featured event.', error);
        return null;
      });
    eventLookups.set(cityKey, lookup);
  }
  return eventLookups.get(cityKey);
}

function EventOfTheWeek({ locationSearch }) {
  const { selectedDiscoveryCityCodes } = useCity();
  const cityKey = selectedDiscoveryCityCodes.join(',');
  const [feature, setFeature] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    loadEventOfTheWeek(cityKey).then((next) => { if (isCurrent) setFeature(next); });
    return () => { isCurrent = false; };
  }, [cityKey]);

  if (!feature?.event) return null;

  const { event, label } = feature;

  return (
    <Link
      className="nav-flyout-feature"
      to={opportunityDetailPath(event, locationSearch)}
      aria-label={`${label}: ${event.title}`}
    >
      <span className="nav-flyout-feature__frame">
        {event.imageUrl ? <img src={event.imageUrl} alt="" decoding="async" /> : null}
        <span className="nav-flyout-feature__badge">{label}</span>
      </span>
    </Link>
  );
}

export default function NavFlyoutArtwork({ flyout, locationSearch = '' }) {
  if (flyout === 'Discover') return <EventOfTheWeek locationSearch={locationSearch} />;
  if (flyout !== 'For organisers') return null;

  return (
    <figure className={`nav-flyout-art ${ORGANISERS_ARTWORK.className}`} aria-hidden="true">
      <span className="nav-flyout-glacier">
        <span className="nav-flyout-glacier__glow" />
        <span className="nav-flyout-glacier__name">{ORGANISERS_ARTWORK.label}</span>
      </span>
    </figure>
  );
}
