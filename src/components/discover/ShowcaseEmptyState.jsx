const VARIANT_CLASS_NAMES = Object.freeze({
  events: 'event-showcase-empty',
  programs: 'program-showcase-empty',
});

export default function ShowcaseEmptyState({
  variant = 'events',
  title,
  description,
  onAction,
  actionLabel = 'Try again',
}) {
  const className = VARIANT_CLASS_NAMES[variant] || VARIANT_CLASS_NAMES.events;

  return (
    <div className={className}>
      <p className={`${className}-title`}>{title}</p>
      <p>{description}</p>
      {onAction ? (
        <button type="button" onClick={onAction} className="btn-primary btn-sm">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
