import { CITY_CONFIG } from '../city/cityConfig.js';

export const MEMBER_PREFERENCE_SCHEMA_VERSION = 1;

export const MEMBER_CITY_CODES = Object.freeze(['BERLIN', 'MUNICH']);

export const OPPORTUNITY_TYPE_CODES = Object.freeze([
  'events',
  'hackathons',
  'programs',
]);

export const MEMBER_CITY_CONFIG = Object.freeze(
  Object.fromEntries(
    MEMBER_CITY_CODES.map((cityCode) => {
      const city = CITY_CONFIG[cityCode];

      return [cityCode, Object.freeze({
        code: city.code,
        slug: city.slug,
        name: city.name,
        enabled: city.memberEnabled === true,
        contentQueryValue: city.code,
        whatsappUrl: city.whatsappUrl,
        linkedinUrl: city.linkedinUrl,
        wording: city.wording,
      })];
    }),
  ),
);

const PUBLISHED_FILTER = Object.freeze({
  column: 'is_published',
  value: true,
});

const SCALAR_CITY_SCOPE = Object.freeze({
  column: 'city',
  storage: 'nullable-scalar',
  globalValue: null,
});

const ARRAY_CITY_SCOPE = Object.freeze({
  column: 'cities',
  storage: 'array',
  globalValue: Object.freeze([]),
});

function opportunityType(config) {
  return Object.freeze({
    publicationFilter: PUBLISHED_FILTER,
    ...config,
    discriminator: config.discriminator
      ? Object.freeze(config.discriminator)
      : null,
    order: Object.freeze(config.order),
  });
}

export const OPPORTUNITY_TYPE_CONFIG = Object.freeze({
  events: opportunityType({
    code: 'events',
    label: 'Events',
    table: 'events',
    discriminator: { column: 'event_type', value: 'EVENT' },
    cityScope: SCALAR_CITY_SCOPE,
    order: { column: 'start_date', ascending: true },
    normalizer: 'normalizeEvent',
    normalizerCategory: 'events',
  }),
  hackathons: opportunityType({
    code: 'hackathons',
    label: 'Hackathons',
    table: 'events',
    discriminator: { column: 'event_type', value: 'HACKATHON' },
    cityScope: SCALAR_CITY_SCOPE,
    order: { column: 'start_date', ascending: true },
    normalizer: 'normalizeEvent',
    normalizerCategory: 'hackathons',
  }),
  programs: opportunityType({
    code: 'programs',
    label: 'Programs',
    table: 'opportunities',
    discriminator: { column: 'opportunity_type', value: 'PROGRAM' },
    cityScope: ARRAY_CITY_SCOPE,
    order: { column: 'deadline', ascending: true, nullsFirst: false },
    normalizer: 'normalizeOpportunity',
    normalizerCategory: null,
  }),
});

export function normalizeMemberCityCode(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Member city must be a string.');
  }

  const cityCode = value.trim().toUpperCase();
  if (
    !Object.hasOwn(MEMBER_CITY_CONFIG, cityCode)
    || MEMBER_CITY_CONFIG[cityCode].enabled !== true
  ) {
    throw new RangeError(`Unsupported member city: ${value}`);
  }

  return cityCode;
}

export function normalizeOpportunityTypeCode(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Opportunity type must be a string.');
  }

  const typeCode = value.trim().toLowerCase();
  if (!Object.hasOwn(OPPORTUNITY_TYPE_CONFIG, typeCode)) {
    throw new RangeError(`Unsupported opportunity type: ${value}`);
  }

  return typeCode;
}

export function normalizeOpportunityTypes(values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Opportunity types must be an array.');
  }

  if (values.length === 0) {
    throw new RangeError('Choose at least one opportunity type.');
  }

  const selectedTypes = new Set(Array.from(values, normalizeOpportunityTypeCode));
  return Object.freeze(
    OPPORTUNITY_TYPE_CODES.filter((typeCode) => selectedTypes.has(typeCode)),
  );
}

export function normalizeMemberPreferences(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Member preferences must be an object.');
  }

  if (
    value.schemaVersion !== undefined
    && value.schemaVersion !== MEMBER_PREFERENCE_SCHEMA_VERSION
  ) {
    throw new RangeError(`Unsupported preference schema version: ${value.schemaVersion}`);
  }

  return Object.freeze({
    schemaVersion: MEMBER_PREFERENCE_SCHEMA_VERSION,
    cityCode: normalizeMemberCityCode(value.cityCode),
    opportunityTypes: normalizeOpportunityTypes(value.opportunityTypes),
  });
}

export function isValidMemberPreferences(value) {
  try {
    normalizeMemberPreferences(value);
    return true;
  } catch {
    return false;
  }
}

function cityOrFilter(cityScope, cityCode) {
  if (cityScope.storage === 'nullable-scalar') {
    return `${cityScope.column}.eq.${cityCode},${cityScope.column}.is.null`;
  }

  return `${cityScope.column}.eq.{},${cityScope.column}.cs.{${cityCode}}`;
}

export function buildOpportunityQueryPlan(cityValue, opportunityTypeValue) {
  const cityCode = normalizeMemberCityCode(cityValue);
  const opportunityTypeCode = normalizeOpportunityTypeCode(opportunityTypeValue);
  const config = OPPORTUNITY_TYPE_CONFIG[opportunityTypeCode];
  const equalFilters = [config.publicationFilter];

  if (config.discriminator) equalFilters.push(config.discriminator);

  return Object.freeze({
    cityCode,
    opportunityType: opportunityTypeCode,
    table: config.table,
    equalFilters: Object.freeze(equalFilters),
    orFilter: cityOrFilter(config.cityScope, cityCode),
    order: config.order,
    normalizer: config.normalizer,
    normalizerCategory: config.normalizerCategory,
  });
}
