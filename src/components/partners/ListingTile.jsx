import { houseImage } from '../../lib/discovery/opportunityImage';

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

function formatDate(value) {
  const parsed = value ? new Date(`${value}T00:00:00`) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? dateFormatter.format(parsed) : '';
}

/** A compact, read-only version of a Blau Tech listing card. */
export default function ListingTile({ listing, className = '', loading = 'lazy', priority }) {
  const fallback = houseImage(listing.category);

  return (
    <article className={`bp-tile ${className}`.trim()}>
      <img
        src={listing.imageUrl || fallback}
        alt=""
        loading={loading}
        // React 18 only passes this through in lowercase; the lint rule targets React 19.
        // eslint-disable-next-line react/no-unknown-property
        fetchpriority={priority}
        decoding="async"
        width="1200"
        height="630"
        onError={(event) => {
          if (event.currentTarget.src.endsWith(fallback)) return;
          event.currentTarget.src = fallback;
        }}
      />
      <div className="bp-tile__body">
        <small>{formatDate(listing.date)}</small>
        <strong>{listing.title}</strong>
      </div>
    </article>
  );
}
