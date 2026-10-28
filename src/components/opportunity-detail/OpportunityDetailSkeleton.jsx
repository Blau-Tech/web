const DETAIL_SKELETON_FACTS = Object.freeze([
  'date',
  'time',
  'location',
  'format',
  'organizer',
  'deadline',
]);

function SkeletonBlock({ className = '' }) {
  return <span className={`opportunity-detail__skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

export default function OpportunityDetailSkeleton() {
  return (
    <article
      className="opportunity-detail opportunity-detail--loading"
      role="status"
      aria-busy="true"
      aria-label="Loading opportunity"
    >
      <header className="opportunity-detail__hero opportunity-detail__skeleton-hero" aria-hidden="true">
        <div className="opportunity-detail__hero-copy opportunity-detail__skeleton-hero-copy">
          <SkeletonBlock className="opportunity-detail__skeleton-back" />
          <SkeletonBlock className="opportunity-detail__skeleton-title opportunity-detail__skeleton-title--wide" />
          <SkeletonBlock className="opportunity-detail__skeleton-title opportunity-detail__skeleton-title--short" />
          <SkeletonBlock className="opportunity-detail__skeleton-byline" />
          <div className="opportunity-detail__hero-meta">
            <span className="opportunity-detail__skeleton-meta">
              <SkeletonBlock className="opportunity-detail__skeleton-icon" />
              <SkeletonBlock className="opportunity-detail__skeleton-meta-label" />
            </span>
            <span className="opportunity-detail__skeleton-meta">
              <SkeletonBlock className="opportunity-detail__skeleton-icon" />
              <SkeletonBlock className="opportunity-detail__skeleton-meta-label opportunity-detail__skeleton-meta-label--short" />
            </span>
          </div>
          <SkeletonBlock className="opportunity-detail__skeleton-divider" />
          <SkeletonBlock className="opportunity-detail__skeleton-summary" />
          <SkeletonBlock className="opportunity-detail__skeleton-summary opportunity-detail__skeleton-summary--medium" />
          <SkeletonBlock className="opportunity-detail__skeleton-summary opportunity-detail__skeleton-summary--short" />
          <SkeletonBlock className="opportunity-detail__skeleton-hero-action" />
        </div>
      </header>

      <div className="opportunity-detail__body" aria-hidden="true">
        <section className="opportunity-detail__description opportunity-detail__skeleton-description">
          <SkeletonBlock className="opportunity-detail__skeleton-heading" />
          <SkeletonBlock className="opportunity-detail__skeleton-copy" />
          <SkeletonBlock className="opportunity-detail__skeleton-copy" />
          <SkeletonBlock className="opportunity-detail__skeleton-copy opportunity-detail__skeleton-copy--medium" />
          <SkeletonBlock className="opportunity-detail__skeleton-copy opportunity-detail__skeleton-copy--short" />
        </section>

        <aside className="opportunity-detail__aside">
          <div className="opportunity-detail__trust opportunity-detail__skeleton-trust">
            <SkeletonBlock className="opportunity-detail__skeleton-icon opportunity-detail__skeleton-icon--large" />
            <span>
              <SkeletonBlock className="opportunity-detail__skeleton-trust-title" />
              <SkeletonBlock className="opportunity-detail__skeleton-trust-copy" />
            </span>
          </div>
          <div className="opportunity-detail__facts opportunity-detail__skeleton-facts">
            {DETAIL_SKELETON_FACTS.map((fact, index) => (
              <div className="opportunity-detail__fact" key={fact}>
                <SkeletonBlock className="opportunity-detail__skeleton-fact-label" />
                <SkeletonBlock
                  className={`opportunity-detail__skeleton-fact-value opportunity-detail__skeleton-fact-value--${(index % 3) + 1}`}
                />
              </div>
            ))}
          </div>
          <SkeletonBlock className="opportunity-detail__skeleton-action" />
        </aside>
      </div>
    </article>
  );
}
