export default function ShowcaseEmptyState({
  title,
  description,
  onAction,
  actionLabel = 'Try again',
}) {
  return (
    <div className="ds-empty">
      <p className="ds-empty__title">{title}</p>
      <p>{description}</p>
      {onAction ? (
        <button type="button" onClick={onAction} className="ds-button">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
