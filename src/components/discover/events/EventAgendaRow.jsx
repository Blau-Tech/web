import NewListingBadge from '../../common/NewListingBadge';
import { eventLocation, eventTopicLabel } from '../../../lib/discovery/eventFormat';
import { formatTimeRange } from '../../../lib/discovery/eventAgenda';
import { LIVE_STATUS_LABELS, liveStatus, runningUntilLabel } from '../../../lib/discovery/liveStatus';
import { Link } from '../../../lib/router';
import ListingThumb from '../showcase/ListingThumb';

const FORMAT_LABELS = Object.freeze({ ONLINE: 'Online', HYBRID: 'Hybrid' });

/** One event in the day-by-day agenda: the flyer, what it is, who runs it, where and when. */
export default function EventAgendaRow({ item, href }) {
  const isHackathon = item.category === 'hackathons';
  const formatLabel = FORMAT_LABELS[String(item.format || '').toUpperCase()];
  const status = liveStatus(item);
  const statusLabel = status === 'live' || status === 'soon' ? LIVE_STATUS_LABELS[status] : null;
  const kicker = [isHackathon ? 'Hackathon' : eventTopicLabel(item), formatLabel].filter(Boolean).join(' · ');

  return (
    <li>
      <Link to={href} className="ds-row">
        <span className="ds-row__media" aria-hidden="true">
          <ListingThumb item={item} />
        </span>
        <span className="ds-row__copy">
          <span className="ds-row__kicker">
            <NewListingBadge item={item} />
            {statusLabel ? <span className={`ds-row__status ds-row__status--${status}`}>{statusLabel}</span> : null}
            <span>{kicker}</span>
          </span>
          <strong className="ds-row__title">{item.title}</strong>
          <span className="ds-row__meta">
            {[item.organizer, eventLocation(item)].filter(Boolean).join(' · ')}
          </span>
        </span>
        <span className="ds-row__time">{runningUntilLabel(item) || formatTimeRange(item)}</span>
      </Link>
    </li>
  );
}
