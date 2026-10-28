import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useCity } from '../../lib/city/cityContext';
import { opportunityDetailPath } from '../../lib/discovery/opportunityDetail';
import { liveStatus, pulseItems, pulseWhenLabel } from '../../lib/discovery/liveStatus';
import { fetchDiscoveryItems } from '../../lib/member/memberDiscovery';
import { MEMBER_CITY_CONFIG } from '../../lib/member/memberPreferenceContract';
import { Link, useLocation } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import '../../styles/live-pulse.css';

const EVENT_TYPES = Object.freeze(['events', 'hackathons']);
const PULSE_LIMIT = 14;
const PIXELS_PER_SECOND = 38;
const MIN_ITEMS = 2;
// Re-read the clock each minute so "Starting soon" turns into "Live now".
const CLOCK_TICK_MS = 60 * 1000;

function PulseRun({ items, now, showCity, search, hidden = false }) {
  return (
    <ul className="live-pulse__run" aria-hidden={hidden || undefined}>
      {items.map((item) => {
        const status = liveStatus(item, now);
        return (
          <li key={`${item.source}-${item.id}`} className="live-pulse__item">
            <Link
              to={opportunityDetailPath(item, search)}
              className="live-pulse__link"
              tabIndex={hidden ? -1 : undefined}
            >
              <span className={`live-pulse__when${status === 'live' ? ' live-pulse__when--live' : ''}`}>
                {pulseWhenLabel(item, now)}
              </span>
              <span className="live-pulse__title">{item.title}</span>
              {showCity && MEMBER_CITY_CONFIG[item.city] ? (
                <span className="live-pulse__city">{MEMBER_CITY_CONFIG[item.city].name}</span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A slow ticker along the foot of the hero: what is live right now and what
 * is on over the next seven days, each linking to its listing.
 */
export default function LivePulse() {
  const { selectedDiscoveryCityCodes } = useCity();
  const { search } = useLocation();
  const [items, setItems] = useState([]);
  const [now, setNow] = useState(() => new Date());
  const [duration, setDuration] = useState(null);
  const [inView, setInView] = useState(true);
  const rootRef = useRef(null);
  const runRef = useRef(null);
  const cityKey = selectedDiscoveryCityCodes.join(',');

  useEffect(() => {
    let isCurrent = true;
    fetchDiscoveryItems(supabase, { cities: cityKey.split(','), opportunityTypes: EVENT_TYPES })
      .then((nextItems) => { if (isCurrent) setItems(nextItems); })
      // The ticker simply stays hidden; nothing else depends on it.
      .catch((error) => console.error('Could not load this week’s events.', error));
    return () => { isCurrent = false; };
  }, [cityKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const visible = useMemo(() => pulseItems(items, now).slice(0, PULSE_LIMIT), [items, now]);
  const liveCount = visible.filter((item) => liveStatus(item, now) === 'live').length;
  const showCity = selectedDiscoveryCityCodes.length > 1;

  // A constant reading speed however many listings are in the run.
  useLayoutEffect(() => {
    const width = runRef.current?.scrollWidth;
    if (width) setDuration(Math.max(24, width / PIXELS_PER_SECOND));
  }, [visible, showCity]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible.length]);

  if (visible.length < MIN_ITEMS) return null;

  return (
    <section
      ref={rootRef}
      className={`live-pulse${inView ? '' : ' live-pulse--paused'}`}
      aria-label="Happening this week"
    >
      <p className="live-pulse__label">
        <span className={`live-pulse__dot${liveCount > 0 ? ' live-pulse__dot--live' : ''}`} aria-hidden="true" />
        {liveCount > 0 ? 'Live now' : 'This week'}
      </p>
      <div className="live-pulse__viewport">
        <div
          className="live-pulse__track"
          style={duration ? { '--live-pulse-duration': `${duration}s` } : undefined}
        >
          <div ref={runRef} className="live-pulse__segment">
            <PulseRun items={visible} now={now} showCity={showCity} search={search} />
          </div>
          <div className="live-pulse__segment live-pulse__segment--echo">
            <PulseRun items={visible} now={now} showCity={showCity} search={search} hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
