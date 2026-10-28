import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from '../../lib/router';
import BrandLink from '../common/BrandLink';
import NavFlyoutArtwork from './NavFlyoutArtwork';

const SITE_ORIGIN = 'https://www.blau-tech.de';
const DEFAULT_PAGE_METADATA = Object.freeze({
  title: 'Blau Tech — Find Your People in Tech',
  description: 'Discover curated tech events, hackathons, and programs in Berlin and Munich, and connect with the communities behind them.',
});
const PUBLIC_PAGE_METADATA = Object.freeze({
  '/': DEFAULT_PAGE_METADATA,
  '/discover/events': Object.freeze({
    title: 'Tech Events in Berlin & Munich — Blau Tech',
    description: 'Find curated meetups, workshops, and community events worth making time for in Berlin and Munich.',
  }),
  '/discover/hackathons': Object.freeze({
    title: 'Hackathons in Berlin & Munich — Blau Tech',
    description: 'Discover upcoming hackathons and innovation challenges from trusted communities in Berlin and Munich.',
  }),
  '/discover/programs': Object.freeze({
    title: 'Tech Programs & Fellowships — Blau Tech',
    description: 'Explore curated fellowships, accelerators, residencies, and career programs for builders and founders.',
  }),
  '/partners': Object.freeze({
    title: 'Partner With Blau Tech — Reach Local Tech Communities',
    description: 'Work with Blau Tech to reach and support students, developers, founders, and organisers across Berlin and Munich.',
  }),
  '/privacy': Object.freeze({
    title: 'Privacy Policy — Blau Tech',
    description: 'How Blau Tech handles your data: what we collect, who processes it, how long we keep it, and your rights.',
  }),
});

