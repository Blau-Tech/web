import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useCity } from '../../lib/city/cityContext';
import { hasPrograms } from '../../lib/city/cityConfig';
import { useNavigate } from '../../lib/router';
import { GlassButton } from '../ui/glass-button';
import HeroVideo from './HeroVideo';
import '../../styles/home-hero.css';

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
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [featuredCityIndex, setFeaturedCityIndex] = useState(0);
  const activeCity = isGeneric ? featuredCities[featuredCityIndex] : city.name;
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
      <HeroVideo />
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
              Find your next opportunity
            </motion.h1>

            <motion.p
              className="body-hero"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.75, ease: 'easeOut' }}
            >
              {opportunityTypes} in{' '}
              {isGeneric ? (
                <span className="hero-city-rotator hero-accent">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.span
                      key={activeCity}
                      className="hero-city-rotator__word"
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      {activeCity}
                    </motion.span>
                  </AnimatePresence>
                </span>
              ) : (
                <span className="hero-accent">{city.name}</span>
              )}
              .
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
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
