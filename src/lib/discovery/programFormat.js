import { MEMBER_CITY_CONFIG } from '../member/memberPreferenceContract.js';
import { DAY_MS, startOfDay } from './dates.js';
import { parseDate, programApplicationStatus } from './discover.js';

export function formatDeadline(value, { compact = false, includeYear = true } = {}) {
  const date = parseDate(value);
  if (!date) return 'Deadline unknown';

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: compact ? 'short' : 'long',
    year: includeYear ? 'numeric' : undefined,
  });
}

export function daysUntilDeadline(value, now = new Date()) {
  const deadline = parseDate(value);
  if (!deadline) return null;
  return Math.ceil((startOfDay(deadline) - startOfDay(now)) / DAY_MS);
}

export function deadlineStatus(item, now = new Date()) {
  const status = programApplicationStatus(item, now);
  if (status === 'CLOSED') return 'Applications closed';
  if (status === 'UPCOMING') return `Opens ${formatDeadline(item.applicationOpenDate, { compact: true })}`;
  if (status === 'ROLLING') return 'Rolling applications';
  if (status === 'UNKNOWN') return 'Application status unknown';
  const days = daysUntilDeadline(item.date, now);
  if (days === 0) return 'Closes today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function deadlineUrgency(item, now = new Date()) {
  if (programApplicationStatus(item, now) !== 'OPEN') return 'standard';
  const days = daysUntilDeadline(item.date, now);
  if (days == null || days > 30) return 'standard';
  return days <= 14 ? 'urgent' : 'soon';
}

export function formatApplicationOpen(item, now = new Date()) {
  if (parseDate(item.applicationOpenDate)) {
    return formatDeadline(item.applicationOpenDate, { compact: true, includeYear: false });
  }
  const status = programApplicationStatus(item, now);
  if (status === 'OPEN' || status === 'ROLLING') return 'Open now';
  return status === 'CLOSED' ? 'Applications closed' : 'Opening date unknown';
}

export function scopeKey(item) {
  const cities = item.audienceCities || [];
  if (cities.length === 0) return 'global';
  return cities.length === 1 ? 'single-city' : 'multi-city';
}

export function scopeLabel(item) {
  const cities = item.audienceCities || [];
  if (cities.length === 0) return 'Open across cities';
  return cities
    .map((cityCode) => MEMBER_CITY_CONFIG[cityCode]?.name || cityCode)
    .join(' · ');
}
