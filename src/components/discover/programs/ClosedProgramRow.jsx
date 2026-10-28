import NewListingBadge from '../../common/NewListingBadge';
import { Link } from '../../../lib/router';

/** A closed program, kept for reference and next rounds. */
export default function ClosedProgramRow({ item, href }) {
  return (
    <li>
      <Link to={href} className="ds-closed__row">
        <span>
          <NewListingBadge item={item} className="new-listing-badge--inline" />
          <strong>{item.title}</strong>
          <small>{item.organizer || 'Organisation TBA'}</small>
        </span>
        <span className="ds-closed__date">Applications closed</span>
      </Link>
    </li>
  );
}
