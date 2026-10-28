import NewListingBadge from '../../common/NewListingBadge';
import {
  deadlineStatus,
  deadlineUrgency,
  formatApplicationOpen,
  formatDeadline,
} from '../../../lib/discovery/programFormat';
import { OpportunityHitArea } from '../FeaturedOpportunityCard';

export default function DeadlineListRow({ item, href }) {
  return (
    <article className="program-showcase-deadline-row" role="listitem">
      <span className="program-showcase-deadline-program">
        <NewListingBadge item={item} className="new-listing-badge--stacked" />
        <strong>{item.title}</strong>
        <small>{item.organizer || 'Organisation TBA'}</small>
      </span>
      <OpportunityHitArea item={item} href={href} className="program-showcase-hitarea" />
      <span className="program-showcase-deadline-window">
        <span className="program-showcase-deadline-window-date">
          <small>Opens</small>
          <strong>{formatApplicationOpen(item)}</strong>
        </span>
        <span className="program-showcase-deadline-window-line" aria-hidden="true" />
        <span className="program-showcase-deadline-window-date program-showcase-deadline-window-date--end">
          <small>Closes</small>
          <strong>{formatDeadline(item.date, { compact: true, includeYear: false })}</strong>
        </span>
      </span>
      <span className={`program-showcase-deadline-time program-showcase-deadline-time--${deadlineUrgency(item)}`}>
        <small>Time left</small>
        <strong>{deadlineStatus(item)}</strong>
      </span>
    </article>
  );
}
