import { useState } from 'react';
import { ArrowLeftIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';

import NewListingBadge from '../common/NewListingBadge';
import AddToCalendar from './AddToCalendar';
import {
  formatOpportunityDate,
  formatOpportunityTime,
  opportunityScope,
} from '../../lib/discovery/opportunityDetail';
import { deadlineStatus } from '../../lib/discovery/programFormat';
import { Link } from '../../lib/router';
import '../../styles/hero-nav.css';

/**
 * The top of a listing's page, flush under the clear nav: the listing's own picture runs blurred behind
 * Navy, and once more in a frame, whole, beside the title.
 */
export default function OpportunityHero({ item, kind, typeLabel, backPath }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = item.imageUrl && !imageFailed ? item.imageUrl : null;
  const kicker = [typeLabel, opportunityScope(item)].filter(Boolean).join(' · ');
  const when = kind === 'programs'
    ? deadlineStatus(item)
    : [
      formatOpportunityDate(item.date, { includeWeekday: false }),
      item.time ? formatOpportunityTime(item.time) : null,
    ].filter(Boolean).join(' · ');
  const actionLabel = kind === 'programs' ? 'View official page' : 'View original listing';
  const imageProps = {
    src: imageSource,
    alt: '',
    referrerPolicy: 'no-referrer',
    onError: () => setImageFailed(true),
  };

  return (
    <header className="opportunity-detail__hero">
      {imageSource ? (
        <img className="opportunity-detail__hero-backdrop" {...imageProps} loading="eager" aria-hidden="true" />
      ) : null}

      <div className="opportunity-detail__shell opportunity-detail__hero-inner">
        <div className="opportunity-detail__hero-copy">
          <Link to={backPath} className="opportunity-detail__back">
            <ArrowLeftIcon strokeWidth={2} aria-hidden="true" />
            Back to {kind}
          </Link>
          <p className="opportunity-detail__kicker">
            <NewListingBadge item={item} />
            {kicker}
          </p>
          <h1>{item.title}</h1>
          <p className="opportunity-detail__byline">
            {item.organizer ? `Presented by ${item.organizer}` : 'Published on Blau Tech'}
          </p>
          <p className="opportunity-detail__when">{when}</p>
          <div className="opportunity-detail__hero-actions">
            {item.link ? (
              <a href={item.link} target="_blank" rel="noreferrer" className="opportunity-detail__hero-action">
                {actionLabel}
                <ArrowUpRightIcon strokeWidth={2} aria-hidden="true" />
              </a>
            ) : (
              <a href="#opportunity-details" className="opportunity-detail__hero-action">Explore details</a>
            )}
            <AddToCalendar item={item} variant="hero" />
          </div>
        </div>

        {imageSource ? (
          <figure className="opportunity-detail__frame" aria-hidden="true">
            <img className="opportunity-detail__frame-fill" {...imageProps} loading="eager" />
            <img className="opportunity-detail__frame-image" {...imageProps} loading="eager" />
          </figure>
        ) : null}
      </div>
    </header>
  );
}
