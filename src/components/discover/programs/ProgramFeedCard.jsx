import { BuildingOffice2Icon, ChevronRightIcon } from '@heroicons/react/24/outline';

import NewListingBadge from '../../common/NewListingBadge';
import { deadlineStatus, formatDeadline, scopeLabel } from '../../../lib/discovery/programFormat';
import { OpportunityArtwork, OpportunityHitArea } from '../FeaturedOpportunityCard';

export default function ProgramFeedCard({ item, href }) {
  return (
    <article className="program-showcase-feed-card program-showcase-feed-card--imaged">
      <OpportunityArtwork item={item} />
      <span className="program-showcase-feed-deadline">
        <span>Deadline</span>
        <strong>{formatDeadline(item.date, { compact: true })}</strong>
        <small>{deadlineStatus(item)}</small>
      </span>
      <OpportunityHitArea item={item} href={href} className="program-showcase-hitarea" />
      <span className="program-showcase-feed-copy">
        <span className="program-showcase-card-kicker">
          <NewListingBadge item={item} className="new-listing-badge--inline" />
          Program · {scopeLabel(item)}
        </span>
        <span className="program-showcase-feed-title">{item.title}</span>
        <span className="program-showcase-feed-meta">
          <BuildingOffice2Icon aria-hidden="true" />
          {item.organizer || 'Organisation TBA'}
        </span>
      </span>
      <ChevronRightIcon className="program-showcase-feed-arrow" aria-hidden="true" />
    </article>
  );
}
