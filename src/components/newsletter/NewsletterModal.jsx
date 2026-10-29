import { useEffect, useState } from 'react';
import PopUp from '../feedback/PopUp';
import { requestModalOwnership } from '../../lib/modalCoordination';
import { Link } from '../../lib/router';
import {
  NEWSLETTER_CONSENT_TEXT,
  NEWSLETTER_ENABLED,
  NEWSLETTER_OPEN_EVENT,
  useNewsletterSignup,
} from '../../lib/newsletter';
import '../../styles/newsletter.css';

const DONE = {
  check_email: ['Check your inbox', 'Tap the link we sent to confirm.'],
  active: ["You're in", 'See you in your inbox.'],
  confirmed: ["You're in", 'See you in your inbox.'],
  unsubscribed: ['Previously unsubscribed', 'Email partner@blau-tech.de to rejoin.'],
};

// Read synchronously so the /newsletter redirect cannot strip the hash first.
function readToken() {
  if (typeof window === 'undefined') return null;
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  return /^[0-9a-f]{64}$/.test(token || '') ? token : null;
}

export default function NewsletterModal() {
  const signup = useNewsletterSignup();
  const { reset, setEmail } = signup;
  const [token, setToken] = useState(readToken);
  const [isOpen, setIsOpen] = useState(() => Boolean(token));

  useEffect(() => {
    // Keep the one-time token out of history, screenshots and shared URLs.
    if (token) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [token]);

  useEffect(() => {
    const open = (event) => {
      reset();
      setToken(null);
      if (event.detail?.email) setEmail(event.detail.email);
      requestModalOwnership();
      setIsOpen(true);
    };
    const openFromLink = () => {
      const next = readToken();
      if (!next) return;
      reset();
      setToken(next);
      requestModalOwnership();
      setIsOpen(true);
    };
    window.addEventListener(NEWSLETTER_OPEN_EVENT, open);
    window.addEventListener('hashchange', openFromLink);
    return () => {
      window.removeEventListener(NEWSLETTER_OPEN_EVENT, open);
      window.removeEventListener('hashchange', openFromLink);
    };
  }, [reset, setEmail]);

  useEffect(() => {
    // An expired link falls back to a fresh signup form.
    if (signup.error && token) setToken(null);
  }, [signup.error, token]);

  if (!NEWSLETTER_ENABLED) return null;

  const done = DONE[signup.status];
  const confirming = token && !signup.status;
  const [title, description] = done
    || (confirming ? ['Confirm subscription', 'One tap and you are in.'] : ['Newsletter', 'Events, hackathons and programs, once a week.']);

  return (
    <PopUp
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={title}
      description={description}
      size="sm"
      className="newsletter-popup"
    >
      {done ? null : confirming ? (
        <button
          type="button"
          className="newsletter-popup__cta newsletter-popup__cta--block"
          disabled={signup.busy}
          onClick={() => signup.confirm(token)}
        >
          {signup.busy ? 'Confirming…' : 'Confirm'}
        </button>
      ) : (
        <form onSubmit={signup.subscribe} className="newsletter-popup__form">
          <div className="newsletter-popup__field">
            <label htmlFor="newsletter-popup-email" className="sr-only">Email address</label>
            <input
              id="newsletter-popup-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="Email address"
              maxLength={254}
              required
              value={signup.email}
              onChange={(event) => signup.setEmail(event.target.value)}
            />
            <button
              type="submit"
              className="newsletter-popup__cta"
              disabled={signup.busy || !signup.consent}
            >
              {signup.busy ? 'Sending…' : 'Subscribe'}
            </button>
          </div>
          <div hidden aria-hidden="true">
            <label htmlFor="newsletter-popup-website">Website</label>
            <input
              id="newsletter-popup-website"
              tabIndex={-1}
              autoComplete="off"
              value={signup.website}
              onChange={(event) => signup.setWebsite(event.target.value)}
            />
          </div>
          <label className="newsletter-popup__consent">
            <input
              type="checkbox"
              required
              checked={signup.consent}
              onChange={(event) => signup.setConsent(event.target.checked)}
            />
            <span>
              {NEWSLETTER_CONSENT_TEXT.replace('Privacy Policy.', '')}
              <Link to="/privacy" onClick={() => setIsOpen(false)}>Privacy Policy</Link>.
            </span>
          </label>
          {signup.error && <p className="newsletter-popup__error" role="alert">{signup.error}</p>}
        </form>
      )}
    </PopUp>
  );
}
