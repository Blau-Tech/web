export default function ProgramSkeleton({ feed = false, deadline = false }) {
  const surfaceClass = deadline
    ? 'program-showcase-deadline-row'
    : (feed ? 'program-showcase-feed-card' : 'program-showcase-feature-card');

  return (
    <span
      className={`${surfaceClass} program-showcase-skeleton`}
      aria-hidden="true"
    />
  );
}