function normalizedPathname(pathname) {
  const normalized = `/${String(pathname || '').replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' ? '/' : normalized;
}

function updateDocumentMetadata(pathname) {
  const normalizedPath = normalizedPathname(pathname);
  const metadata = PUBLIC_PAGE_METADATA[normalizedPath] || {
    title: 'Blau Tech',
    description: DEFAULT_PAGE_METADATA.description,
    noIndex: true,
  };
  const canonicalUrl = `${SITE_ORIGIN}${normalizedPath === '/' ? '/' : normalizedPath}`;
  const setMetaContent = (selector, content) => {
    document.head.querySelector(selector)?.setAttribute('content', content);
  };

  document.title = metadata.title;
  document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
  setMetaContent('meta[name="title"]', metadata.title);
  setMetaContent('meta[name="description"]', metadata.description);
  setMetaContent(
    'meta[name="robots"]',
    metadata.noIndex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
  );
  setMetaContent('meta[property="og:url"]', canonicalUrl);
  setMetaContent('meta[property="og:title"]', metadata.title);
  setMetaContent('meta[property="og:description"]', metadata.description);
  setMetaContent('meta[name="twitter:title"]', metadata.title);
  setMetaContent('meta[name="twitter:description"]', metadata.description);
}

const PUBLIC_NAV_ITEMS = [
  { label: 'Events', href: '/discover/events', opportunityType: 'events', hasFlyout: true },
  { label: 'Programs', href: '/discover/programs', opportunityType: 'programs', hasFlyout: true },
  { label: 'For organisers', href: '/partners', hasFlyout: true },
  { label: 'Submit an event', href: '/partners#submit-event', action: 'primary' },
];
const PUBLIC_NAV_MAIN_ITEMS = PUBLIC_NAV_ITEMS.filter((item) => !item.action);
const PUBLIC_NAV_ACTION_ITEMS = PUBLIC_NAV_ITEMS.filter((item) => item.action);
const REQUEST_CITY_LINK = [
  'Request your city',
  'mailto:partner@blau-tech.de?subject=Request%20a%20city%20on%20Blau%20Tech',
];
const ORGANISER_UTILITY_LINK = [
  'Bring Blau Tech to your city',
  'mailto:partner@blau-tech.de?subject=Bring%20Blau%20Tech%20to%20my%20city',
];

const NAV_FLYOUTS = {
  Events: [
    ['Explore events', [
      ['Munich', '/discover/events?cities=munich&types=events'],
      ['Berlin', '/discover/events?cities=berlin&types=events'],
      ['All Events', '/discover/events?types=events'],
    ], REQUEST_CITY_LINK],
    ['Events', [
      ['Browse all events', '/discover/events?types=events'],
    ]],
    ['Hackathons', [
      ['Browse all hackathons', '/discover/hackathons?types=hackathons'],
    ]],
  ],
  Programs: [
    ['Explore programs', [
      ['Munich', '/discover/programs?cities=munich&types=programs'],
      ['Berlin', '/discover/programs?cities=berlin&types=programs'],
      ['All Programs', '/discover/programs?types=programs'],
    ], REQUEST_CITY_LINK],
    ['For individuals', [
      ['Fellowships & learning programs', '/discover/programs?types=programs&programType=LEARNING'],
      ['Residencies & hacker houses', '/discover/programs?types=programs&programType=RESIDENCY'],
    ]],
  ],
  'For organisers': [
    ['Work with Blau Tech', [
      ['For organisers', '/partners'],
      ['Submit an opportunity', '/partners#submit-event'],
    ], ORGANISER_UTILITY_LINK],
    ['Why organise with us', [
      ['Where your event goes', '/partners#why-organize'],
      ['Who you reach', '/partners#audience'],
      ['Co-host or partner', '/partners#work-with-us'],
    ]],
    ['Contact', [
      ['Partner with us', '/partners#partner-with-us'],
      ['Email Blau Tech', 'mailto:partner@blau-tech.de'],
    ]],
  ],
};

function publicNavHref(item, locationSearch) {
  if (!item.opportunityType) return item.href;

  const params = new URLSearchParams(locationSearch);
  params.set('types', item.opportunityType);
  const search = params.toString();
  return search ? `${item.href}?${search}` : item.href;
}

function PublicNavDestination({ href, children, ...props }) {
  if (/^(?:https?:|mailto:)/.test(href) || href.includes('#')) {
    return <a href={href} {...props}>{children}</a>;
  }

  return <Link to={href} {...props}>{children}</Link>;
}

function BlauGlobalNavigation({ isOpen, onToggle, onClose, locationSearch, navRef }) {
  const [activeFlyout, setActiveFlyout] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const flyoutGroups = activeFlyout ? NAV_FLYOUTS[activeFlyout] : null;

  // Over a full-bleed photo hero the bar starts transparent; once the page
  // moves it switches to the frosted bar so it stays legible over content.
  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 8);
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
    return () => window.removeEventListener('scroll', updateScrolled);
  }, []);

  useEffect(() => {
    if (!activeFlyout && !isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setActiveFlyout(null);
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeFlyout, isOpen, onClose]);

  const closeFlyout = () => setActiveFlyout(null);
  const handleHeaderBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) closeFlyout();
  };

  return (
    <>
      <header
        ref={navRef}
        className={`apple-global-nav${isOpen ? ' apple-global-nav--open' : ''}${activeFlyout ? ' apple-global-nav--flyout-open' : ''}${isScrolled ? ' apple-global-nav--scrolled' : ''}`}
        onMouseLeave={closeFlyout}
        onBlur={handleHeaderBlur}
      >
        <nav className="apple-global-nav__content" aria-label="Primary navigation">
          <div className="apple-global-nav__list">
            <div className="apple-global-nav__brand" onMouseEnter={closeFlyout}>
              <BrandLink to={{ pathname: '/', search: locationSearch }} />
            </div>
            <ul className="apple-global-nav__nav-items">
              {PUBLIC_NAV_MAIN_ITEMS.map((item) => (
                <li
                  className="apple-global-nav__link-item"
                  key={item.label}
                  onMouseEnter={() => setActiveFlyout(item.hasFlyout ? item.label : null)}
                  onFocus={() => setActiveFlyout(item.hasFlyout ? item.label : null)}
                  onKeyUp={() => setActiveFlyout(item.hasFlyout ? item.label : null)}
                >
                  <PublicNavDestination
                    href={publicNavHref(item, locationSearch)}
                    aria-haspopup={item.hasFlyout ? 'true' : undefined}
                    aria-expanded={item.hasFlyout ? activeFlyout === item.label : undefined}
                  >
                    {item.label}
                  </PublicNavDestination>
                </li>
              ))}
            </ul>
            <ul className="apple-global-nav__actions" onMouseEnter={closeFlyout}>
              {PUBLIC_NAV_ACTION_ITEMS.map((item) => (
                <li
                  className={`apple-global-nav__link-item apple-global-nav__link-item--${item.action}`}
                  key={item.label}
                >
                  <PublicNavDestination href={item.href}>{item.label}</PublicNavDestination>
                </li>
              ))}
            </ul>
            <div className="apple-global-nav__menu-item" onMouseEnter={closeFlyout}>
              <button
                type="button"
                className="apple-global-nav__menu-button"
                onClick={onToggle}
                aria-label={isOpen ? 'Close menu' : 'Menu'}
                aria-expanded={isOpen}
                aria-controls="apple-mobile-menu"
              >
                <span />
                <span />
              </button>
            </div>
          </div>
        </nav>

        <AnimatePresence initial={false}>
          {flyoutGroups ? (
            <motion.div
              className="apple-global-nav__flyout"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.4, 0, 0.6, 1] }}
            >
              <motion.div
                className="apple-global-nav__flyout-content"
                data-flyout={activeFlyout}
                key={activeFlyout}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
              >
                {flyoutGroups.map(([heading, links, utilityLink], groupIndex) => (
                  <section
                    className={`apple-global-nav__flyout-group${groupIndex === 0 ? ' apple-global-nav__flyout-group--primary' : ''}`}
                    key={heading}
                    aria-labelledby={`apple-flyout-${activeFlyout}-${groupIndex}`}
                  >
                    <h2 id={`apple-flyout-${activeFlyout}-${groupIndex}`}>{heading}</h2>
                    <ul>
                      {links.map(([linkLabel, linkHref]) => (
                        <li key={`${linkLabel}-${linkHref}`}>
                          <PublicNavDestination href={linkHref}>{linkLabel}</PublicNavDestination>
                        </li>
                      ))}
                      {utilityLink ? (
                        <li className="apple-global-nav__flyout-utility">
                          <PublicNavDestination href={utilityLink[1]}>{utilityLink[0]}</PublicNavDestination>
                        </li>
                      ) : null}
                    </ul>
                  </section>
                ))}
                <NavFlyoutArtwork flyout={activeFlyout} />
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div id="apple-mobile-menu" className="apple-global-nav__mobile-menu" aria-hidden={!isOpen}>
          <ul>
            {PUBLIC_NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <PublicNavDestination
                  href={publicNavHref(item, locationSearch)}
                  onClick={onClose}
                >
                  {item.label}
                </PublicNavDestination>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <AnimatePresence>
        {flyoutGroups ? (
          <motion.div
            className="apple-global-nav__backdrop"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onMouseEnter={closeFlyout}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

const MobileNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);

  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (!mainContent) return undefined;

    const originalId = mainContent.getAttribute('id');
    const originalTabIndex = mainContent.getAttribute('tabindex');

    if (!originalId) mainContent.setAttribute('id', 'main-content');
    if (originalTabIndex === null) mainContent.setAttribute('tabindex', '-1');

    return () => {
      if (!originalId && mainContent.id === 'main-content') {
        mainContent.removeAttribute('id');
      }
      if (originalTabIndex === null && mainContent.getAttribute('tabindex') === '-1') {
        mainContent.removeAttribute('tabindex');
      }
    };
  }, [location.pathname]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    updateDocumentMetadata(location.pathname);
  }, [location.pathname]);

  return (
    <>
      <a className="site-skip-link" href="#main-content">Skip to main content</a>
      <BlauGlobalNavigation
        isOpen={isMobileMenuOpen}
        onToggle={() => setIsMobileMenuOpen((open) => !open)}
        onClose={() => setIsMobileMenuOpen(false)}
        locationSearch={location.search}
        navRef={navRef}
      />
    </>
  );
};

export default MobileNavbar;
