import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Fragment, useRef } from 'react';

const loopCopies = 4;

export const TestimonialsColumn = ({ className = '', testimonials, duration = 10 }) => {
  const shouldReduceMotion = useReducedMotion();
  const repetitions = shouldReduceMotion ? 1 : loopCopies;
  // Watch the visible column, not the track: the track holds every loop copy,
  // so a long column's track never reaches a meaningful share of the viewport.
  const columnRef = useRef(null);
  const isInView = useInView(columnRef, { once: true, amount: 0.05 });

  return (
    <div ref={columnRef} className={`testimonials-column ${className}`.trim()}>
      <motion.div
        initial={shouldReduceMotion ? false : { y: 0 }}
        animate={shouldReduceMotion || !isInView ? undefined : { y: '-50%' }}
        transition={shouldReduceMotion ? undefined : {
          duration: duration * (loopCopies / 2),
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        className="testimonials-column__track"
      >
        {Array.from({ length: repetitions }, (_, repetitionIndex) => (
          <Fragment key={repetitionIndex}>
            {testimonials.map(({ text, name, role, featured = false, image, linkedin, company }) => {
              return (
                <article
                  key={`${repetitionIndex}-${name}`}
                  className={`testimonials-card${featured ? ' testimonials-card--featured' : ''}`}
                  aria-hidden={repetitionIndex > 0 ? 'true' : undefined}
                >
                  {featured && image ? (
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="testimonials-card__image"
                    />
                  ) : null}
                  {featured ? <span className="testimonials-card__overlay" aria-hidden="true" /> : null}
                  <p className="testimonials-card__quote">{text}</p>
                  <footer className="testimonials-card__person">
                    <div>
                      <p className="testimonials-card__name">{name}</p>
                      <p className="testimonials-card__role">{role}</p>
                    </div>
                    {linkedin ? (
                      <a
                        href={linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="testimonials-card__linkedin"
                        aria-label={`${name} on LinkedIn`}
                        tabIndex={repetitionIndex > 0 ? -1 : undefined}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    ) : null}
                    {company ? (
                      <a
                        href={company.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="testimonials-card__company"
                        aria-label={`${company.name} website`}
                        tabIndex={repetitionIndex > 0 ? -1 : undefined}
                      >
                        <img src={company.logo} alt="" loading="lazy" decoding="async" />
                      </a>
                    ) : null}
                  </footer>
                </article>
              );
            })}
          </Fragment>
        ))}
      </motion.div>
    </div>
  );
};
