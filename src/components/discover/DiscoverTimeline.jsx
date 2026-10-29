import { useMemo } from 'react';
import {
  ArrowUpRightIcon,
  BuildingOffice2Icon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

import NewListingBadge from '../common/NewListingBadge';
import { parseDate } from '../../lib/discovery/discover';
import DiscoverArtwork from './DiscoverArtwork';
import MetaItem from './MetaItem';

function timelineDateKey(date) {
  if (!date) return 'undated';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function isSameDay(first, second) {
  return first
    && second
    && first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function getDateLabel(date, today) {
  if (!date) return { label: 'Date TBA', sublabel: 'To be announced' };

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const label = isSameDay(date, today)
    ? 'Today'
    : isSameDay(date, tomorrow)
      ? 'Tomorrow'
      : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return {
    label,
    sublabel: date.toLocaleDateString('en-GB', { weekday: 'long' }),
  };
}

function groupTimelineItems(items) {
  const sortedItems = [...items].sort((first, second) => {
    const firstDate = parseDate(first.date);
    const secondDate = parseDate(second.date);
    if (!firstDate && !secondDate) return String(first.time ?? '').localeCompare(String(second.time ?? ''));
    if (!firstDate) return 1;
    if (!secondDate) return -1;

    const dateDifference = firstDate.getTime() - secondDate.getTime();
    return dateDifference || String(first.time ?? '').localeCompare(String(second.time ?? ''));
  });

  const groups = new Map();

  sortedItems.forEach((item) => {
    const date = parseDate(item.date);
    const key = timelineDateKey(date);
    const group = groups.get(key) ?? { key, date, items: [] };
    group.items.push(item);
    groups.set(key, group);
  });

  return [...groups.values()];
}

function TimelineCard({ item, onClick, renderItemAction }) {
  const tag = item.tag ?? item.category;
  const location = item.location
    ?? (String(item.format).toLowerCase() === 'online' ? 'Online' : null);
  const action = renderItemAction?.(item);

  return (
    <article className="discover-timeline-card">
      <DiscoverArtwork
        imageUrl={item.imageUrl}
        fallbackClassName="discover-agenda-fallback"
      />
      <span className="discover-timeline-image-wash pointer-events-none" aria-hidden />
      <button
        type="button"
        onClick={() => onClick(item)}
        className="absolute inset-0 z-[2] rounded-[inherit]"
        aria-label={`View details for ${item.title}`}
      />
      {action && (
        <span className="discover-timeline-action absolute z-10">
          {action}
        </span>
      )}
      <span className="discover-timeline-glass pointer-events-none relative z-[3] min-w-0">
        <NewListingBadge item={item} className="new-listing-badge--stacked" />
        <span className="discover-timeline-tag">
          <span className="discover-timeline-tag-dot" aria-hidden />
          {tag || 'Opportunity'}
        </span>
        <span className="discover-timeline-title">{item.title}</span>
        <span className="discover-timeline-meta">
          <MetaItem className="discover-timeline-meta-item" icon={BuildingOffice2Icon}>{item.organizer}</MetaItem>
          <MetaItem className="discover-timeline-meta-item" icon={MapPinIcon}>{location}</MetaItem>
        </span>
        <span className="discover-timeline-open" aria-hidden>
          <ArrowUpRightIcon className="h-4 w-4" />
        </span>
      </span>
    </article>
  );
}

const DiscoverTimeline = ({ items, onItemClick, renderItemAction }) => {
  const groups = useMemo(() => groupTimelineItems(items), [items]);
  const today = useMemo(() => new Date(), []);

  return (
    <div className="discover-timeline" aria-label="Opportunity timeline">
      {groups.map((group) => {
        const dateLabel = getDateLabel(group.date, today);

        return (
          <section className="discover-timeline-day" key={group.key}>
            <header className="discover-timeline-date">
              <span className="discover-timeline-date-label">{dateLabel.label}</span>
              <span className="discover-timeline-weekday">{dateLabel.sublabel}</span>
            </header>

            <div className="discover-timeline-events">
              {group.items.map((item) => (
                <div className="discover-timeline-event" key={`${item.source}-${item.id}`}>
                  <span className="discover-timeline-node" aria-hidden />
                  <TimelineCard
                    item={item}
                    onClick={onItemClick}
                    renderItemAction={renderItemAction}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default DiscoverTimeline;
