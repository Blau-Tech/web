import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

import { FALLBACK_WHATSAPP_URL } from '../../lib/city/cityConfig';
import { useCity } from '../../lib/city/cityContext';
import { fetchCommunityPulse } from '../../lib/discovery/communityPulse';
import { opportunityDetailPath, opportunityKey } from '../../lib/discovery/opportunityDetail';
import { NEWSLETTER_ENABLED, openNewsletter } from '../../lib/newsletter';
import { Link, useLocation } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import NewListingBadge from '../common/NewListingBadge';
import useInViewOnce from '../discover/showcase/useInViewOnce';
import useLoopWhileVisible from '../partners/useLoopWhileVisible';
import { GlassLink } from '../ui/glass-button';
import '../../styles/home-sections.css';

const EMPTY_STATS = Object.freeze([
  { label: 'Events and hackathons', value: null },
  { label: 'Organisations', value: null },
  { label: 'Communities', value: null },
]);

/** Counts up from zero the first time the totals scroll into view. */
function StatNumber({ value, play }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || value == null || !play) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.textContent = value;
      return undefined;
    }

    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => { node.textContent = Math.round(counter.value); },
    });
    return () => tween.kill();
  }, [play, value]);

  return <span ref={ref}>{value ?? '0'}</span>;
}

const eventDay = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const deadlineDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const MARQUEE_MIN_CARDS = 8;

/** When it happens, or for a program when applications close; no date means they take applications on a rolling basis. */
function whenLabel(item) {
  const parsed = item.date ? new Date(`${item.date}T00:00:00`) : null;
  const valid = parsed && !Number.isNaN(parsed.getTime());
  if (item.category === 'programs') return valid ? `Apply by ${deadlineDay.format(parsed)}` : 'Rolling';
  return valid ? eventDay.format(parsed) : 'Date to be announced';
}

function RecentCard({ item, search, hidden }) {
  return (
    <Link
      to={opportunityDetailPath(item, search)}
      className="hp-recent__card"
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden || undefined}
    >
      <span className="hp-recent__body">
        <small>
          <NewListingBadge item={item} />
          <span className="hp-recent__type">{item.tag}</span>
          <span>{whenLabel(item)}</span>
        </small>
        <strong>{item.title}</strong>
      </span>
    </Link>
  );
}

/** What was added lately, drifting past. Pauses offscreen and on hover. */
function RecentMarquee({ items }) {
  const scope = useRef(null);
  const { search } = useLocation();
  useLoopWhileVisible(scope, null);
  // Short lists repeat so one copy always spans the widest screen.
  const loop = useMemo(() => {
    if (!items.length) return [];
    const repeats = Math.ceil(MARQUEE_MIN_CARDS / items.length);
    return Array.from({ length: repeats }, () => items).flat();
  }, [items]);

  if (!loop.length) return null;

  return (
    <div ref={scope} className="hp-recent" role="region" aria-label="Recently added">
      <div className="hp-recent__track" style={{ '--hp-recent-duration': `${loop.length * 6}s` }}>
        {[false, true].map((isCopy) => loop.map((item, index) => (
          <RecentCard
            key={`${isCopy ? 'copy' : 'main'}-${index}-${opportunityKey(item)}`}
            item={item}
            search={search}
            hidden={isCopy || index >= items.length}
          />
        )))}
      </div>
    </div>
  );
}

/** The closing statement: how big the community is, and the way in. */
const CommunityPulse = () => {
  const { city, cityCode, isGeneric } = useCity();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [recent, setRecent] = useState([]);
  const statsRef = useRef(null);
  const statsInView = useInViewOnce(statsRef);
  const whatsappUrl = city.whatsappUrl || FALLBACK_WHATSAPP_URL;

  useEffect(() => {
    let isCurrent = true;
    fetchCommunityPulse(supabase, cityCode)
      .then((pulse) => {
        if (!isCurrent) return;
        setStats(pulse.stats);
        setRecent(pulse.recent);
      })
      .catch((error) => console.error('Could not load the community totals.', error));
    return () => { isCurrent = false; };
  }, [cityCode]);

  return (
    <section className="hp-close" aria-labelledby="community-pulse-title">
      <div className="section-container">
        <h2 id="community-pulse-title" className="hp-close__title">
          Built by people.
          <span><span className="brand-highlight">Growing daily.</span></span>
        </h2>
        <p className="hp-close__description">
          The {isGeneric ? 'Berlin and Munich' : city.name} tech community in numbers, and the latest additions.
        </p>

        <dl ref={statsRef} className="hp-close__stats">
          {stats.map((stat) => (
            <div key={stat.label} className="hp-close__stat">
              <dt>{stat.label}</dt>
              <dd><StatNumber value={stat.value} play={statsInView} /></dd>
            </div>
          ))}
        </dl>
      </div>

      <RecentMarquee items={recent} />

      <div className="section-container">
        <div className="hp-close__actions">
          {whatsappUrl ? (
            <GlassLink href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Join the community
            </GlassLink>
          ) : null}
          {NEWSLETTER_ENABLED ? (
            <button type="button" className="hp-close__link" onClick={() => openNewsletter()}>
              Get the newsletter
              <ChevronRightIcon aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default CommunityPulse;
