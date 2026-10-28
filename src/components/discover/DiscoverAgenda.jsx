import {
  ArrowUpRightIcon,
  BuildingOffice2Icon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

import NewListingBadge from '../common/NewListingBadge';
import { parseDate } from '../../lib/discovery/discover';
import DiscoverArtwork from './DiscoverArtwork';
import MetaItem from './MetaItem';

const CATEGORY_STYLES = {
  events: {
    rail: 'discover-agenda-accent',
    dot: 'discover-agenda-accent',
    fallback: 'discover-agenda-fallback',
  },
  hackathons: {
    rail: 'discover-agenda-accent',
    dot: 'discover-agenda-accent',
    fallback: 'discover-agenda-fallback',
  },
  programs: {
    rail: 'discover-agenda-accent',
    dot: 'discover-agenda-accent',
    fallback: 'discover-agenda-fallback',
  },
};

function isSameDay(first, second) {
  return first
    && second
    && first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function AgendaDateBadge({ date, today }) {
  return (
    <div className="discover-agenda-date">
      <span className="discover-agenda-marker" aria-hidden />
      <span>
        <span className="discover-agenda-date-label">
          {date
            ? isSameDay(date, today)
              ? 'Today'
              : date.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })
            : 'Date TBA'}
        </span>
        {date && (
          <span className="discover-agenda-weekday">
            {date.toLocaleDateString('en-GB', { weekday: 'long' })}
          </span>
        )}
      </span>
    </div>
  );
}

function AgendaCard({ item, date, today, onClick, renderItemAction }) {
  const categoryStyle = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.events;
  const tag = item.tag ?? item.category;
  const startTime = item.time ? String(item.time).slice(0, 5) : null;
  const endTime = item.endTime ? String(item.endTime).slice(0, 5) : null;
  const time = startTime && endTime && startTime !== endTime
    ? `${startTime} – ${endTime}`
    : startTime || (endTime ? `Until ${endTime}` : 'Time TBA');
  const location =
    item.location
    ?? (item.format === 'ONLINE' || item.format === 'online' ? 'Online' : null);

  const action = renderItemAction?.(item);

  return (
    <article className="discover-agenda-card group">
      <DiscoverArtwork
        imageUrl={item.imageUrl}
        category={item.category}
        label={tag}
        fallbackClassName={categoryStyle.fallback}
      />
      <span className="discover-agenda-image-wash pointer-events-none" aria-hidden />
      <AgendaDateBadge date={date} today={today} />
      <button
        type="button"
        onClick={() => onClick(item)}
        className="discover-agenda-details absolute inset-0 z-[2] rounded-[inherit]"
        aria-label={`View details for ${item.title}`}
      />
      {action && (
        <span className="discover-agenda-action absolute z-10">
          {action}
        </span>
      )}
      <span className="discover-agenda-glass pointer-events-none relative z-[1] min-w-0 text-left">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <NewListingBadge item={item} />
          <span className="discover-agenda-time">
            {time}
          </span>
          {tag && (
            <span className="discover-agenda-tag">
              <span className={`h-1.5 w-1.5 rounded-full ${categoryStyle.dot}`} aria-hidden />
              {tag}
            </span>
          )}
        </span>

        <span className="discover-agenda-title">
          {item.title}
        </span>

        <span className="discover-agenda-meta">
          <MetaItem className="discover-agenda-meta-item" icon={BuildingOffice2Icon}>{item.organizer}</MetaItem>
          <MetaItem className="discover-agenda-meta-item" icon={MapPinIcon}>{location}</MetaItem>
        </span>

        <span className="discover-agenda-open" aria-hidden>
          <ArrowUpRightIcon className="h-4 w-4" />
        </span>
      </span>
    </article>
  );
}

const DiscoverAgenda = ({ items, onItemClick, renderItemAction }) => {
  const today = new Date();

  return (
    <div className="discover-agenda" aria-label="Opportunity agenda">
      {items.map((item) => (
        <AgendaCard
          key={`${item.source}-${item.id}`}
          item={item}
          date={parseDate(item.date)}
          today={today}
          onClick={onItemClick}
          renderItemAction={renderItemAction}
        />
      ))}
    </div>
  );
};

export default DiscoverAgenda;
