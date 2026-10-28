import { useState } from 'react';
import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

import NewListingBadge from '../common/NewListingBadge';
import AddToCalendar from './AddToCalendar';
import { formatOpportunityDate, opportunityScope } from '../../lib/discovery/opportunityDetail';
import { deadlineStatus } from '../../lib/discovery/programFormat';

function HeroMeta({ icon, children }) {
  return (
    <span className="opportunity-detail__hero-meta-item">
      <span className="opportunity-detail__hero-meta-icon" aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </span>
  );
}

function opportunityHeroSummary(item, typeLabel) {
  const fallback = item.organizer
    ? `${typeLabel} presented by ${item.organizer}.`
    : `A curated ${typeLabel.toLowerCase()} from the Blau Tech community.`;
  const summary = String(item.description || fallback).replace(/\s+/g, ' ').trim();
  if (summary.length <= 220) return summary;
  return `${summary.slice(0, 217).replace(/\s+\S*$/, '')}…`;
}

export default function OpportunityHero({ item, kind, typeLabel, backPath, fallbackImage }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = item.imageUrl && !imageFailed ? item.imageUrl : fallbackImage;
  const dateLabel = kind === 'programs'
    ? deadlineStatus(item)
    : formatOpportunityDate(item.date, { includeWeekday: false });
  const placeLabel = opportunityScope(item)
    || (String(item.format || '').toUpperCase() === 'ONLINE' ? 'Online' : 'Location to be announced');
  const summary = opportunityHeroSummary(item, typeLabel);
  const actionLabel = kind === 'programs' ? 'View official page' : 'View original listing';

  return (
    <header className="opportunity-detail__hero">
      <img
        className="opportunity-detail__hero-image"
        src={imageSource}
        alt=""
        width="1600"
        height="1000"
        loading="eager"
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
      />
      <span className="opportunity-detail__hero-blur" aria-hidden="true" />
      <span className="opportunity-detail__hero-shade" aria-hidden="true" />

      <div className="opportunity-detail__hero-copy">
        <a className="opportunity-detail__back" href={backPath}>← Back to {kind}</a>
        <h1>{item.title}</h1>
        <p className="opportunity-detail__hero-byline">
          <NewListingBadge item={item} className="new-listing-badge--inline" />
          {item.organizer ? `Presented by ${item.organizer}` : 'Published on Blau Tech'}
        </p>
        <div className="opportunity-detail__hero-meta" aria-label={`${typeLabel} summary`}>
          <HeroMeta icon={<CalendarDaysIcon />}>{dateLabel}</HeroMeta>
          <HeroMeta icon={<MapPinIcon />}>{placeLabel}</HeroMeta>
        </div>
        <span className="opportunity-detail__hero-divider" aria-hidden="true" />
        <p className="opportunity-detail__hero-summary">{summary}</p>
        <div className="opportunity-detail__hero-actions">
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="opportunity-detail__hero-action"
            >
              {actionLabel}
              <ArrowUpRightIcon aria-hidden="true" />
            </a>
          ) : (
            <a href="#opportunity-details" className="opportunity-detail__hero-action">Explore details</a>
          )}
          <AddToCalendar item={item} variant="hero" />
        </div>
      </div>
    </header>
  );
}
