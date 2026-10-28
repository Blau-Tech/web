import { forwardRef } from 'react';
import {
  Link as WouterLink,
  Redirect as WouterRedirect,
  Router,
  useLocation as useWouterLocation,
  useSearch,
} from 'wouter';

function normalizeSearch(search = '') {
  if (!search) return '';
  return search.startsWith('?') ? search : `?${search}`;
}

function resolveDestination(to) {
  if (typeof to === 'string') return to;

  const pathname = to?.pathname || window.location.pathname;
  return `${pathname}${normalizeSearch(to?.search)}`;
}

export { Router };

export const Link = forwardRef(function Link({ to, href, ...props }, ref) {
  return <WouterLink ref={ref} href={resolveDestination(to ?? href)} {...props} />;
});

export const NavLink = forwardRef(function NavLink({ to, href, className, ...props }, ref) {
  const location = useLocation();
  const destination = resolveDestination(to ?? href);
  const destinationPath = destination.split('?')[0];
  const isActive = location.pathname === destinationPath;
  const resolvedClassName = typeof className === 'function'
    ? className({ isActive })
    : className;

  return (
    <Link
      ref={ref}
      to={destination}
      className={resolvedClassName}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    />
  );
});

export function useLocation() {
  const [pathname] = useWouterLocation();
  const search = useSearch();

  return {
    pathname,
    search: normalizeSearch(search),
  };
}

export function useNavigate() {
  const [, navigate] = useWouterLocation();

  return (to, options = {}) => {
    navigate(resolveDestination(to), { replace: options.replace === true });
  };
}

export function Navigate({ to, replace = true }) {
  return <WouterRedirect to={resolveDestination(to)} replace={replace} />;
}
