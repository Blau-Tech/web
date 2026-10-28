import NewListingBadge from '../../common/NewListingBadge';
import { eventLocation, formatEventDate } from '../../../lib/discovery/eventFormat';
import { Link } from '../../../lib/router';
import ListingThumb from '../showcase/ListingThumb';

/** A hackathon card that leads with the build weekend's date and prizes. */
export default function HackathonShelfCard({ item, href }) {
  return (
    <Link to={href} className="ds-hack">
      <span className="ds-hack__media" aria-hidden="true">
        <ListingThumb item={item} />
      </span>
      <span className="ds-hack__body">
        <span className="ds-hack__kicker">
          <NewListingBadge item={item} className="new-listing-badge--inline" />
          {formatEventDate(item.date, { compact: true })}
        </span>
        <strong className="ds-hack__title">{item.title}</strong>
        {item.prizes ? <span className="ds-hack__prizes">{item.prizes}</span> : null}
        <span className="ds-hack__meta">{eventLocation(item)}</span>
      </span>
    </Link>
  );
}
