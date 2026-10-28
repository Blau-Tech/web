import NewListingBadge from '../../common/NewListingBadge';
import {
  deadlineStatus,
  deadlineUrgency,
  formatDeadline,
  scopeLabel,
} from '../../../lib/discovery/programFormat';
import { Link } from '../../../lib/router';
import ListingThumb from '../showcase/ListingThumb';

/** A program and its current application status. */
export default function ProgramCard({ item, href, featured = false }) {
  return (
    <Link to={href} className={`ds-prog${featured ? ' ds-prog--featured' : ''}`}>
      <span className="ds-prog__media" aria-hidden="true">
        <ListingThumb item={item} eager={featured} />
      </span>
      <span className="ds-prog__body">
        <span className="ds-prog__kicker">
          <NewListingBadge item={item} className="new-listing-badge--inline" />
          {item.tag || 'Program'}
          <span aria-hidden="true">·</span>
          {scopeLabel(item)}
        </span>
        <strong className="ds-prog__title">{item.title}</strong>
        <span className="ds-prog__org">{item.organizer || 'Organisation TBA'}</span>
        <span className="ds-prog__deadline">
          <b className={`ds-urgency ds-urgency--${deadlineUrgency(item)}`}>
            {deadlineStatus(item)}
          </b>
          {item.date ? <span>Deadline {formatDeadline(item.date, { compact: true, includeYear: false })}</span> : null}
        </span>
      </span>
    </Link>
  );
}
