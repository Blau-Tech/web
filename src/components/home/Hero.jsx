import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { EnvelopeIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useCity } from '../../lib/city/cityContext';
import { FALLBACK_WHATSAPP_URL, hasPrograms } from '../../lib/city/cityConfig';
import { NEWSLETTER_ENABLED, openNewsletter } from '../../lib/newsletter';
import { useNavigate } from '../../lib/router';
import { GlassButton, GlassLink } from '../ui/glass-button';

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: 'easeOut' },
  },
};

const featuredCities = ['Munich', 'Berlin'];
const Hero = () => {
  const { city, enabledSections, isGeneric } = useCity();
  const whatsappUrl = city.whatsappUrl || FALLBACK_WHATSAPP_URL;
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [featuredCityIndex, setFeaturedCityIndex] = useState(0);
  const opportunityTypes = hasPrograms(enabledSections)
    ? 'Events, hackathons, and programs'
    : 'Events and hackathons';

  useEffect(() => {
    if (!isGeneric || shouldReduceMotion) return undefined;

    const interval = window.setInterval(() => {
      setFeaturedCityIndex((currentIndex) => (currentIndex + 1) % featuredCities.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, [isGeneric, shouldReduceMotion]);

  const handleExplore = () => {
    navigate('/discover/events?types=events');
  };

  return (
    <section className="hero-section relative flex min-h-[calc(100svh-5rem)]">
      <div className="hero-content section-container relative flex w-full flex-col items-center text-center">
        <motion.div
          className="hero-copy relative z-10 flex w-full flex-1 flex-col justify-center space-y-5 sm:space-y-8"
          initial={shouldReduceMotion ? false : 'hidden'}
          animate="visible"
          variants={containerVariants}
        >
          {/* Headline and description read as one unit, so they sit close. */}
          <div className="hero-intro space-y-3 sm:space-y-4">
            <motion.h1
              className="hero-heading heading-1 mx-auto max-w-5xl"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.75, ease: 'easeOut' }}
            >
              Your guide to tech in{' '}
              {isGeneric ? (
                <>
                  <span className="hero-city-rotator hero-accent">
                    <AnimatePresence initial={false} mode="wait">
                      <motion.span
                        key={featuredCities[featuredCityIndex]}
                        className="hero-city-rotator__word"
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      >
                        {featuredCities[featuredCityIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </>
              ) : (
                <span className="hero-accent">{city.name}</span>
              )}
            </motion.h1>

            <motion.p
              className="body-hero"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.75, ease: 'easeOut' }}
            >
              {opportunityTypes}, in one place.
            </motion.p>
          </div>

          <motion.div
            className="hero-actions flex w-full flex-col items-center justify-center gap-3"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.75, ease: 'easeOut' }}
          >
            <GlassButton
              type="button"
              onClick={handleExplore}
              className="w-full sm:w-auto [&_.glass-button]:w-full sm:[&_.glass-button]:w-auto"
              contentClassName="flex items-center justify-center gap-2"
            >
              Explore opportunities
              <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
            </GlassButton>
          </motion.div>

          <motion.div
            className="hero-community flex w-full flex-col items-center"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.75, ease: 'easeOut' }}
          >
            <p className="hero-community-label blau-text-muted mb-3 text-xs font-medium">Stay connected</p>
            <div className="flex w-full max-w-xl flex-wrap items-center justify-center gap-3">
              {whatsappUrl && (
                <GlassLink href={whatsappUrl} target="_blank" rel="noopener noreferrer" size="icon" aria-label="WhatsApp" title="WhatsApp">
                  <svg className="h-5 w-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </GlassLink>
              )}
              {NEWSLETTER_ENABLED && (
                <GlassButton type="button" onClick={() => openNewsletter()} size="icon" aria-label="Newsletter" title="Newsletter">
                  <EnvelopeIcon className="h-5 w-5 text-[#F59E0B]" aria-hidden="true" />
                </GlassButton>
              )}
              {city.linkedinUrl && (
                <GlassLink href={city.linkedinUrl} target="_blank" rel="noopener noreferrer" size="icon" aria-label="LinkedIn" title="LinkedIn">
                  <svg className="h-5 w-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </GlassLink>
              )}
            </div>
          </motion.div>
        </motion.div>

        <aside className="hero-map-panel" aria-hidden="true">
          <img src="/assets/blau-tech-europe-map.svg" alt="" />
        </aside>
      </div>
    </section>
  );
};

export default Hero;
