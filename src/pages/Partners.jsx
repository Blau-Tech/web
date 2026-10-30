import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRightIcon, CheckIcon, LinkIcon } from '@heroicons/react/24/outline';
import MobileNavbar from '../components/layout/MobileNavbar';
import SiteFooter from '../components/layout/SiteFooter';
import SectionHeading from '../components/common/SectionHeading';
import AudienceMap from '../components/partners/AudienceMap';
import ChannelFlow from '../components/partners/ChannelFlow';
import ListingWall from '../components/partners/ListingWall';
import PartnerPathArt from '../components/partners/PartnerPathArt';
import useLoopWhileVisible from '../components/partners/useLoopWhileVisible';
import { GlassMaterial } from '../components/ui/glass-material';
import { fetchPartnerShowcase } from '../lib/partners/partnerShowcase';
import { supabase } from '../lib/supabase';
import '../styles/partners.css';

gsap.registerPlugin(useGSAP);

const EVENT_INTAKE_URL = import.meta.env.VITE_N8N_EVENT_INTAKE_URL?.trim();
const OPPORTUNITY_URL_PATTERN = /^https?:\/\/.+/;

const submissionCopy = Object.freeze({
  missingLink: 'Drop the listing link in first.',
  submittedTitle: 'Got it.',
  submittedBody: 'We’ll take a look and get it ready for the community.',
  placeholder: 'https://your-event-or-program.com',
  button: 'Submit event',
});

const PARTNER_EMAIL = 'partner@blau-tech.de';
const partnerMailto = (subject) => `mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent(subject)}`;

const AUDIENCE_WORDS = Object.freeze(['Students', 'Developers', 'Founders', 'Researchers']);

const GO_BIGGER_PATHS = Object.freeze([
  {
    art: 'cohost',
    title: 'Co-host with us',
    body: 'We help shape the format and fill the room.',
    action: 'Plan an event',
    href: partnerMailto('Co-hosting an event with Blau Tech'),
  },
  {
    art: 'orbit',
    title: 'Partner with us',
    body: 'Put your brand behind the community it wants to reach.',
    action: 'Become a partner',
    href: partnerMailto('Partnering with Blau Tech'),
  },
]);

const EMPTY_SHOWCASE = Object.freeze({
  listings: Object.freeze([]),
  cities: Object.freeze([
    { code: 'BERLIN', name: 'Berlin', events: null, upcoming: null },
    { code: 'MUNICH', name: 'Munich', events: null, upcoming: null },
  ]),
});

const PARTNER_NETWORK_LOGOS = Object.freeze([
  { id: 'n8n', label: 'n8n', src: '/assets/partners/n8n-official.png' },
  { id: 'miro', label: 'Miro', src: '/assets/partners/miro-official.svg' },
  { id: 'openai', label: 'OpenAI / Codex', src: '/assets/partners/openai-official.png', tone: 'openai' },
  { id: 'anthropic', label: 'Anthropic', src: '/assets/partners/anthropic-official.png' },
  { id: 'ewor', label: 'EWOR', src: '/assets/partners/ewor.png', tone: 'ewor' },
  { id: 'lovable', label: 'Lovable', src: '/assets/partners/lovable-official.svg', tone: 'lovable' },
  { id: 'robco', label: 'RobCo', src: '/assets/partners/robco-official.svg', tone: 'robco' },
  { id: 'tacto', label: 'Tacto', src: '/assets/partners/tacto-official.svg', tone: 'tacto' },
  { id: 'microsoft', label: 'Microsoft', src: '/assets/partners/microsoft-official.png', tone: 'microsoft' },
  { id: 'aws', label: 'Amazon Web Services', src: '/assets/partners/aws.svg', tone: 'aws' },
  { id: 'google', label: 'Google', src: '/assets/partners/google-official.svg' },
  { id: 'mistral-ai', label: 'Mistral AI', src: '/assets/partners/mistral-ai-official.png', tone: 'mistral-ai' },
  { id: 'elevenlabs', label: 'ElevenLabs', src: '/assets/partners/elevenlabs-official.svg', tone: 'elevenlabs' },
  { id: 'tum-ai', label: 'TUM.ai', src: '/assets/partners/tum-ai.png', tone: 'tum-ai' },
  { id: 'start-munich', label: 'START Munich', src: '/assets/partners/start-munich.png', tone: 'start-munich' },
  { id: 'start-berlin', label: 'START Berlin', src: '/assets/partners/start-berlin-official.png', tone: 'start-berlin' },
  { id: 'robotum', label: 'Robotum', src: '/assets/partners/robotum-official.png', tone: 'robotum' },
  { id: 'gdsc', label: 'Google Developer Student Clubs', src: '/assets/partners/google-developer-student-clubs.png', tone: 'gdsc' },
  { id: 'y-combinator', label: 'Y Combinator', src: '/assets/partners/y-combinator-official.png', tone: 'y-combinator' },
  { id: 'entrepreneur-first', label: 'Entrepreneur First', src: '/assets/partners/entrepreneur-first-official.svg', tone: 'entrepreneur-first' },
  { id: 'unternehmertum', label: 'UnternehmerTUM', src: '/assets/partners/unternehmertum-official.svg', tone: 'unternehmertum' },
  { id: 'cdtm', label: 'CDTM', src: '/assets/partners/cdtm-official.png', tone: 'cdtm' },
  { id: 'tum', label: 'Technical University of Munich', src: '/assets/partners/tum-official.png', tone: 'tum' },
  { id: 'lmu', label: 'Ludwig Maximilian University of Munich', src: '/assets/partners/lmu-official.svg', tone: 'lmu' },
  {
    id: 'eurotech',
    label: 'EuroTech Federation',
    src: '/assets/partners/eurotech-federation-lockup-official.png',
    tone: 'eurotech',
  },
]);

