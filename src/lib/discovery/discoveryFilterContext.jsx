import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DISCOVERY_FILTER_STORAGE_KEY,
  normalizeDiscoveryFilters,
  parseDiscoveryFilterSearch,
} from './discoveryFilterContract';
import {
  discoveryFiltersEqual,
  mergeDiscoveryFilterSearch,
  parseStoredDiscoveryFilters,
  readStoredDiscoveryFilters,
  resolveDiscoveryFilterState,
  writeStoredDiscoveryFilters,
} from './guestDiscoveryFilters';
import { useLocation, useNavigate } from '../router';

const DiscoveryFilterContext = createContext(null);

function browserStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function DiscoveryFilterProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [storedFilters, setStoredFilters] = useState(() => (
    readStoredDiscoveryFilters(browserStorage())
  ));
  const providerGeneratedRouteRef = useRef(null);
  const isDiscoveryRoute = location.pathname === '/discover'
    || location.pathname.startsWith('/discover/');

  const urlFilters = useMemo(
    () => (isDiscoveryRoute ? parseDiscoveryFilterSearch(location.search) : null),
    [isDiscoveryRoute, location.search],
  );
  const state = useMemo(() => resolveDiscoveryFilterState({
    urlFilters,
    storedFilters,
  }), [storedFilters, urlFilters]);

  useEffect(() => {
    if (!isDiscoveryRoute) return;

    const nextSearch = mergeDiscoveryFilterSearch(location.search, state.filters);
    if (location.search !== nextSearch) {
      providerGeneratedRouteRef.current = `${location.pathname}${nextSearch}`;
      navigate({ pathname: location.pathname, search: nextSearch }, { replace: true });
    }
  }, [isDiscoveryRoute, location.pathname, location.search, navigate, state.filters]);

  useEffect(() => {
    if (!urlFilters) return;

    const routeKey = `${location.pathname}${location.search}`;
    if (providerGeneratedRouteRef.current === routeKey) {
      providerGeneratedRouteRef.current = null;
      return;
    }

    writeStoredDiscoveryFilters(browserStorage(), urlFilters);
    setStoredFilters((current) => (
      discoveryFiltersEqual(current, urlFilters) ? current : urlFilters
    ));
  }, [location.pathname, location.search, urlFilters]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorage = (event) => {
      if (event.key !== DISCOVERY_FILTER_STORAGE_KEY) return;
      setStoredFilters(parseStoredDiscoveryFilters(event.newValue));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setFilters = useCallback((value, { replace = false, to } = {}) => {
    const filters = normalizeDiscoveryFilters(value);
    writeStoredDiscoveryFilters(browserStorage(), filters);
    setStoredFilters(filters);

    const pathname = to || (isDiscoveryRoute ? location.pathname : '/discover/programs');
    const search = mergeDiscoveryFilterSearch(location.search, filters);
    navigate({ pathname, search }, { replace });
  }, [isDiscoveryRoute, location.pathname, location.search, navigate]);

  const value = useMemo(() => Object.freeze({
    filters: state.filters,
    filterSource: state.source,
    isReady: true,
    setFilters,
  }), [setFilters, state]);

  return (
    <DiscoveryFilterContext.Provider value={value}>
      {children}
    </DiscoveryFilterContext.Provider>
  );
}

export function useDiscoveryFilters() {
  const context = useContext(DiscoveryFilterContext);
  if (!context) {
    throw new Error('useDiscoveryFilters must be used within a DiscoveryFilterProvider');
  }
  return context;
}
