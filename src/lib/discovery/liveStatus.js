// Explicit extensions and base modules only, so Node tests can import this file.
// Where an event sits relative to right now: live, about to start, tonight.
import { DAY_MS, startOfDay } from './dates.js';
import { parseDate } from './discover.js';

export const SOON_WINDOW_MS = 90 * 60 * 1000;
export const EVENING_HOUR = 17;
export const PULSE_WINDOW_DAYS = 7;
const DEFAULT_LENGTH_MS = 2 * 60 * 60 * 1000;

function atClock(date, value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  if (!date || !match) return null;
  const result = new Date(date);
  result.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return result;
}

/** Start and end as local instants; untimed listings span their whole days. */
export function eventWindow(item) {
  const date = parseDate(item?.date);
  if (!date) return null;
  const lastDay = parseDate(item.endDate);
  const endDay = lastDay && lastDay >= date ? lastDay : date;

  const start = atClock(date, item.time);
  if (!start) {
    return { start: startOfDay(date), end: new Date(startOfDay(endDay).getTime() + DAY_MS), timed: false };
  }

  let end = atClock(endDay, item.endTime);
  if (end && end <= start) end = new Date(end.getTime() + DAY_MS);
  if (!end) {
    end = lastDay && lastDay > date
      ? new Date(startOfDay(endDay).getTime() + DAY_MS)
      : new Date(start.getTime() + DEFAULT_LENGTH_MS);
  }
  return { start, end, timed: true };
}

/**
 * 'live' while it runs, 'soon' in the 90 minutes before, 'tonight' for a later
 * evening start today, 'today' otherwise today, and null for anything else.
 */
export function liveStatus(item, now = new Date()) {
  const window = eventWindow(item);
  if (!window) return null;
  const time = now.getTime();

  if (window.end.getTime() <= time) return null;
  if (window.start.getTime() <= time) return window.timed || startOfDay(window.start) < startOfDay(now) ? 'live' : 'today';
  if (startOfDay(window.start).getTime() !== startOfDay(now).getTime()) return null;
  if (window.start.getTime() - time <= SOON_WINDOW_MS) return 'soon';
  return window.start.getHours() >= EVENING_HOUR ? 'tonight' : 'today';
}

export const LIVE_STATUS_LABELS = Object.freeze({
  live: 'Live now',
  soon: 'Starting soon',
  tonight: 'Tonight',
  today: 'Today',
});

/**
 * Everything worth a glance this week: what is running now (multi-day events
 * included), then the next seven days in start order.
 */
export function pulseItems(items, now = new Date(), days = PULSE_WINDOW_DAYS) {
  const windowEnd = startOfDay(now).getTime() + days * DAY_MS;

  return items
    .map((item) => ({ item, window: eventWindow(item) }))
    .filter(({ window }) => window && window.end > now && window.start.getTime() < windowEnd)
    .sort((first, second) => (
      first.window.start - second.window.start
      || String(first.item.title || '').localeCompare(String(second.item.title || ''))
    ))
    .map(({ item }) => item);
}

/** "Live now", "Tonight · 19:00", "Tomorrow · 09:30", "Fri 2 Oct · 18:00". */
export function pulseWhenLabel(item, now = new Date()) {
  const status = liveStatus(item, now);
  const clock = item.time ? String(item.time).slice(0, 5) : null;
  if (status === 'live') return LIVE_STATUS_LABELS.live;
  if (status) return clock ? `${LIVE_STATUS_LABELS[status]} · ${clock}` : LIVE_STATUS_LABELS[status];

  const date = parseDate(item.date);
  const difference = Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS);
  const day = difference === 1
    ? 'Tomorrow'
    : date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return clock ? `${day} · ${clock}` : day;
}

/** For a multi-day run already under way: "Ends today" or "Until Fri 2 Oct". */
export function runningUntilLabel(item, now = new Date()) {
  const start = parseDate(item?.date);
  const end = parseDate(item?.endDate);
  if (!start || !end || end <= start || startOfDay(start) >= startOfDay(now)) return null;
  if (startOfDay(end).getTime() === startOfDay(now).getTime()) return 'Ends today';
  return `Until ${end.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`;
}
