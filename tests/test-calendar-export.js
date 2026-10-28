import assert from 'node:assert/strict';

import {
  calendarEntry,
  googleCalendarUrl,
  icsDocument,
  icsFileName,
  outlookCalendarUrl,
  zonedTime,
} from '../src/lib/discovery/calendarExport.js';
import {
  liveStatus,
  pulseItems,
  pulseWhenLabel,
  runningUntilLabel,
} from '../src/lib/discovery/liveStatus.js';

const now = new Date('2026-09-20T08:00:00Z');

// Berlin wall-clock times resolve to the right instant in summer and winter.
assert.equal(zonedTime(new Date(2026, 9, 1), { hours: 18, minutes: 0 }).toISOString(), '2026-10-01T16:00:00.000Z');
assert.equal(zonedTime(new Date(2026, 11, 1), { hours: 18, minutes: 0 }).toISOString(), '2026-12-01T17:00:00.000Z');

const event = {
  id: 'evt-1',
  source: 'events',
  category: 'events',
  title: 'Voice AI; Friction, Flow',
  organizer: 'Wispr Flow',
  location: 'Werk1, München',
  date: '2026-10-01',
  time: '18:00:00',
  endTime: '20:30:00',
  link: 'https://events-a.example/example',
};

const timed = calendarEntry(event, now);
assert.equal(timed.allDay, false);
assert.equal(timed.start.toISOString(), '2026-10-01T16:00:00.000Z');
assert.equal(timed.end.toISOString(), '2026-10-01T18:30:00.000Z');
assert.match(timed.details, /Original listing: https:\/\/events-a\.example\/example/);
assert.match(timed.details, /blau-tech\.de\/discover\/events\/evt-1\//);

// No end time: a two-hour slot. An end before the start runs past midnight.
assert.equal(calendarEntry({ ...event, endTime: null }, now).end.toISOString(), '2026-10-01T18:00:00.000Z');
assert.equal(calendarEntry({ ...event, endTime: '01:00' }, now).end.toISOString(), '2026-10-01T23:00:00.000Z');

// No start time: all-day, covering multi-day runs through the last day.
const untimed = calendarEntry({ ...event, time: null, endDate: '2026-10-03' }, now);
assert.equal(untimed.allDay, true);
assert.equal(untimed.end.getDate(), 4);

// Program deadlines become all-day reminders with an alarm, never a location.
const program = calendarEntry({
  id: 'prog-1',
  source: 'opportunities',
  category: 'programs',
  title: 'Founder Fellowship',
  date: '2026-10-15',
  time: '12:00',
  location: 'Berlin',
}, now);
assert.equal(program.title, 'Apply: Founder Fellowship');
assert.equal(program.allDay, true);
assert.equal(program.location, '');
assert.equal(program.reminderDays, 3);

assert.equal(calendarEntry({ ...event, date: null }, now), null);

const google = new URL(googleCalendarUrl(timed));
assert.equal(google.searchParams.get('dates'), '20261001T160000Z/20261001T183000Z');
assert.equal(google.searchParams.get('location'), 'Werk1, München');
assert.equal(new URL(googleCalendarUrl(program)).searchParams.get('dates'), '20261015/20261016');

const outlook = new URL(outlookCalendarUrl(program));
assert.equal(outlook.searchParams.get('allday'), 'true');
assert.equal(outlook.searchParams.get('startdt'), '2026-10-15');

const ics = icsDocument([timed, program]);
assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
assert.ok(ics.endsWith('END:VCALENDAR\r\n'));
assert.match(ics, /DTSTART:20261001T160000Z/);
assert.match(ics, /SUMMARY:Voice AI\\; Friction\\, Flow/);
assert.match(ics, /DTSTART;VALUE=DATE:20261015/);
assert.match(ics, /TRIGGER:-P3D/);
for (const line of ics.split('\r\n')) {
  assert.ok(new TextEncoder().encode(line).length <= 75, `Line longer than 75 octets: ${line}`);
}
assert.equal(icsFileName(event), 'voice-ai-friction-flow.ics');

// Live status is read against the visitor's clock.
const at = (hours, minutes = 0) => new Date(2026, 9, 1, hours, minutes);
assert.equal(liveStatus(event, at(9)), 'tonight');
assert.equal(liveStatus(event, at(12)), 'tonight');
assert.equal(liveStatus(event, at(17)), 'soon');
assert.equal(liveStatus(event, at(19)), 'live');
assert.equal(liveStatus(event, at(21)), null);
assert.equal(liveStatus({ ...event, time: '10:00', endTime: '11:00' }, at(8)), 'today');
assert.equal(liveStatus(event, new Date(2026, 8, 30, 12)), null);

const conference = { ...event, id: 'conf', date: '2026-09-29', time: null, endTime: null, endDate: '2026-10-02' };
assert.equal(liveStatus(conference, at(9)), 'live');

const pulse = pulseItems([
  { ...event, id: 'later', date: '2026-10-06' },
  { ...event, id: 'too-far', date: '2026-10-09' },
  { ...event, id: 'past', date: '2026-09-28', endDate: null },
  conference,
  event,
], at(9));
assert.deepEqual(pulse.map((item) => item.id), ['conf', 'evt-1', 'later']);

assert.equal(pulseWhenLabel(conference, at(9)), 'Live now');
assert.equal(pulseWhenLabel(event, at(12)), 'Tonight · 18:00');
assert.equal(pulseWhenLabel({ ...event, date: '2026-10-02' }, at(12)), 'Tomorrow · 18:00');
assert.equal(pulseWhenLabel({ ...event, date: '2026-10-05' }, at(12)), 'Mon 5 Oct · 18:00');

assert.equal(runningUntilLabel(conference, at(9)), 'Until Fri 2 Oct');
assert.equal(runningUntilLabel(conference, new Date(2026, 9, 2, 9)), 'Ends today');
assert.equal(runningUntilLabel(event, at(9)), null);

console.log('calendar export and live status tests passed');
