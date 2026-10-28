import '@fontsource-variable/manrope';
import { useState } from 'react';
import { Link, useLocation } from '../../lib/router';
import { useCity } from '../../lib/city/cityContext';
import { FALLBACK_WHATSAPP_URL, hasPrograms } from '../../lib/city/cityConfig';
import { NEWSLETTER_ENABLED, openNewsletter } from '../../lib/newsletter';
import BrandLink from '../common/BrandLink';
import { GlassMaterial } from '../ui/glass-material';

const FooterLink = ({ href, children, external = false }) => {
  const className = 'site-footer__link';

  if (external || (typeof href === 'string' && href.startsWith('mailto:'))) {
    return (
      <a
        href={href}
        className={className}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    );
  }

  return <Link to={href} className={className}>{children}</Link>;
};

const FooterGroup = ({ title, className = '', children }) => (
  <nav className={`site-footer__column ${className}`.trim()} aria-label={`${title} links`}>
    <p className="site-footer__heading">{title}</p>
    <ul className="site-footer__links">
      {children}
    </ul>
  </nav>
);

// Collects the address only; the newsletter modal handles consent and sending.
const FooterNewsletter = () => {
  const [email, setEmail] = useState('');

  return (
    <form
      className="site-footer__newsletter"
      onSubmit={(event) => {
        event.preventDefault();
        openNewsletter(email);
      }}
    >
      <div className="site-footer__newsletter-copy">
        <label htmlFor="footer-newsletter-email">Newsletter</label>
        <p>New opportunities, once a week.</p>
      </div>
      <GlassMaterial
        className="site-footer__newsletter-fields"
        materialClassName="site-footer__newsletter-field-surface"
      >
        <input
          id="footer-newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Email address"
          maxLength={254}
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit">Subscribe</button>
      </GlassMaterial>
    </form>
  );
};

const SiteFooter = () => {
  const { city, enabledSections } = useCity();
  const { search } = useLocation();
  const withCity = (pathname) => ({ pathname, search });

  return (
    <footer id="site-footer" className="site-footer relative z-10" aria-label="Footer">
      <div className="site-footer__surface">
        <div className="site-footer__container">
          <div className="site-footer__grid">
            <div className="site-footer__brand-column">
              <BrandLink
                to={withCity('/')}
                className="site-footer__brand"
                markWidth="100"
                markHeight="72"
                nameId="footer-brand"
              >
                BLAU TECH
              </BrandLink>

              {NEWSLETTER_ENABLED && <FooterNewsletter />}

              <div className="site-footer__copyright">
                <p>© {new Date().getFullYear()} Blau Tech. All rights reserved.</p>
              </div>
            </div>

            <FooterGroup title="Explore" className="site-footer__column--explore">
              <li><FooterLink href={withCity('/discover/events')}>Events</FooterLink></li>
              <li><FooterLink href={withCity('/discover/hackathons')}>Hackathons</FooterLink></li>
              {hasPrograms(enabledSections) && (
                <li><FooterLink href={withCity('/discover/programs')}>Programs</FooterLink></li>
              )}
            </FooterGroup>

            <FooterGroup title="Community" className="site-footer__column--community">
              <li><FooterLink href={city.whatsappUrl || FALLBACK_WHATSAPP_URL} external>WhatsApp</FooterLink></li>
              {NEWSLETTER_ENABLED && (
                <li>
                  <button type="button" className="site-footer__link" onClick={() => openNewsletter()}>Newsletter</button>
                </li>
              )}
              {city.linkedinUrl && <li><FooterLink href={city.linkedinUrl} external>LinkedIn</FooterLink></li>}
            </FooterGroup>

            <FooterGroup title="Company" className="site-footer__column--company">
              <li><FooterLink href={withCity('/partners')}>For organisers</FooterLink></li>
            </FooterGroup>

            <FooterGroup title="Legal" className="site-footer__column--legal">
              <li><FooterLink href={withCity('/privacy')}>Privacy policy</FooterLink></li>
            </FooterGroup>
          </div>

          <div className="site-footer__utility">
            <a href="mailto:partner@blau-tech.de">Contact</a>
          </div>
        </div>

        <div className="site-footer__signature" aria-hidden="true">
          <div className="site-footer__glow" />
          <div className="site-footer__wordmark">
            <span>BLAU TECH</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
