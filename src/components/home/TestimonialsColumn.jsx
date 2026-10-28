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
            {testimonials.map(({ text, name, role, featured = false, image }) => {
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
                    <p className="testimonials-card__name">{name}</p>
                    <p className="testimonials-card__role">{role}</p>
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
