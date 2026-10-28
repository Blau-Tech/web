export default function DetailRow({ label, children }) {
  if (!children) return null;
  return (
    <div className="opportunity-detail__fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
