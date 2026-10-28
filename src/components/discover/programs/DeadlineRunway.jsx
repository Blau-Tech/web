import { useRef } from 'react';

import NewListingBadge from '../../common/NewListingBadge';
import { deadlineStatus, deadlineUrgency, formatDeadline } from '../../../lib/discovery/programFormat';
import { Link } from '../../../lib/router';
import ListingThumb from '../showcase/ListingThumb';
import useInViewOnce from '../showcase/useInViewOnce';

/**
 * Upcoming application deadlines laid out on a real calendar line: today on
 * the left, each program pinned where its applications close.
 */
export default function DeadlineRunway({ runway, getHref }) {
  const scope = useRef(null);
  const inView = useInViewOnce(scope);

  return (
    <div ref={scope} className={`ds-runway${inView ? ' is-in' : ''}`}>
      <ol className="ds-runway__marks">
        {runway.marks.map(({ item, position, lane }, index) => (
          <li
            key={`${item.source}-${item.id}`}
            className={`ds-runway__mark${position > 66 ? ' ds-runway__mark--end' : ''}`}
            style={{ '--x': `${position}%`, '--lane': lane, '--i': index }}
          >
            <Link to={getHref(item)} className="ds-runway__card">
              <span className="ds-runway__thumb" aria-hidden="true"><ListingThumb item={item} /></span>
              <span className="ds-runway__copy">
                <NewListingBadge item={item} className="new-listing-badge--inline" />
                <strong>{item.title}</strong>
                <small className={`ds-urgency ds-urgency--${deadlineUrgency(item)}`}>
                  {deadlineStatus(item)}
                  <span> · {formatDeadline(item.date, { compact: true, includeYear: false })}</span>
                </small>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="ds-runway__track" aria-hidden="true">
        <span className="ds-runway__line" />
        <span className="ds-runway__today">Today</span>
        {runway.ticks.map((tick) => (
          <span key={tick.key} className="ds-runway__tick" style={{ '--x': `${tick.position}%` }}>{tick.label}</span>
        ))}
      </div>
    </div>
  );
}
