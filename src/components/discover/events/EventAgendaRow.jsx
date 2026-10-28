import { ChevronRightIcon } from '@heroicons/react/24/outline';

import NewListingBadge from '../../common/NewListingBadge';
import { eventLocation, eventTopicLabel } from '../../../lib/discovery/eventFormat';
import { formatTimeRange } from '../../../lib/discovery/eventAgenda';
import { LIVE_STATUS_LABELS, liveStatus, runningUntilLabel } from '../../../lib/discovery/liveStatus';
import { Link } from '../../../lib/router';
import ListingThumb from '../showcase/ListingThumb';

const FORMAT_LABELS = Object.freeze({ ONLINE: 'Online', HYBRID: 'Hybrid' });

/** One event in the day-by-day agenda: when, what, who and where. */
export default function EventAgendaRow({ item, href }) {
  const isHackathon = item.category === 'hackathons';
  const formatLabel = FORMAT_LABELS[String(item.format || '').toUpperCase()];
  const status = liveStatus(item);
  const statusLabel = status === 'live' || status === 'soon' ? LIVE_STATUS_LABELS[status] : null;

  return (
    <li className="ds-row">
      <Link to={href} className="ds-row__link">
        <span className="ds-row__time">{runningUntilLabel(item) || formatTimeRange(item)}</span>
        <span className="ds-row__media" aria-hidden="true">
          <ListingThumb item={item} />
        </span>
        <span className="ds-row__copy">
          <span className="ds-row__kicker">
            {statusLabel ? (
              <span className={`ds-row__status ds-row__status--${status}`}>{statusLabel}</span>
            ) : null}
            <NewListingBadge item={item} className="new-listing-badge--inline" />
            <span className={isHackathon ? 'ds-row__type ds-row__type--hackathon' : 'ds-row__type'}>
              {isHackathon ? 'Hackathon' : eventTopicLabel(item)}
            </span>
            {formatLabel ? <span className="ds-row__format">{formatLabel}</span> : null}
          </span>
          <strong className="ds-row__title">{item.title}</strong>
          <span className="ds-row__meta">
            {item.organizer ? <span>{item.organizer}</span> : null}
            <span>{eventLocation(item)}</span>
          </span>
        </span>
        <ChevronRightIcon className="ds-row__chevron" aria-hidden="true" />
      </Link>
    </li>
  );
}
