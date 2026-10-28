// Explicit extensions and base modules only, so Node tests can import this file.
// Turns a listing into a calendar entry: Google and Outlook links, plus an
// .ics file that Apple Calendar, Outlook desktop and most other apps open.
import { parseDate } from './discover.js';
import { opportunityCanonicalUrl, slugifyOpportunityTitle } from './opportunityDetail.js';

// Listings store Berlin and Munich wall-clock times.
export const LISTING_TIME_ZONE = 'Europe/Berlin';
export const DEFAULT_EVENT_HOURS = 2;
export const DEADLINE_REMINDER_DAYS = 3;

const HOUR_MS = 60 * 60 * 1000;
const PRODUCT_ID = '-//Blau Tech//Listings//EN';

function parseClock(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? { hours, minutes } : null;
}

function zoneOffsetMs(instant, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(instant).map(({ type, value }) => [type, Number(value)]),
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - instant.getTime();
}

/** The real instant of a wall-clock time in a time zone, daylight saving included. */
export function zonedTime(date, clock, timeZone = LISTING_TIME_ZONE) {
  const wallClock = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), clock.hours, clock.minutes);
  const firstGuess = wallClock - zoneOffsetMs(new Date(wallClock), timeZone);
  return new Date(wallClock - zoneOffsetMs(new Date(firstGuess), timeZone));
}

const pad = (value) => String(value).padStart(2, '0');
const dateStamp = (date) => `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
const utcStamp = (instant) => instant.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const nextDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

function listingPlace(item) {
  if (item.location) return item.location;
  return String(item.format || '').toUpperCase() === 'ONLINE' ? 'Online' : '';
}

/**
 * The calendar shape of a listing, or null when it has no usable date.
 * Events keep their times; program deadlines become all-day reminders.
 */
export function calendarEntry(item, now = new Date()) {
  const startDate = parseDate(item?.date);
  if (!startDate) return null;

  const isProgram = item.category === 'programs';
  const pageUrl = item.id ? opportunityCanonicalUrl(item) : null;
  const details = [
    isProgram ? `Application deadline for ${item.title}.` : null,
    item.organizer ? `Presented by ${item.organizer}.` : null,
    item.link ? `Original listing: ${item.link}` : null,
    pageUrl ? `On Blau Tech: ${pageUrl}` : null,
  ].filter(Boolean).join('\n');

  const base = {
    uid: `${item.source || item.category}-${item.id}@blau-tech.de`,
    title: isProgram ? `Apply: ${item.title}` : item.title,
    location: isProgram ? '' : listingPlace(item),
    details,
    url: pageUrl || item.link || '',
    reminderDays: isProgram ? DEADLINE_REMINDER_DAYS : null,
    createdAt: now,
  };

  const startClock = isProgram ? null : parseClock(item.time);
  if (!startClock) {
    const lastDay = (!isProgram && parseDate(item.endDate)) || startDate;
    return {
      ...base,
      allDay: true,
      start: startDate,
      // All-day ends are exclusive, so the entry covers the last day in full.
      end: nextDay(lastDay >= startDate ? lastDay : startDate),
    };
  }

  const start = zonedTime(startDate, startClock);
  const endClock = parseClock(item.endTime);
  const endDate = parseDate(item.endDate) || startDate;
  let end = endClock ? zonedTime(endDate, endClock) : null;
  // An end before the start means it runs past midnight.
  if (end && end <= start) end = new Date(end.getTime() + 24 * HOUR_MS);
  if (!end) end = new Date(start.getTime() + DEFAULT_EVENT_HOURS * HOUR_MS);

  return { ...base, allDay: false, start, end };
}

export function googleCalendarUrl(entry) {
  const dates = entry.allDay
    ? `${dateStamp(entry.start)}/${dateStamp(entry.end)}`
    : `${utcStamp(entry.start)}/${utcStamp(entry.end)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: entry.title,
    dates,
    details: entry.details,
  });
  if (entry.location) params.set('location', entry.location);
  if (!entry.allDay) params.set('ctz', LISTING_TIME_ZONE);
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function outlookCalendarUrl(entry) {
  const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: entry.title,
    body: entry.details,
    startdt: entry.allDay ? isoDate(entry.start) : entry.start.toISOString(),
    enddt: entry.allDay ? isoDate(entry.end) : entry.end.toISOString(),
    allday: String(entry.allDay),
  });
  if (entry.location) params.set('location', entry.location);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}

function escapeText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** RFC 5545 folds lines longer than 75 octets; continuation lines start with a space. */
function foldLine(line) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const chunks = [];
  let chunk = '';
  let chunkBytes = 0;
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    const limit = chunks.length === 0 ? 75 : 74;
    if (chunkBytes + bytes > limit) {
      chunks.push(chunk);
      chunk = '';
      chunkBytes = 0;
    }
    chunk += character;
    chunkBytes += bytes;
  }
  chunks.push(chunk);
  return chunks.join('\r\n ');
}

function eventLines(entry) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${entry.uid}`,
    `DTSTAMP:${utcStamp(entry.createdAt)}`,
    entry.allDay ? `DTSTART;VALUE=DATE:${dateStamp(entry.start)}` : `DTSTART:${utcStamp(entry.start)}`,
    entry.allDay ? `DTEND;VALUE=DATE:${dateStamp(entry.end)}` : `DTEND:${utcStamp(entry.end)}`,
    `SUMMARY:${escapeText(entry.title)}`,
  ];
  if (entry.details) lines.push(`DESCRIPTION:${escapeText(entry.details)}`);
  if (entry.location) lines.push(`LOCATION:${escapeText(entry.location)}`);
  if (entry.url) lines.push(`URL:${entry.url}`);
  if (entry.reminderDays) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(entry.title)}`,
      `TRIGGER:-P${entry.reminderDays}D`,
      'END:VALARM',
    );
  }
  lines.push('END:VEVENT');
  return lines;
}

export function icsDocument(entries) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODUCT_ID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...entries.flatMap(eventLines),
    'END:VCALENDAR',
  ];
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

export function icsFileName(item) {
  return `${slugifyOpportunityTitle(item?.title)}.ics`;
}
