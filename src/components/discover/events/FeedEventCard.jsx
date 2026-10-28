import { ChevronRightIcon } from '@heroicons/react/24/outline';

import NewListingBadge from '../../common/NewListingBadge';
import {
  eventDate,
  eventLocation,
  eventTopicLabel,
  formatEventTime,
} from '../../../lib/discovery/eventFormat';
import { OpportunityArtwork, OpportunityHitArea } from '../FeaturedOpportunityCard';

export default function FeedEventCard({
  item,
  href,
  topicLabel = item.category === 'hackathons' ? 'Hackathon' : eventTopicLabel(item),
}) {
  const date = eventDate(item);

  return (
    <article className="event-showcase-feed-card">
      <span className="event-showcase-feed-date">
        <span>{date ? date.toLocaleDateString('en-GB', { weekday: 'short' }) : 'Date'}</span>
        <strong>{date ? date.getDate() : '—'}</strong>
        <span>{date ? date.toLocaleDateString('en-GB', { month: 'short' }) : 'TBA'}</span>
      </span>
      <span className="event-showcase-feed-media">
        <OpportunityArtwork item={item} />
      </span>
      <OpportunityHitArea item={item} href={href} />
      <span className="event-showcase-feed-copy">
        <span className="event-showcase-feed-kicker">
          <NewListingBadge item={item} />
          <span>{topicLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{formatEventTime(item.time)}</span>
        </span>
        <span className="event-showcase-feed-title">{item.title}</span>
        <span className="event-showcase-feed-meta">
          {item.organizer ? <span>{item.organizer}</span> : null}
          {item.organizer ? <span aria-hidden="true">·</span> : null}
          <span>{eventLocation(item)}</span>
        </span>
      </span>
      <span className="event-showcase-open event-showcase-open--feed" aria-hidden="true">
        <span>View</span>
        <ChevronRightIcon />
      </span>
    </article>
  );
}
