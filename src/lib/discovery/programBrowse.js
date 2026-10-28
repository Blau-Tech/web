// Explicit extensions and base modules only, so Node tests can import this file.
// programFormat pulls in the city config, so its day count is repeated here.
import { DAY_MS, startOfDay } from './dates.js';
import { parseDate, programApplicationStatus } from './discover.js';

function daysUntilDeadline(value, now = new Date()) {
  const deadline = parseDate(value);
  if (!deadline) return null;
  return Math.ceil((startOfDay(deadline) - startOfDay(now)) / DAY_MS);
}

export const RUNWAY_LIMIT = 7;
const RUNWAY_MIN_WINDOW_DAYS = 45;
const RUNWAY_MAX_WINDOW_DAYS = 180;
// A runway card is roughly a sixth of the track wide; closer marks go up a lane.
const RUNWAY_LANE_GAP = 17;
const RUNWAY_LANES = 3;
const RUNWAY_TICK_CLEARANCE = 6;

export const DEADLINE_FILTERS = Object.freeze([
  { key: 'all', label: 'Any deadline' },
  { key: '30-days', label: 'Closing in 30 days' },
  { key: '90-days', label: 'Closing in 90 days' },
  { key: 'open', label: 'Rolling' },
]);

export const PROGRAM_CATEGORY_FILTERS = Object.freeze([
  { code: 'LEARNING', key: 'learning', label: 'Fellowships & learning programs' },
  { code: 'RESIDENCY', key: 'residency', label: 'Residencies & hacker houses' },
]);

export function programGroup(item) {
  if (item.programSubtype === 'RESIDENCY' || item.tag === 'Residency') return 'residency';
  if (['Fellowship', 'Student program', 'Career development', 'Founder program', 'Builder community'].includes(item.tag)) return 'learning';
  return null;
}

export function programTypeFilterFromSearch(search) {
  const code = new URLSearchParams(search).get('programType')?.toUpperCase();
  if (['FELLOWSHIP', 'STUDENT_PROGRAM', 'CAREER_DEVELOPMENT', 'FOUNDER_PROGRAM', 'COMMUNITY'].includes(code)) return 'learning';
  return PROGRAM_CATEGORY_FILTERS.find((item) => item.code === code)?.key || 'all';
}

/** Confirmed open applications; missing dates alone never imply rolling. */
export function isOpenProgram(item, now = new Date()) {
  return ['OPEN', 'ROLLING'].includes(programApplicationStatus(item, now));
}

export function matchesDeadline(item, filterKey, now = new Date()) {
  if (filterKey === 'all') return true;
  const days = daysUntilDeadline(item.date, now);
  if (filterKey === 'open') return programApplicationStatus(item, now) === 'ROLLING';
  if (!isOpenProgram(item, now) && programApplicationStatus(item, now) !== 'UPCOMING') return false;
  if (days == null || days < 0) return false;
  return filterKey === '30-days' ? days <= 30 : days <= 90;
}

export function comparePrograms(first, second) {
  const firstDate = parseDate(first.date)?.getTime() ?? Infinity;
  const secondDate = parseDate(second.date)?.getTime() ?? Infinity;
  return firstDate - secondDate || first.title.localeCompare(second.title);
}

/** Public groups represented by the supplied listings. */
export function programTypeSummaries(items) {
  return PROGRAM_CATEGORY_FILTERS.map(({ key, label }) => {
    const grouped = items.filter(item => programGroup(item) === key);
    return { key, label, count: grouped.length, items: grouped };
  }).filter(group => group.count > 0);
}

/**
 * The next deadlines placed along a timeline. Each mark gets a horizontal
 * position (0-100) and a lane, so neighbouring cards stack instead of overlap.
 */
export function deadlineRunway(items, now = new Date()) {
  const upcoming = items
    .filter((item) => isOpenProgram(item, now) || programApplicationStatus(item, now) === 'UPCOMING')
    .map((item) => ({ item, days: daysUntilDeadline(item.date, now) }))
    .filter(({ days }) => days != null && days >= 0 && days <= RUNWAY_MAX_WINDOW_DAYS)
    .sort((first, second) => first.days - second.days)
    .slice(0, RUNWAY_LIMIT);

  if (upcoming.length === 0) return { marks: [], ticks: [], windowDays: 0 };

  const furthest = upcoming[upcoming.length - 1].days;
  const windowDays = Math.min(
    RUNWAY_MAX_WINDOW_DAYS,
    Math.max(RUNWAY_MIN_WINDOW_DAYS, Math.ceil(furthest * 1.12)),
  );
  const laneEnds = Array(RUNWAY_LANES).fill(-Infinity);
  const marks = [];

  for (const { item, days } of upcoming) {
    const position = (days / windowDays) * 100;
    const lane = laneEnds.findIndex((end) => position - end >= RUNWAY_LANE_GAP);
    if (lane === -1) continue;
    laneEnds[lane] = position;
    marks.push({ item, days, position, lane });
  }

  const today = startOfDay(now);
  const ticks = [];
  for (let offset = 1; offset <= windowDays; offset += 1) {
    const date = new Date(today.getTime() + offset * DAY_MS);
    const position = (offset / windowDays) * 100;
    // Month starts only, and never on top of the "Today" label.
    if (date.getDate() !== 1 || position < RUNWAY_TICK_CLEARANCE) continue;
    ticks.push({
      key: date.toISOString(),
      position,
      label: date.toLocaleDateString('en-GB', { month: 'short' }),
    });
  }

  return { marks, ticks, windowDays };
}
