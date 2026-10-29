import HeroVideo from '../../home/HeroVideo';
import '../../../styles/home-hero.css';
import '../../../styles/hero-nav.css';

/**
 * The top of a browse page: the home hero's footage, or the brand's Glacier light on Navy, with one
 * headline and one line. It sits flush under the pinned nav.
 */
export default function PageHero({ id, title, media = 'video', children }) {
  return (
    <header className={`ds-hero ds-hero--${media}`} aria-labelledby={id}>
      {media === 'video' ? (
        <HeroVideo />
      ) : (
        <div className="ds-hero__glacier" aria-hidden="true">
          <div className="brand-pattern brand-pattern--soft" />
        </div>
      )}
      <div className="ds-shell ds-hero__copy">
        <h1 id={id} className="ds-hero__title">{title}</h1>
        <p className="ds-hero__line" aria-live="polite">{children}</p>
      </div>
    </header>
  );
}