const PARTNER_LOGO_BANDS = Object.freeze([
  {
    partners: [
      PARTNER_NETWORK_LOGOS[2], PARTNER_NETWORK_LOGOS[22], PARTNER_NETWORK_LOGOS[1],
      PARTNER_NETWORK_LOGOS[15], PARTNER_NETWORK_LOGOS[9], PARTNER_NETWORK_LOGOS[16],
      PARTNER_NETWORK_LOGOS[12], PARTNER_NETWORK_LOGOS[20], PARTNER_NETWORK_LOGOS[6],
    ],
  },
  {
    partners: [
      PARTNER_NETWORK_LOGOS[10], PARTNER_NETWORK_LOGOS[13], PARTNER_NETWORK_LOGOS[3],
      PARTNER_NETWORK_LOGOS[18], PARTNER_NETWORK_LOGOS[11], PARTNER_NETWORK_LOGOS[21],
      PARTNER_NETWORK_LOGOS[5], PARTNER_NETWORK_LOGOS[8],
    ],
  },
  {
    partners: [
      PARTNER_NETWORK_LOGOS[14], PARTNER_NETWORK_LOGOS[0], PARTNER_NETWORK_LOGOS[19],
      PARTNER_NETWORK_LOGOS[7], PARTNER_NETWORK_LOGOS[17], PARTNER_NETWORK_LOGOS[4],
      PARTNER_NETWORK_LOGOS[23], PARTNER_NETWORK_LOGOS[24],
    ],
  },
]);

const PARTNER_MARQUEE_CYCLES = Object.freeze([0, 1, 2, 3, 4, 5]);

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function rotatingWordTimeline(root) {
  const items = gsap.utils.toArray('.bp-rotator__word', root);
  gsap.set(items, { yPercent: 110 });
  gsap.set(items[0], { yPercent: 0 });

  // Each step swaps the current word for the next; the last step brings the
  // first word back, so the loop joins seamlessly.
  const timeline = gsap.timeline({ repeat: -1 }).addLabel('hold');
  items.forEach((item, index) => {
    const next = items[(index + 1) % items.length];
    timeline
      .to(item, { yPercent: -110, duration: 0.6, ease: 'power3.in' }, '+=1.6')
      .fromTo(next, { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'power3.out' }, '-=0.15');
  });

  return timeline;
}

function RotatingWord({ words }) {
  const scope = useRef(null);
  useLoopWhileVisible(scope, rotatingWordTimeline);

  return (
    <span ref={scope} className="bp-rotator">
      <span className="bp-visually-hidden">{words.join(', ')}</span>
      {words.map((word) => <span className="bp-rotator__word" aria-hidden="true" key={word}>{word}.</span>)}
    </span>
  );
}

