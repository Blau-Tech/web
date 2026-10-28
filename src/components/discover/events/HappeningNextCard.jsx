import { ChevronRightIcon } from '@heroicons/react/24/outline';

import NewListingBadge from '../../common/NewListingBadge';
import {
  eventDate,
  eventLocation,
  formatEventTime,
  opportunityTypeLabel,
} from '../../../lib/discovery/eventFormat';
import { OpportunityHitArea } from '../FeaturedOpportunityCard';

export default function HappeningNextCard({ item, href }) {
  const date = eventDate(item);

  return (
    <article className="event-showcase-next-card">
      <span className="event-showcase-next-date" aria-hidden="true">
        <strong>{date ? date.getDate() : '—'}</strong>
        <span>{date ? date.toLocaleDateString('en-GB', { month: 'short' }) : 'TBA'}</span>
      </span>
      <OpportunityHitArea item={item} href={href} />
      <span className="event-showcase-next-copy">
        <span className="event-showcase-next-kicker">
          <NewListingBadge item={item} className="new-listing-badge--inline" />
          {opportunityTypeLabel(item)} <span aria-hidden="true">·</span> {formatEventTime(item.time)}
        </span>
        <span className="event-showcase-next-title">{item.title}</span>
        <span className="event-showcase-next-meta">{eventLocation(item)}</span>
      </span>
      <ChevronRightIcon className="event-showcase-next-open" aria-hidden="true" />
    </article>
  );
}
