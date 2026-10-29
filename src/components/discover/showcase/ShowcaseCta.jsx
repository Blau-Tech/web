import { ArrowRightIcon } from '@heroicons/react/24/outline';

/** Closing panel that hands organisers over to the submission flow: Navy, with the Glacier light. */
export default function ShowcaseCta({ id, title, action, href }) {
  return (
    <section className="ds-cta" aria-labelledby={id}>
      <div className="ds-cta__panel">
        <div className="ds-cta__glacier" aria-hidden="true">
          <div className="brand-pattern brand-pattern--soft" />
        </div>
        <h2 id={id}>{title}</h2>
        <a className="ds-cta__action" href={href}>
          {action}
          <ArrowRightIcon strokeWidth={2} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
