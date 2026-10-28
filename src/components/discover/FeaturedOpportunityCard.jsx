import { useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

import NewListingBadge from '../common/NewListingBadge';
import { parseDate } from '../../lib/discovery/discover';
import { houseImage, opportunityImage } from '../../lib/discovery/opportunityImage';
import { Link } from '../../lib/router';

function formatCompactDate(value) {
  const date = parseDate(value);
  if (!date) return 'Date TBA';

  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function opportunityLocation(item) {
  if (item.location) return item.location;
  return String(item.format || '').toUpperCase() === 'ONLINE' ? 'Online' : 'Location TBA';
}

export function OpportunityArtwork({ item, eager = false }) {
  // Track the URL that failed rather than a boolean, so recycling this card for
  // a different item re-tries that item's own image instead of staying fallen back.
  const [failedUrl, setFailedUrl] = useState(null);
  const preferred = opportunityImage(item);
  const source = preferred === failedUrl ? houseImage(item.category || item.tag) : preferred;

  // Two layers of the same image (one request, the browser caches it): a blurred
  // bed that keeps overlaid copy readable, and the sharp image on top. Layouts
  // that want the blur reveal it and mask the sharp layer; by default it is hidden.
  return (
    <span className="event-showcase-artwork" aria-hidden="true">
      <img
        className="event-showcase-artwork-layer event-showcase-artwork-layer--blur"
        src={source}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
      />
      <img
        className="event-showcase-artwork-layer event-showcase-artwork-layer--sharp"
        src={source}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(preferred)}
      />
    </span>
  );
}

export function OpportunityHitArea({ item, href, onSelect, className = 'event-showcase-card-hitarea' }) {
  if (href) {
    return (
      <Link
        to={href}
        className={className}
        aria-label={`View details for ${item.title}`}
      />
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => onSelect?.(item)}
      aria-label={`View details for ${item.title}`}
    />
  );
}

export default function FeaturedOpportunityCard({ item, eager = false, href, onSelect }) {
  return (
    <article className="event-showcase-feature-card">
      <span className="event-showcase-feature-media">
        <OpportunityArtwork item={item} eager={eager} />
      </span>
      <OpportunityHitArea item={item} href={href} onSelect={onSelect} />
      <span className="event-showcase-feature-copy">
        <span className="event-showcase-feature-title">{item.title}</span>
        <span className="event-showcase-card-meta">
          <NewListingBadge item={item} />
          <span>{formatCompactDate(item.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{opportunityLocation(item)}</span>
        </span>
      </span>
      <span className="event-showcase-open" aria-hidden="true">
        <span>View</span>
        <ChevronRightIcon />
      </span>
    </article>
  );
}
