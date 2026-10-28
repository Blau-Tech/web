import { useRef } from 'react';

import ListingThumb from '../showcase/ListingThumb';
import useInViewOnce from '../showcase/useInViewOnce';

function dayLabel(day) {
  const date = day.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const count = day.items.length;
  return `${date}: ${count === 0 ? 'nothing listed' : `${count} ${count === 1 ? 'event' : 'events'}`}`;
}

function rangeLabel(days) {
  if (days.length === 0) return '';
  const format = (date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  return `${format(days[0].date)} – ${format(days[days.length - 1].date)}`;
}

// The day's cover is its first listing with a real image, so a day is never
// represented by a fallback photo when a flyer exists.
const coverItem = (items) => items.find((item) => item.imageUrl) || items[0];

/**
 * The next two weeks at a glance: one even column per day with the cover of
 * what is on and how many listings there are.
 */
export default function EventDayStrip({ days, loading, onSelectDay }) {
  const scope = useRef(null);
  const inView = useInViewOnce(scope);

  return (
    <div className="ds-strip-wrap">
      <p className="ds-strip__range">{rangeLabel(days)}</p>
      <ol ref={scope} className={`ds-strip${inView && !loading ? ' is-in' : ''}`} aria-label="The next 14 days">
        {days.map((day) => {
          const count = day.items.length;
          const isToday = day.index === 0;
          const weekday = day.date.getDay();
          const isWeekend = weekday === 0 || weekday === 6;
          const cover = count ? coverItem(day.items) : null;

          return (
            <li key={day.key} className="ds-strip__day" style={{ '--i': day.index }}>
              <button
                type="button"
                className={`ds-strip__button${isToday ? ' is-today' : ''}${count ? '' : ' is-empty'}${isWeekend ? ' is-weekend' : ''}`}
                disabled={loading || count === 0}
                onClick={() => onSelectDay(day.key)}
                aria-label={dayLabel(day)}
              >
                <span className="ds-strip__weekday" aria-hidden="true">
                  {isToday ? 'Today' : day.date.toLocaleDateString('en-GB', { weekday: 'short' })}
                </span>
                <span className="ds-strip__date" aria-hidden="true">{day.date.getDate()}</span>
                <span className="ds-strip__media" aria-hidden="true">
                  {loading ? <span className="ds-strip__ghost ds-skeleton" /> : null}
                  {cover ? (
                    <span className="ds-strip__thumb">
                      <ListingThumb item={cover} eager />
                    </span>
                  ) : null}
                </span>
                <span className="ds-strip__count" aria-hidden="true">
                  {loading || count === 0 ? '' : `${count} ${count === 1 ? 'event' : 'events'}`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
