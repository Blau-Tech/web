// Explicit extensions and base modules only, so Node tests can import this file.
import { DAY_MS, startOfDay } from './dates.js';
import { parseDate } from './discover.js';

const eventDate = (item) => parseDate(item.date);

export const STRIP_DAY_COUNT = 14;
export const SPOTLIGHT_WINDOW_DAYS = 14;

export const WHEN_FILTERS = Object.freeze([
  { key: 'all', label: 'Anytime' },
  { key: 'week', label: 'Next 7 days' },
  { key: 'weekend', label: 'This weekend' },
  { key: 'month', label: 'Next 30 days' },
]);

export function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function compareByDateAndTime(first, second) {
  return (eventDate(first) - eventDate(second))
    || String(first.time || '99').localeCompare(String(second.time || '99'))
    || String(first.title || '').localeCompare(String(second.title || ''));
}

/** The last day a listing runs: its end date when it spans several days. */
function lastDay(item) {
  const start = eventDate(item);
  const end = parseDate(item.endDate);
  return end && start && end > start ? end : start;
}

/**
 * The day a listing is filed under. A multi-day event that is already running
 * sits on today, so a conference in progress stays in view until it ends.
 */
export function agendaDay(item, now = new Date()) {
  const start = startOfDay(eventDate(item));
  if (lastDay(item) <= eventDate(item)) return start;
  const today = startOfDay(now);
  return start < today ? today : start;
}

/** Only events that have not finished yet, soonest first (running ones lead). */
export function upcomingEvents(items, now = new Date()) {
  const today = startOfDay(now);
  return items
    .filter((item) => {
      const date = eventDate(item);
      return date && startOfDay(lastDay(item)) >= today;
    })
    .sort(compareByDateAndTime);
}

/** The upcoming Saturday and Sunday (today counts when it is the weekend). */
function weekendRange(now) {
  const today = startOfDay(now);
  const weekday = today.getDay();
  const daysToSaturday = weekday === 0 ? -1 : 6 - weekday;
  const saturday = new Date(today.getTime() + daysToSaturday * DAY_MS);
  const sunday = new Date(saturday.getTime() + DAY_MS);
  return [weekday === 0 ? today : saturday, sunday];
}

export function matchesWhen(item, whenKey, now = new Date()) {
  if (whenKey === 'all') return true;
  if (!eventDate(item)) return false;

  const day = agendaDay(item, now).getTime();
  const today = startOfDay(now).getTime();
  if (whenKey === 'week') return day - today < 7 * DAY_MS;
  if (whenKey === 'month') return day - today < 30 * DAY_MS;
  if (whenKey === 'weekend') {
    const [start, end] = weekendRange(now);
    return day >= start.getTime() && day <= end.getTime();
  }
  return true;
}

/** Sorted events grouped into one entry per calendar day. */
export function groupByDay(items, now = new Date()) {
  const groups = [];
  let current = null;

  for (const item of items) {
    const date = agendaDay(item, now);
    const key = dayKey(date);
    if (!current || current.key !== key) {
      current = { key, date, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }

  return groups;
}

/** The next N calendar days, each with the events on it, including empty days. */
export function stripDays(items, now = new Date(), count = STRIP_DAY_COUNT) {
  const today = startOfDay(now);
  const byDay = new Map(groupByDay(items, now).map((group) => [group.key, group.items]));

  return Array.from({ length: count }, (_, index) => {
    // Calendar arithmetic, not 24h steps, so DST changeover days aren't doubled or skipped.
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index);
    const key = dayKey(date);
    return { key, date, index, items: byDay.get(key) || [] };
  });
}

/** Up to three standout events in the next two weeks, highlights first. */
export function selectSpotlight(items, now = new Date()) {
  const today = startOfDay(now).getTime();
  const windowEnd = today + SPOTLIGHT_WINDOW_DAYS * DAY_MS;
  const inWindow = items.filter((item) => {
    const day = startOfDay(eventDate(item)).getTime();
    return day >= today && day < windowEnd;
  });

  const ranked = [...inWindow].sort((first, second) => (
    Number(Boolean(second.isHighlight)) - Number(Boolean(first.isHighlight))
    || Number(Boolean(second.imageUrl)) - Number(Boolean(first.imageUrl))
    || compareByDateAndTime(first, second)
  ));

  return ranked.slice(0, 3);
}

/** The one event to feature for the next seven days: highlights first, then ones with artwork. */
export function eventOfTheWeek(items, now = new Date()) {
  const today = startOfDay(now).getTime();
  const windowEnd = today + 7 * DAY_MS;
  const candidates = items.filter((item) => {
    if (!eventDate(item)) return false;
    const day = agendaDay(item, now).getTime();
    return day >= today && day < windowEnd;
  });

  return [...candidates].sort((first, second) => (
    Number(Boolean(second.isHighlight)) - Number(Boolean(first.isHighlight))
    || Number(Boolean(second.imageUrl)) - Number(Boolean(first.imageUrl))
    || compareByDateAndTime(first, second)
  ))[0] || null;
}

export function relativeDayLabel(date, now = new Date()) {
  const difference = Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS);
  if (difference === 0) return 'Today';
  if (difference === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'long' });
}

export function formatTimeRange(item) {
  const start = item.time ? String(item.time).slice(0, 5) : null;
  const end = item.endTime ? String(item.endTime).slice(0, 5) : null;
  if (!start) return 'Time TBA';
  return end && end !== start ? `${start} - ${end}` : start;
}
