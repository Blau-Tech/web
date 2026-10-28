import NewListingBadge from '../../common/NewListingBadge';
import { eventDate, eventLocation } from '../../../lib/discovery/eventFormat';
import { formatTimeRange, relativeDayLabel } from '../../../lib/discovery/eventAgenda';
import { Link } from '../../../lib/router';
import ListingThumb from '../showcase/ListingThumb';

/** A large, image-led card for the events worth planning around. */
export default function EventSpotlightCard({ item, href, lead = false }) {
  const date = eventDate(item);
  const when = date
    ? `${relativeDayLabel(date)}, ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : 'Date TBA';

  return (
    <Link to={href} className={`ds-spot${lead ? ' ds-spot--lead' : ''}`}>
      <ListingThumb item={item} eager className="ds-spot__image" />
      <span className="ds-spot__shade" aria-hidden="true" />
      <span className="ds-spot__copy">
        <span className="ds-spot__kicker">
          <NewListingBadge item={item} className="new-listing-badge--inline" />
          {item.category === 'hackathons' ? 'Hackathon' : when}
          <span aria-hidden="true">·</span>
          {item.category === 'hackathons' ? when : formatTimeRange(item)}
        </span>
        <strong className="ds-spot__title">{item.title}</strong>
        <span className="ds-spot__meta">{eventLocation(item)}</span>
      </span>
    </Link>
  );
}
