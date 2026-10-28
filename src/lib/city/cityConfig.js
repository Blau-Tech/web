const ALL_SECTIONS = Object.freeze(['events', 'hackathons', 'programs', 'clubs']);
const CORE_SECTIONS = Object.freeze(['events', 'hackathons', 'clubs']);

export const GENERIC_CITY_CODE = 'GENERIC';
export const DEFAULT_PREVIEW_CITY_CODE = GENERIC_CITY_CODE;

export const FALLBACK_WHATSAPP_URL = 'https://chat.whatsapp.com/DC8WPpK3MA4EC1FyzXqIxt';
export const CENTRAL_LINKEDIN_URL = 'https://www.linkedin.com/company/blau-tech/';

function configuredCommunityUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return value.trim();
  } catch {
    return null;
  }
}

export function isConfiguredCommunityUrl(value) {
  return configuredCommunityUrl(value) !== null;
}

function cityWording(name) {
  return Object.freeze({
    opportunitiesTitle: `Opportunities in ${name}`,
    eventsTitle: `Events in ${name}`,
    hackathonsTitle: `Hackathons in ${name}`,
    programsTitle: `Programs in ${name}`,
    updatesTitle: `Get ${name} updates`,
    noMatchesTitle: `No matching opportunities in ${name}`,
    noMatchesDescription: `Check back soon for newly curated opportunities for ${name}.`,
  });
}

function cityConfig({
  code,
  slug,
  name,
  memberEnabled,
  whatsappUrl,
  enabledSections,
  heroWords = [],
  communityAlertDensity = 'comfortable',
}) {
  return Object.freeze({
    code,
    slug,
    name,
    memberEnabled,
    whatsappUrl: configuredCommunityUrl(whatsappUrl),
    linkedinUrl: CENTRAL_LINKEDIN_URL,
    enabledSections,
    wording: cityWording(name),
    heroWords: Object.freeze([...heroWords]),
    communityAlertDensity,
  });
}

export function hasPrograms(enabledSections = []) {
  return enabledSections.includes('programs');
}

export const CITY_CONFIG = Object.freeze({
  MUNICH: cityConfig({
    code: 'MUNICH',
    slug: 'munich',
    name: 'Munich',
    memberEnabled: true,
    whatsappUrl: 'https://chat.whatsapp.com/DC8WPpK3MA4EC1FyzXqIxt',
    enabledSections: ALL_SECTIONS,
  }),
  BERLIN: cityConfig({
    code: 'BERLIN',
    slug: 'berlin',
    name: 'Berlin',
    memberEnabled: true,
    whatsappUrl: 'https://chat.whatsapp.com/JtFNO5XxopgLiUY82YEkwx?mode=gi_t',
    enabledSections: Object.freeze(['events', 'hackathons']),
    heroWords: ['tech', 'business', 'entrepreneurship', 'robotics', 'AI', 'everything'],
    communityAlertDensity: 'compact',
  }),
  MADRID: cityConfig({
    code: 'MADRID',
    slug: 'madrid',
    name: 'Madrid',
    memberEnabled: false,
    whatsappUrl: 'https://chat.whatsapp.com/BTqaVMiKYmgLf2jgml2GiT',
    enabledSections: CORE_SECTIONS,
  }),
  AMSTERDAM: cityConfig({
    code: 'AMSTERDAM',
    slug: 'amsterdam',
    name: 'Amsterdam',
    memberEnabled: false,
    whatsappUrl: null,
    enabledSections: ALL_SECTIONS,
  }),
});

export const GENERIC_CITY_CONFIG = cityConfig({
  code: null,
  slug: '',
  name: 'Blau Tech community',
  memberEnabled: false,
  whatsappUrl: null,
  enabledSections: ALL_SECTIONS,
});

function normalizeHost(hostname) {
  return String(hostname || '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/:\d+$/, '');
}

function allowsPreviewCityOverride(hostname) {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '[::1]'
    || hostname === 'lvh.me'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.lvh.me')
    || hostname.endsWith('.vercel.app');
}

export function resolvePreviewCityCode(hostname, search = '') {
  const host = normalizeHost(hostname);

  if (allowsPreviewCityOverride(host)) {
    const requestedCity = new URLSearchParams(search).get('city')?.trim().toUpperCase();
    if (requestedCity) {
      const requestedConfig = CITY_CONFIG[requestedCity];
      return requestedConfig?.memberEnabled === true ? requestedCity : null;
    }
  }

  // Public and account pages need a stable visual fallback before a member
  // profile is available. This value never overrides a ready member profile.
  return DEFAULT_PREVIEW_CITY_CODE;
}
