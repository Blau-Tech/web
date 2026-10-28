import assert from 'node:assert/strict';

import {
  groupByDay,
  matchesWhen,
  selectSpotlight,
  stripDays,
  upcomingEvents,
} from '../src/lib/discovery/eventAgenda.js';
import {
  deadlineRunway,
  isOpenProgram,
  matchesDeadline,
  programTypeSummaries,
} from '../src/lib/discovery/programBrowse.js';
import { filterItems, programApplicationStatus } from '../src/lib/discovery/discover.js';
import {
  deadlineStatus,
  deadlineUrgency,
  formatApplicationOpen,
  formatDeadline,
} from '../src/lib/discovery/programFormat.js';
import { homeShowcase, showcaseCounts } from '../src/lib/discovery/homeShowcase.js';

// Tuesday 29 September 2026, midday.
const now = new Date(2026, 8, 29, 12);
const event = (id, date, extra = {}) => ({ id, source: 'events', title: `Event ${id}`, date, ...extra });

// Events: browsing never shows what already happened.
const events = [
  event(1, '2026-09-28'),
  event(2, '2026-09-29', { time: '18:00:00' }),
  event(3, '2026-09-29', { time: '08:30:00' }),
  event(4, '2026-10-03'),
  event(5, '2026-10-04', { isHighlight: true, imageUrl: 'a.jpg' }),
  event(6, '2026-11-20'),
];
const upcoming = upcomingEvents(events, now);
assert.deepEqual(upcoming.map((item) => item.id), [3, 2, 4, 5, 6], 'past events are dropped and same-day events sort by time');

// A multi-day conference that started yesterday is still on: it sits on today.
const conference = event('conf', '2026-09-28', { endDate: '2026-09-30' });
const withConference = upcomingEvents([...events, conference], now);
assert.equal(withConference[0].id, 'conf', 'running multi-day events lead the agenda');
assert.equal(groupByDay(withConference, now)[0].key, '2026-09-29', 'running events are filed under today');
assert.equal(groupByDay(withConference, now)[0].items.length, 3);
assert(matchesWhen(conference, 'week', now));
assert(!upcomingEvents([event('ended', '2026-09-26', { endDate: '2026-09-28' })], now).length, 'finished runs are dropped');

const groups = groupByDay(upcoming);
assert.deepEqual(groups.map((group) => [group.key, group.items.length]), [
  ['2026-09-29', 2],
  ['2026-10-03', 1],
  ['2026-10-04', 1],
  ['2026-11-20', 1],
]);

assert.equal(upcoming.filter((item) => matchesWhen(item, 'weekend', now)).length, 2, 'this weekend is Saturday 3 and Sunday 4 October');
assert.equal(upcoming.filter((item) => matchesWhen(item, 'week', now)).length, 4);
assert.equal(upcoming.filter((item) => matchesWhen(item, 'month', now)).length, 4);

const days = stripDays(upcoming, now);
assert.equal(days.length, 14, 'the strip always shows two full weeks, including empty days');
assert.equal(days[0].items.length, 2);
assert.equal(days[1].items.length, 0);
const changeoverKeys = stripDays([], new Date(2026, 9, 18, 12)).map((day) => day.key);
assert.equal(new Set(changeoverKeys).size, 14, 'a DST changeover in the window neither doubles nor skips a day');
assert.equal(changeoverKeys[13], '2026-10-31');

assert.equal(selectSpotlight(upcoming, now)[0].id, 5, 'highlights lead the spotlight');
assert(!selectSpotlight(upcoming, now).some((item) => item.id === 6), 'the spotlight only covers the next two weeks');

// Programs: open versus closed, and a runway without overlapping cards.
const program = (id, date, tag = 'Program') => ({
  id, source: 'opportunities', category: 'programs', title: `Program ${id}`, date, tag, applicationStatus: 'OPEN',
});
const programs = [
  program('closed', '2026-09-01'),
  program('today', '2026-09-29', 'Fellowship'),
  { ...program('rolling', null, 'Accelerator'), applicationStatus: 'ROLLING' },
  program('a', '2026-10-30'),
  program('b', '2026-11-01'),
  program('c', '2026-11-02'),
  program('d', '2026-11-03'),
];

assert.equal(isOpenProgram(programs[0], now), false, 'a passed deadline is closed');
assert.equal(isOpenProgram(programs[1], now), true, 'a deadline today is still open');
assert.equal(isOpenProgram(programs[2], now), true, 'rolling programs stay open');
assert.equal(matchesDeadline(programs[2], 'open', now), true);
assert.equal(matchesDeadline(programs[3], '30-days', now), false);
assert.equal(matchesDeadline(programs[3], '90-days', now), true);

