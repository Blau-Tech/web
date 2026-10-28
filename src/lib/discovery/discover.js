function localDate(year, month, day) {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value);
  }

  const text = String(value).trim();
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) return localDate(Number(match[1]), Number(match[2]), Number(match[3]));

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return localDate(Number(match[3]), Number(match[2]), Number(match[1]));

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function canonicalCategory(value) {
  const category = String(value || '').toLowerCase();
  if (category === 'hackathon' || category === 'hackathons') return 'hackathons';
  if (category === 'program' || category === 'programs') return 'programs';
  return 'events';
}

function canonicalFormat(value) {
  return value ? String(value).trim().toUpperCase().replace(/[\s-]+/g, '_') : null;
}

function baseItem(row, values) {
  return {
    id: row.id,
    description: row.description || null,
    location: row.location || null,
    format: canonicalFormat(row.format),
    time: row.start_time || row.time || null,
    endTime: row.end_time || null,
    endDate: row.end_date || null,
    isHighlight: row.is_highlight ?? row.highlight ?? false,
    createdAt: row.created_at || row.createdAt || null,
    ...values,
  };
}

export function normalizeEvent(row, category) {
  const resolvedCategory = canonicalCategory(category || row.event_type);
  const isHackathon = resolvedCategory === 'hackathons';

  return baseItem(row, {
    source: 'events',
    category: resolvedCategory,
    city: row.city || null,
    tag: isHackathon ? 'Hackathon' : 'Event',
    title: row.name || null,
    organizer: row.organisers || row.organizer || null,
    link: row.link || null,
    date: row.start_date || row.date || null,
    signupDeadline: row.signup_deadline || null,
    prizes: row.prizes || null,
    imageUrl: row.image_url || null,
  });
}

export const PROGRAM_SUBTYPE_LABELS = Object.freeze({
  PROGRAM: 'Program',
  FELLOWSHIP: 'Fellowship',
  ACCELERATOR: 'Accelerator',
  INCUBATOR: 'Incubator',
  RESIDENCY: 'Residency',
  COMMUNITY: 'Builder community',
  STUDENT_PROGRAM: 'Student program',
  CAREER_DEVELOPMENT: 'Career development',
  FOUNDER_PROGRAM: 'Founder program',
  STARTUP_FUNDING: 'Startup funding',
  OTHER: 'Program',
});

export function programSubtypeLabel(value) {
  const subtype = String(value || '').trim().toUpperCase();
  return PROGRAM_SUBTYPE_LABELS[subtype] || null;
}

export function normalizeOpportunity(row) {
  const isFellowship = row.opportunity_type === 'FELLOWSHIP';
  const subtype = row.program_subtype || null;

  return baseItem(row, {
    source: 'opportunities',
    category: 'programs',
    tag: programSubtypeLabel(subtype) || (isFellowship ? 'Fellowship' : 'Program'),
    programType: isFellowship ? 'fellowship' : 'program',
    programSubtype: subtype,
    title: row.title || null,
    organizer: row.organisation || row.organizer || null,
    link: row.url || row.link || null,
    date: row.deadline || row.date || null,
    applicationStatus: row.application_status || 'UNKNOWN',
    applicationOpenDate: row.application_open_date || row.application_opens_at || null,
    programStartDate: row.program_start_date || null,
    programEndDate: row.program_end_date || null,
    locationScope: row.location_scope || null,
    eligibilityNotes: row.eligibility_notes || null,
    benefits: row.benefits || null,
    imageUrl: row.image_url || null,
    audienceCities: Array.isArray(row.cities) ? row.cities : [],
    opportunityType: row.opportunity_type || null,
  });
}

function atMidnight(value) {
  const date = parseDate(value);
  if (!date) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

export function programApplicationStatus(item, now = new Date()) {
  const status = item.applicationStatus || 'UNKNOWN';
  const today = atMidnight(now);
  const deadline = atMidnight(item.date);
  const opens = atMidnight(item.applicationOpenDate);

  if (status === 'CLOSED' || (deadline && deadline < today)) return 'CLOSED';
  if (opens && opens > today) return 'UPCOMING';
  if (status === 'ROLLING') return 'ROLLING';
  if (deadline && (status === 'OPEN' || (status === 'UPCOMING' && opens))) return 'OPEN';
  return 'UNKNOWN';
}

export function isUpcoming(item, now = new Date()) {
  if (item.category === 'programs') return programApplicationStatus(item, now) !== 'CLOSED';
  const comparisonDate = atMidnight(item.endDate || item.date);
  if (!comparisonDate) return true;
  return comparisonDate >= atMidnight(now);
}

export function compareByDate(a, b) {
  const aDate = parseDate(a.date);
  const bDate = parseDate(b.date);
  if (!aDate && !bDate) return (a.title || '').localeCompare(b.title || '');
  if (!aDate) return 1;
  if (!bDate) return -1;
  return aDate - bDate || (a.time || '').localeCompare(b.time || '');
}

export function sortByDate(items) {
  return [...items].sort(compareByDate);
}

export function filterItems(items, filters = {}) {
  const {
    category = 'all',
    upcomingOnly = true,
  } = filters;
  const selectedCategory = String(category).toLowerCase();

  return items.filter(item => {
    if (upcomingOnly && !isUpcoming(item)) return false;
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    return true;
  });
}