function Partners() {
  const pageRef = useRef(null);
  const [eventLink, setEventLink] = useState('');
  const [eventError, setEventError] = useState('');
  const [eventSubmitted, setEventSubmitted] = useState(false);
  const [isEventSubmitting, setIsEventSubmitting] = useState(false);
  const [showcase, setShowcase] = useState(EMPTY_SHOWCASE);

  useEffect(() => {
    let isActive = true;

    fetchPartnerShowcase(supabase)
      .then((nextShowcase) => {
        if (isActive) setShowcase(nextShowcase);
      })
      .catch((error) => {
        console.error('Could not load the partner showcase.', error);
      });

    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    let frame;
    const scrollToHash = () => {
      const target = document.getElementById(window.location.hash.slice(1));
      if (!target) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
    };

    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => {
      window.removeEventListener('hashchange', scrollToHash);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useGSAP((context) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealItems = context.selector('.bp-reveal');
    const heroItems = context.selector('.bp-hero-animate');

    if (reduceMotion) {
      gsap.set([...revealItems, ...heroItems], { clearProps: 'all' });
      return undefined;
    }

    gsap.from(heroItems, {
      y: 20,
      opacity: 0,
      duration: 0.72,
      stagger: 0.07,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    });

    if (!('IntersectionObserver' in window)) return undefined;
    gsap.set(revealItems, { y: 18, opacity: 0 });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        gsap.to(entry.target, {
          y: 0,
          opacity: 1,
          duration: 0.65,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        });
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });

    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, { scope: pageRef });

  const handleEventSubmit = async (event) => {
    event.preventDefault();
    const trimmedLink = eventLink.trim();

    if (!trimmedLink) {
      setEventError(submissionCopy.missingLink);
      return;
    }

    if (!OPPORTUNITY_URL_PATTERN.test(trimmedLink)) {
      setEventError('Use the full link, starting with http:// or https://.');
      return;
    }

    if (!EVENT_INTAKE_URL) {
      setEventError('Link submissions are not switched on here yet. Email it to us instead.');
      return;
    }

    setIsEventSubmitting(true);
    setEventError('');

    try {
      const response = await fetch(EVENT_INTAKE_URL, {
        method: 'POST',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_link: trimmedLink }),
      });

      if (!response.ok) throw new Error(`Submission failed with status ${response.status}`);
      setEventLink('');
      setEventSubmitted(true);
    } catch (error) {
      console.error('Unexpected submission error:', error);
      setEventError('That didn’t go through. Give it another try or email us.');
    } finally {
      setIsEventSubmitting(false);
    }
  };

  return (
    <div ref={pageRef} className="partners-premium-page">
      <MobileNavbar />

      <main id="main-content">
        <section id="submit-event" className="bp-hero" aria-labelledby="partner-page-title">
          <ListingWall listings={showcase.listings} />
          <div className="bp-shell bp-hero__inner">
            <SectionHeading
              className="bp-hero__heading bp-hero-animate"
              titleId="partner-page-title"
              headingLevel={1}
              title="Submit your event."
              description="Free, one link, and in front of builders across Berlin and Munich."
              align="center"
            />

            <div className="bp-hero__submit bp-hero-animate">
              {eventSubmitted ? (
                <GlassMaterial className="bp-submit-success" materialClassName="bp-submit-success__surface" role="status">
                  <CheckIcon className="bp-submit-success__icon" aria-hidden="true" />
                  <span><strong>{submissionCopy.submittedTitle}</strong> {submissionCopy.submittedBody}</span>
                  <button type="button" onClick={() => setEventSubmitted(false)}>Send another</button>
                </GlassMaterial>
              ) : (
                <form className="bp-submit-form" onSubmit={handleEventSubmit} noValidate>
                  <label className="bp-visually-hidden" htmlFor="opportunity-link">Event or program link</label>
                  <GlassMaterial
                    className="bp-submit-field"
                    materialClassName="bp-submit-field__surface"
                  >
                    <LinkIcon className="bp-submit-field__icon" aria-hidden="true" />
                    <input
                      id="opportunity-link"
                      type="url"
                      inputMode="url"
                      autoComplete="url"
                      value={eventLink}
                      onChange={(event) => {
                        setEventLink(event.target.value);
                        if (eventError) setEventError('');
                      }}
                      placeholder={submissionCopy.placeholder}
                      aria-invalid={Boolean(eventError)}
                      aria-describedby={eventError ? 'opportunity-link-error' : undefined}
                    />
                    <button type="submit" disabled={isEventSubmitting}>
                      {isEventSubmitting ? 'Sending…' : submissionCopy.button}<ArrowRightIcon aria-hidden="true" />
                    </button>
                  </GlassMaterial>
                  {eventError ? (
                    <small id="opportunity-link-error" className="bp-submit-error" role="alert">{eventError}</small>
                  ) : null}
                </form>
              )}
            </div>
          </div>
        </section>

        <section id="why-organize" className="bp-channels" aria-labelledby="channels-title">
          <div className="bp-shell">
            <SectionHeading
              className="bp-section-heading bp-reveal"
              titleId="channels-title"
              title="One link. Every channel."
              description="Your listing goes live on Blau Tech and our Berlin and Munich Telegram channels. Standout events also go out on WhatsApp and LinkedIn."
            />
            <div className="bp-channels__stage bp-reveal">
              <ChannelFlow />
            </div>
          </div>
        </section>

        <section id="audience" className="bp-audience" aria-labelledby="audience-title">
          <div className="bp-shell bp-audience__grid">
            <div className="bp-audience__copy bp-reveal">
              <h2 id="audience-title" className="bp-audience__title">
                Your next crowd.
                <RotatingWord words={AUDIENCE_WORDS} />
              </h2>
              <p>The people deciding where to show up next in Berlin and Munich.</p>
            </div>
            <div className="bp-audience__map bp-reveal">
              <AudienceMap cities={showcase.cities} />
            </div>
          </div>
        </section>

        <section id="work-with-us" className="bp-paths" aria-labelledby="paths-title">
          <div className="bp-shell">
            <SectionHeading
              className="bp-section-heading bp-reveal"
              titleId="paths-title"
              title="Want more than a listing?"
              description="Co-host an event with us, or partner with Blau Tech to reach the community directly."
            />

            <div className="bp-paths__grid">
              {GO_BIGGER_PATHS.map((path) => (
                <a className={`bp-path bp-path--${path.art} bp-reveal`} href={path.href} key={path.title}>
                  <div className="bp-path__stage">
                    <PartnerPathArt variant={path.art} />
                  </div>
                  <div className="bp-path__body">
                    <h3>{path.title}</h3>
                    <p>{path.body}</p>
                    <span className="bp-path__action">{path.action}<ArrowRightIcon aria-hidden="true" /></span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="partner-network" className="bp-partner-wall" aria-labelledby="partner-wall-title">
          <div className="bp-shell">
            <SectionHeading
              className="bp-partner-wall__header bp-reveal"
              titleId="partner-wall-title"
              title="Blau Tech Network"
              description="A network of our companies, communities, and the people building what’s next with Blau Tech."
              layout="split"
            />

            <div className="bp-partner-bands">
              {PARTNER_LOGO_BANDS.map((band, bandIndex) => (
                <div
                  className={`bp-partner-band ${bandIndex === 1 ? 'bp-partner-band--reverse' : ''}`}
                  key={`partner-band-${bandIndex + 1}`}
                >
                  <div className="bp-partner-band__viewport">
                    <div className="bp-partner-band__track">
                      {[false, true].map((isDuplicate) => (
                        <ul
                          aria-hidden={isDuplicate || undefined}
                          aria-label={isDuplicate ? undefined : 'Partner network logos'}
                          className="bp-partner-band__group"
                          key={isDuplicate ? 'duplicate' : 'primary'}
                        >
                          {PARTNER_MARQUEE_CYCLES.flatMap((cycleIndex) => band.partners.map((partner) => (
                            <li
                              aria-hidden={isDuplicate || cycleIndex > 0 ? true : undefined}
                              className={`bp-partner-logo ${partner.tone ? `bp-partner-logo--${partner.tone}` : ''}`}
                              key={`${partner.id}-${isDuplicate ? 'duplicate' : 'primary'}-${cycleIndex}`}
                            >
                              <img src={partner.src} alt={isDuplicate || cycleIndex > 0 ? '' : partner.label} decoding="async" />
                            </li>
                          )))}
                        </ul>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div id="contact-organisers" className="bp-partner-wall__footer bp-reveal">
              <a href="mailto:partner@blau-tech.de?subject=Feature%20our%20company%20in%20the%20Blau%20Tech%20partner%20network">
                Put your company here <ArrowIcon />
              </a>
            </div>
          </div>
        </section>

        <section id="partner-with-us" className="bp-cta" aria-labelledby="cta-title">
          <div className="bp-shell">
            <div className="bp-cta__panel bp-reveal">
              <span className="brand-pattern brand-pattern--full bp-cta__pattern" aria-hidden="true" />
              <div className="bp-cta__content">
                <div className="bp-cta__copy">
                  <h2 id="cta-title" className="bp-cta__title">Your event, next.</h2>
                  <p className="bp-cta__description">One link is all we need to list it.</p>
                </div>
                <div className="bp-cta__actions">
                  <a className="bp-cta__button" href="#submit-event">
                    Submit an event <ArrowRightIcon aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default Partners;
