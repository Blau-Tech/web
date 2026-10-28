import { ChevronRightIcon } from '@heroicons/react/24/outline';

import NewListingBadge from '../../common/NewListingBadge';
import { formatEventDate, eventLocation } from '../../../lib/discovery/eventFormat';
import { OpportunityArtwork, OpportunityHitArea } from '../FeaturedOpportunityCard';

export default function HackathonCard({ item, index, href }) {
  return (
    <article className={`event-showcase-hackathon-card ${index === 0 ? 'event-showcase-hackathon-card--lead' : ''}`}>
      <OpportunityArtwork item={item} eager={index < 3} />
      <span className="event-showcase-hackathon-wash" aria-hidden="true" />
      <OpportunityHitArea item={item} href={href} />
      <span className="event-showcase-hackathon-copy">
        <span className="event-showcase-hackathon-kicker">
          <NewListingBadge item={item} className="new-listing-badge--inline" />
          Hackathon <span aria-hidden="true">·</span> {formatEventDate(item.date, { compact: true })}
        </span>
        <span className="event-showcase-hackathon-title">{item.title}</span>
        <span className="event-showcase-hackathon-meta">{eventLocation(item)}</span>
      </span>
      <span className="event-showcase-hackathon-open" aria-hidden="true">
        <ChevronRightIcon />
      </span>
    </article>
  );
}
