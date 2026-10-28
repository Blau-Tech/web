export default function MetaItem({ icon: Icon, className, children }) {
  if (!children) return null;

  return (
    <span className={className}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  );
}
