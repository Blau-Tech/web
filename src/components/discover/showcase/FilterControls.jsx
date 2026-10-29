import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

/** A short row of mutually exclusive options as plain text: the current one is underlined. */
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

/** A native select drawn as a tile, so longer lists still work with a keyboard and on a phone. */
export function SelectControl({ label, options, value, onChange }) {
  return (
    <label className="ds-select">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.key} value={option.key}>{option.label}</option>
        ))}
      </select>
      <ChevronDownIcon strokeWidth={2} aria-hidden="true" />
    </label>
  );
}

export function ToggleControl({ label, pressed, onChange }) {
  return (
    <button type="button" className="ds-toggle" aria-pressed={pressed} onClick={() => onChange(!pressed)}>
      {label}
    </button>
  );
}

export function SearchField({ value, onChange, placeholder, label }) {
  return (
    <label className="ds-search">
      <MagnifyingGlassIcon strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {value ? (
        <button type="button" className="ds-search__clear" onClick={() => onChange('')} aria-label="Clear search">
          <XMarkIcon strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}
    </label>
  );
}

/** The controls stay under the nav while people scroll the results. */
export function FilterBar({ children }) {
  return (
    <div className="ds-filterbar">
      <div className="ds-shell ds-filterbar__inner">{children}</div>
    </div>
  );
}

/** What the filters left, and a way back. Only shown while a filter is on. */
export function FilterStatus({ summary, onClear }) {
  return (
    <div className="ds-shell ds-status" aria-live="polite">
      {summary ? (
        <>
          <p>{summary}</p>
          <button type="button" onClick={onClear}>Clear filters</button>
        </>
      ) : null}
    </div>
  );
}
