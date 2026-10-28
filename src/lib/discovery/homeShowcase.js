// Explicit extensions and base modules only, so Node tests can import this file.
// Live material for the home "Find your next opportunity" graphics: the coming
// week of events, the next hackathons and the nearest program deadlines.
import { stripDays, upcomingEvents } from './eventAgenda.js';
import { comparePrograms, deadlineRunway, isOpenProgram } from './programBrowse.js';

export const WEEK_DAY_COUNT = 7;
export const WEEK_STACK_LIMIT = 3;
export const DECK_SIZE = 4;
export const RUNWAY_PIN_LIMIT = 5;

export function homeShowcase({ events = [], hackathons = [], programs = [] } = {}, now = new Date()) {
  const nextEvents = upcomingEvents(events, now);
  const week = stripDays(nextEvents, now, WEEK_DAY_COUNT);
  const nextHackathons = upcomingEvents(hackathons, now);
  const openPrograms = programs.filter((item) => isOpenProgram(item, now)).sort(comparePrograms);

  return {
    events: {
      week,
      weekCount: week.reduce((total, day) => total + day.items.length, 0),
      upcomingCount: nextEvents.length,
    },
    hackathons: {
      // Listings with their own artwork lead the deck; order stays soonest first.
      deck: [...nextHackathons]
        .sort((first, second) => Number(Boolean(second.imageUrl)) - Number(Boolean(first.imageUrl)))
        .slice(0, DECK_SIZE),
      count: nextHackathons.length,
    },
    programs: {
      marks: deadlineRunway(openPrograms, now).marks.slice(0, RUNWAY_PIN_LIMIT),
      count: openPrograms.length,
    },
  };
}

/** The one live line under each panel title, or null while there is nothing to say. */
export function showcaseCounts(showcase) {
  const { events, hackathons, programs } = showcase;
  const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

  return {
    events: events.weekCount > 0
      ? `${events.weekCount} this week`
      : events.upcomingCount > 0 ? `${events.upcomingCount} coming up` : null,
    hackathons: hackathons.count > 0 ? `${plural(hackathons.count, 'hackathon')} coming up` : null,
    programs: programs.count > 0 ? `${programs.count} open for applications` : null,
  };
}
