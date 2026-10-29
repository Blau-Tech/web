import '../../styles/hero-nav.css';

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
      <header className="opportunity-detail__hero" aria-hidden="true">
        <div className="opportunity-detail__shell opportunity-detail__hero-inner">
          <div className="opportunity-detail__hero-copy">
            <SkeletonBlock className="opportunity-detail__skeleton-line opportunity-detail__skeleton-line--short" />
            <SkeletonBlock className="opportunity-detail__skeleton-title" />
            <SkeletonBlock className="opportunity-detail__skeleton-title opportunity-detail__skeleton-title--short" />
            <SkeletonBlock className="opportunity-detail__skeleton-line" />
          </div>
          <SkeletonBlock className="opportunity-detail__skeleton-frame" />
        </div>
      </header>

      <div className="opportunity-detail__body" aria-hidden="true">
        <div className="opportunity-detail__tiles">
          {[0, 1, 2].map((tile) => <SkeletonBlock key={tile} className="opportunity-detail__skeleton-tile" />)}
        </div>
      </div>
    </article>
  );
}
