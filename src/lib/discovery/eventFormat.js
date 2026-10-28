import { parseDate } from './discover';

export const EVENT_TOPICS = Object.freeze([
  { key: 'all', label: 'All interests', shortLabel: 'Community event', keywords: [] },
  { key: 'ai-tech', label: 'AI & tech', shortLabel: 'AI & tech', keywords: ['ai', 'artificial intelligence', 'machine learning', 'developer', 'software', 'tech', 'data', 'digital', 'seo', 'ux'] },
  { key: 'founders', label: 'Founders & startups', shortLabel: 'Founders', keywords: ['founder', 'startup', 'venture', 'entrepreneur', 'pitch', 'investor', 'innovation', 'business'] },
  { key: 'networking', label: 'Networking', shortLabel: 'Networking', keywords: ['network', 'meetup', 'community', 'club', 'social', 'breakfast', 'apéro', 'lounge', 'walk & talk'] },
  { key: 'learning', label: 'Workshops & learning', shortLabel: 'Workshop', keywords: ['workshop', 'school', 'training', 'course', 'mentoring', 'masterclass', 'bootcamp', 'seminar'] },
  { key: 'conferences', label: 'Conferences & expos', shortLabel: 'Conference', keywords: ['conference', 'summit', 'festival', 'expo', 'fair', 'congress', 'forum'] },
]);

export function eventDate(item) {
  return parseDate(item.date);
}

export function eventSearchText(item) {
  return [
    item.title,
    item.description,
    item.organizer,
    item.location,
    item.format,
    item.tag,
  ].filter(Boolean).join(' ').toLocaleLowerCase('en');
}

export function eventMatchesTopic(item, topic) {
  if (!topic || topic.key === 'all') return true;
  const searchableText = eventSearchText(item);
  return topic.keywords.some((keyword) => searchableText.includes(keyword));
}

export function eventTopicLabel(item) {
  return EVENT_TOPICS.find((topic) => topic.key !== 'all' && eventMatchesTopic(item, topic))?.shortLabel
    || 'Community event';
}

export function formatEventDate(value, options = {}) {
  const date = parseDate(value);
  if (!date) return 'Date to be announced';

  return date.toLocaleDateString('en-GB', {
    weekday: options.compact ? 'short' : 'long',
    day: 'numeric',
    month: options.compact ? 'short' : 'long',
    year: options.compact ? undefined : 'numeric',
  });
}

export function formatEventTime(value) {
  return value ? String(value).slice(0, 5) : 'Time TBA';
}

export function eventLocation(item) {
  if (item.location) return item.location;
  return String(item.format || '').toUpperCase() === 'ONLINE' ? 'Online' : 'Location TBA';
}

export function opportunityTypeLabel(item) {
  return item.category === 'hackathons' ? 'Hackathon' : 'Event';
}