const unknown = { ...program('unknown', null), applicationStatus: 'UNKNOWN' };
const cancelled = { ...program('cancelled', '2026-10-15'), applicationStatus: 'CLOSED' };
const future = { ...program('future', '2026-10-15'), applicationStatus: 'UPCOMING', applicationOpenDate: '2026-10-01' };
assert.equal(programApplicationStatus(unknown, now), 'UNKNOWN');
assert.equal(programApplicationStatus({ date: null }, now), 'UNKNOWN', 'older sparse rows never imply rolling');
assert.equal(programApplicationStatus({ ...unknown, date: '2026-10-15' }, now), 'UNKNOWN', 'a future deadline alone does not establish open applications');
assert.equal(programApplicationStatus({ ...unknown, applicationStatus: 'OPEN' }, now), 'UNKNOWN', 'an undated non-rolling application needs revalidation');
assert.equal(programApplicationStatus({ ...future, applicationStatus: 'OPEN' }, now), 'UPCOMING', 'a future opening date takes precedence over an open status');
assert.equal(programApplicationStatus(future, now), 'UPCOMING');
assert.equal(programApplicationStatus(future, new Date(2026, 9, 1)), 'OPEN', 'an approved application window opens on its start date');
assert.equal(programApplicationStatus(future, new Date(2026, 9, 15)), 'OPEN', 'the deadline day is still open');
assert.equal(programApplicationStatus(future, new Date(2026, 9, 16)), 'CLOSED');
assert.equal(programApplicationStatus(cancelled, now), 'CLOSED', 'cancellation overrides a future deadline');
assert.equal(programApplicationStatus({ ...future, applicationStatus: 'CLOSED' }, now), 'CLOSED', 'cancellation also overrides an upcoming opening date');
assert.equal(isOpenProgram(unknown, now), false);
assert.equal(isOpenProgram(future, now), false);
assert.equal(isOpenProgram(cancelled, now), false);
assert.equal(matchesDeadline(unknown, 'open', now), false, 'only explicit rolling applications match the rolling filter');
assert.equal(matchesDeadline(cancelled, '30-days', now), false);
assert.equal(matchesDeadline(future, '30-days', now), true);
assert.equal(deadlineStatus(unknown, now), 'Application status unknown');
assert.equal(deadlineStatus(cancelled, now), 'Applications closed');
assert.equal(deadlineStatus(future, now), 'Opens 1 Oct 2026');
assert.equal(deadlineStatus(programs[2], now), 'Rolling applications');
assert.equal(deadlineStatus(programs[1], now), 'Closes today');
assert.equal(deadlineUrgency(cancelled, now), 'standard', 'closed applications never display urgency');
assert.equal(deadlineUrgency(future, now), 'standard', 'applications not yet open never display urgency');
assert.equal(formatDeadline(null), 'Deadline unknown');
assert.equal(formatApplicationOpen(unknown, now), 'Opening date unknown');
assert.equal(formatApplicationOpen(programs[2], now), 'Open now', 'explicit rolling applications can be open without a date');
assert.deepEqual(
  filterItems([unknown, cancelled, future], { category: 'programs', upcomingOnly: false }).map((item) => item.id),
  ['unknown', 'cancelled', 'future'],
  'all previously published categories remain available when viewing history',
);
assert.deepEqual(
  filterItems([
    { ...unknown, tag: 'Accelerator' },
    { ...cancelled, date: '2099-12-31' },
    { ...future, date: '2099-12-31', applicationOpenDate: '2099-01-01' },
  ], { category: 'programs' }).map((item) => item.id),
  ['unknown', 'future'],
  'public discovery retains unknown and upcoming applications but excludes cancelled ones',
);
assert.equal(deadlineRunway([unknown, cancelled], now).marks.length, 0);

const openPrograms = programs.filter((item) => isOpenProgram(item, now));
const runway = deadlineRunway(openPrograms, now);
assert(runway.marks.every((mark) => mark.lane >= 0 && mark.lane < 3));
for (const lane of [0, 1, 2]) {
  const positions = runway.marks.filter((mark) => mark.lane === lane).map((mark) => mark.position);
  positions.slice(1).forEach((position, index) => {
    assert(position - positions[index] >= 17, `runway cards in lane ${lane} never overlap`);
  });
}
assert(!runway.marks.some((mark) => mark.item.id === 'rolling'), 'rolling programs have no place on the runway');
assert(runway.ticks.every((tick) => tick.position >= 6), 'month ticks keep clear of the Today label');

assert.deepEqual(
  programTypeSummaries(openPrograms).map((type) => [type.label, type.count]),
  [['Fellowships & learning programs', 1]],
);
assert.deepEqual(
  programTypeSummaries([{ ...programs[2], tag: 'Builder community' }]).map((type) => [type.key, type.label]),
  [['learning', 'Fellowships & learning programs']],
);

// Home showcase: the week, the hackathon deck and the deadline pins.
const hackathon = (id, date, extra = {}) => event(`h${id}`, date, { source: 'hackathons', ...extra });
const showcase = homeShowcase({
  events,
  hackathons: [
    hackathon(1, '2026-09-20', { imageUrl: 'past.jpg' }),
    hackathon(2, '2026-10-10'),
    hackathon(3, '2026-10-24', { imageUrl: 'b.jpg' }),
  ],
  programs,
}, now);
assert.equal(showcase.events.week.length, 7, 'the events graphic always shows seven days');
assert.equal(showcase.events.week[0].key, '2026-09-29', 'the week starts today');
assert.equal(showcase.events.weekCount, 4, 'only this week counts, past events never');
assert.equal(showcase.events.upcomingCount, 5);
assert.deepEqual(showcase.hackathons.deck.map((item) => item.id), ['h3', 'h2'], 'past hackathons drop out and ones with artwork lead');
assert(showcase.programs.marks.length <= 5 && showcase.programs.marks.every((mark) => mark.days >= 0));
assert.deepEqual(showcaseCounts(showcase), {
  events: '4 this week',
  hackathons: '2 hackathons coming up',
  programs: `${showcase.programs.count} open for applications`,
});
assert.deepEqual(showcaseCounts(homeShowcase({}, now)), { events: null, hackathons: null, programs: null }, 'no data means no count line');

console.log('Discover browsing checks passed.');
