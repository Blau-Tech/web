export default function EventCardSkeleton({ feed = false }) {
  return (
    <span
      className={feed ? 'event-showcase-feed-card event-showcase-skeleton' : 'event-showcase-feature-card event-showcase-skeleton'}
      aria-hidden="true"
    />
  );
}
