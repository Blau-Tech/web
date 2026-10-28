import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

/** A row of mutually exclusive filter buttons (city, timing, type). */
export function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className="ds-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={value === option.key}
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder, label }) {
  return (
    <label className="ds-search">
      <MagnifyingGlassIcon aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {value ? (
        <button type="button" className="ds-search__clear" onClick={() => onChange('')} aria-label="Clear search">
          <XMarkIcon aria-hidden="true" />
        </button>
      ) : null}
    </label>
  );
}

/** Sticky control bar that stays with the results while people scroll them. */
export function FilterBar({ children, summary }) {
  return (
    <div className="ds-filterbar">
      <div className="ds-filterbar__inner">{children}</div>
      {summary ? <p className="ds-filterbar__summary" aria-live="polite">{summary}</p> : null}
    </div>
  );
}
