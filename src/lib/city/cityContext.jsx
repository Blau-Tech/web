import { createContext, useContext, useEffect } from 'react';
import {
  CITY_CONFIG,
  GENERIC_CITY_CODE,
  GENERIC_CITY_CONFIG,
  resolvePreviewCityCode,
} from './cityConfig';
import { useDiscoveryFilters } from '../discovery/discoveryFilterContext';

const CityContext = createContext(null);
const EMPTY_LIST = Object.freeze([]);
const EMPTY_HERO = Object.freeze({});

export function CityProvider({ children }) {
  const { filters: discoveryFilters } = useDiscoveryFilters();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const previewCityCode = resolvePreviewCityCode(hostname, search);
  const resolvedCityCode = previewCityCode || null;
  const isGeneric = resolvedCityCode === GENERIC_CITY_CODE;
  const cityCode = isGeneric ? null : resolvedCityCode;
  const city = isGeneric ? GENERIC_CITY_CONFIG : CITY_CONFIG[cityCode] || null;

  useEffect(() => {
    if (!city) return;
    const title = isGeneric
      ? 'Blau Tech — Events, Hackathons & Programs'
      : `Blau Tech — Events, Hackathons & Programs in ${city.name}`;
    document.title = title;
    document.querySelector('meta[name="title"]')?.setAttribute('content', title);
  }, [city, isGeneric]);

  if (!city) {
    return (
      <main className="min-h-screen bg-brand-ground px-6 text-white grid place-items-center">
        <div role="alert" className="max-w-lg text-center">
          <h1 className="text-3xl font-semibold">Unsupported preview city</h1>
          <p className="mt-4 text-white/75">
            This BlauTech member experience currently supports Berlin and Munich.
          </p>
        </div>
      </main>
    );
  }

  const value = {
    city,
    cityCode,
    citySource: isGeneric ? 'generic' : 'preview',
    isGeneric,
    slug: city.slug,
    universities: EMPTY_LIST,
    hero: EMPTY_HERO,
    enabledSections: city.enabledSections,
    selectedDiscoveryCityCodes: discoveryFilters.cities,
    selectedOpportunityTypes: discoveryFilters.opportunityTypes,
  };

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within a CityProvider');
  return ctx;
}

export function matchUniversity(universities, freeText) {
  if (!freeText) return null;
  const normalized = String(freeText).toLowerCase().trim();
  for (const uni of universities) {
    if (normalized.includes(uni.name.toLowerCase())) return uni;
    if (uni.short_name && normalized.includes(uni.short_name.toLowerCase())) return uni;
    for (const alias of uni.aliases || []) {
      if (alias && normalized.includes(alias.toLowerCase())) return uni;
    }
  }
  return null;
}
