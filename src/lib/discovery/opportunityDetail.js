import { normalizeEvent, normalizeOpportunity, parseDate } from './discover.js';
import { MEMBER_CITY_CONFIG, OPPORTUNITY_TYPE_CONFIG } from '../member/memberPreferenceContract.js';

const SITE_ORIGIN = 'https://www.blau-tech.de';
const SUPPORTED_KINDS = new Set(['events', 'hackathons', 'programs']);

export function normalizeOpportunityKind(value) {
  const kind = String(value || '').trim().toLowerCase();
  return SUPPORTED_KINDS.has(kind) ? kind : null;
}

export function slugifyOpportunityTitle(value) {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

  return slug || 'opportunity';
}

export function opportunityDetailPath(item, search = '') {
  const kind = normalizeOpportunityKind(item?.category);
  if (!kind || !item?.id) return '/discover/programs?types=programs';
  const suffix = search && String(search).startsWith('?') ? search : '';
  return `/discover/${kind}/${encodeURIComponent(item.id)}/${slugifyOpportunityTitle(item.title)}${suffix}`;
}

export function opportunityListPath(kind, search = '') {
  const normalizedKind = normalizeOpportunityKind(kind) || 'programs';
  const params = new URLSearchParams(search && String(search).startsWith('?') ? search.slice(1) : search);
  params.set('types', normalizedKind);
  const query = params.toString();
  return `/discover/${normalizedKind}${query ? `?${query}` : ''}`;
}

export function opportunityCanonicalUrl(item) {
  return `${SITE_ORIGIN}${opportunityDetailPath(item).split('?')[0]}`;
}

export async function fetchPublishedOpportunity(client, kindValue, id) {
  const kind = normalizeOpportunityKind(kindValue);
  const config = kind ? OPPORTUNITY_TYPE_CONFIG[kind] : null;
  if (!client?.from || !config || !id) return { item: null, error: null };

  let query = client
    .from(config.table)
    .select('*')
    .eq('id', id)
    .eq(config.publicationFilter.column, config.publicationFilter.value);

  if (config.discriminator) {
    query = query.eq(config.discriminator.column, config.discriminator.value);
  }

  const { data, error } = await query.maybeSingle();
  if (error) return { item: null, error };
  if (!data) return { item: null, error: null };

  const item = config.normalizer === 'normalizeEvent'
    ? normalizeEvent(data, config.normalizerCategory)
    : normalizeOpportunity(data);

  return { item, error: null };
}

export function formatOpportunityDate(value, { includeWeekday = true } = {}) {
  const date = parseDate(value);
  if (!date) return 'To be announced';
  return date.toLocaleDateString('en-GB', {
    weekday: includeWeekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatProgramRun(item) {
  const start = item?.programStartDate
    ? formatOpportunityDate(item.programStartDate, { includeWeekday: false })
    : null;
  const end = item?.programEndDate
    ? formatOpportunityDate(item.programEndDate, { includeWeekday: false })
    : null;

  if (start && end) return `${start} – ${end}`;
  if (end) return `Until ${end}`;
  return start;
}

export function formatOpportunityTime(value) {
  if (!value) return 'To be announced';
  return String(value).slice(0, 5);
}

export function formatOpportunityFormat(value) {
  if (!value) return null;
  return String(value)
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function opportunityScope(item) {
  if (item.category !== 'programs') {
    return MEMBER_CITY_CONFIG[item.city]?.name || item.city || null;
  }

  const cities = item.audienceCities || [];
  if (cities.length === 0) return 'Open across cities';
  return cities.map((cityCode) => MEMBER_CITY_CONFIG[cityCode]?.name || cityCode).join(' and ');
}

export function opportunityKey(item) {
  return `${item?.source}:${item?.id}`;
}
