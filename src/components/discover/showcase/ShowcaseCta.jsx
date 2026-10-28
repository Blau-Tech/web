import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { GlassLink } from '../../ui/glass-button';

/** Closing panel that hands organisers over to the submission flow. */
export default function ShowcaseCta({ id, title, action, href }) {
  return (
    <section className="ds-cta" aria-labelledby={id}>
      <div className="ds-cta__panel">
        <h2 id={id}>{title}</h2>
        <GlassLink href={href} contentClassName="ds-cta__label">
          {action} <ArrowRightIcon aria-hidden="true" />
        </GlassLink>
      </div>
    </section>
  );
}
