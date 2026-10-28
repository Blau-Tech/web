import { useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';

import NewListingBadge from '../common/NewListingBadge';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_STYLES = {
  events: {
    event: 'discover-calendar-event--accent',
  },
  hackathons: {
    event: 'discover-calendar-event--accent',
  },
  programs: {
    event: 'discover-calendar-event--accent',
  },
};

function parseItemDate(value) {
  if (!value) return null;
  const text = String(value).trim();

  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(text)) {
    const [year, month, day] = text.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    const [day, month, year] = text.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function startOfWeek(value) {
  const date = new Date(value);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildMonthDays(anchorDate) {
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function buildWeekDays(anchorDate) {
  const weekStart = startOfWeek(anchorDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
}

function isSameDay(first, second) {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function formatPeriod(anchorDate, mode) {
  if (mode === 'month') {
    return anchorDate.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
  }

  const start = startOfWeek(anchorDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}-${end.getDate()} ${end.toLocaleDateString('en-GB', { month: 'short' })} ${end.getFullYear()}`;
  }

  return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}-${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function formatItemTime(value) {
  return value ? String(value).slice(0, 5) : null;
}

function EventPill({ item, onClick, compact = false }) {
  const categoryStyle = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.events;
  const itemTime = formatItemTime(item.time);

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={[
        'discover-calendar-event w-full border-l-2 text-left',
        compact ? 'px-1.5 py-px' : 'px-2 py-1.5',
        categoryStyle.event,
      ].join(' ')}
      title={item.title}
    >
      <span className={`flex items-center gap-1.5 ${compact ? 'leading-none' : ''}`}>
        {/* The compact grid has no room for a badge beside a truncated title. */}
        {compact ? null : <NewListingBadge item={item} className="new-listing-badge--micro" />}
        {itemTime && (
          <span className="shrink-0 text-[9px] font-bold opacity-75">
            {itemTime}
          </span>
        )}
        <span className="truncate text-[10px] font-semibold sm:text-[11px]">
          {item.title}
        </span>
      </span>
    </button>
  );
}

function WeekEvent({ item, onClick }) {
  const categoryStyle = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.events;
  const itemTime = formatItemTime(item.time);

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={`discover-calendar-week-event w-full border-l-2 text-left ${categoryStyle.event}`}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="discover-calendar-week-event-time text-[10px] font-bold">
          {itemTime || 'TBA'}
        </span>
        <NewListingBadge item={item} className="new-listing-badge--micro" />
        <span className="discover-calendar-week-event-tag truncate text-[8px] font-bold uppercase tracking-[0.12em]">
          {item.tag || item.category}
        </span>
      </span>
      <span className="discover-calendar-week-event-title mt-1 block text-xs font-semibold leading-snug sm:text-[13px]">
        {item.title}
      </span>
    </button>
  );
}

function WeekSchedule({
  days,
  itemsByDate,
  today,
  onItemClick,
}) {
  return (
    <div
      className="discover-calendar-week-schedule"
      aria-label={`Opportunities for ${formatPeriod(days[0], 'week')}`}
    >
      {days.map((date) => {
        const dayItems = itemsByDate.get(dateKey(date)) ?? [];
        const isToday = isSameDay(date, today);

        return (
          <section
            key={dateKey(date)}
            className={[
              'discover-calendar-week-day',
              dayItems.length === 0 ? 'discover-calendar-week-day-empty' : '',
              isToday ? 'discover-calendar-week-day-today' : '',
            ].join(' ')}
            aria-label={date.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          >
            <div className="discover-calendar-week-date">
              <span className="discover-calendar-weekday text-[10px] font-semibold uppercase tracking-[0.16em]">
                {DAY_NAMES[(date.getDay() + 6) % 7]}
              </span>
              <span
                className={[
                  'mt-0.5 grid h-9 w-9 place-items-center rounded-full text-base font-semibold',
                  isToday ? 'discover-calendar-date-number--today' : 'discover-calendar-date-number',
                ].join(' ')}
              >
                {date.getDate()}
              </span>
              <span className="discover-calendar-month-label mt-0.5 text-[9px] font-medium uppercase tracking-wider">
                {date.toLocaleDateString('en-GB', { month: 'short' })}
              </span>
            </div>

            {dayItems.length > 0 ? (
              <div className="discover-calendar-week-events min-w-0 space-y-2">
                {dayItems.map((item) => (
                  <WeekEvent
                    key={`${item.source}-${item.id}`}
                    item={item}
                    onClick={onItemClick}
                  />
                ))}
              </div>
            ) : (
              <span className="discover-calendar-week-empty" aria-hidden>-</span>
            )}
          </section>
        );
      })}
    </div>
  );
}

const DiscoverCalendar = ({
  items,
  mode = 'month',
  onModeChange,
  onItemClick,
  onShowDay,
}) => {
  const today = useMemo(() => new Date(), []);
  const [anchorDate, setAnchorDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);

  const itemsByDate = useMemo(() => {
    const grouped = new Map();

    items.forEach((item) => {
      const parsedDate = parseItemDate(item.date);
      if (!parsedDate) return;
      const key = dateKey(parsedDate);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });

    grouped.forEach((dayItems, key) => {
      grouped.set(key, dayItems.sort((first, second) =>
        String(first.time ?? '').localeCompare(String(second.time ?? ''))));
    });

    return grouped;
  }, [items]);

  const visibleDays = useMemo(
    () => mode === 'week' ? buildWeekDays(anchorDate) : buildMonthDays(anchorDate),
    [anchorDate, mode],
  );

  const selectedItems = itemsByDate.get(dateKey(selectedDate)) ?? [];
  const changePeriod = (direction) => {
    const nextDate = new Date(anchorDate);
    if (mode === 'week') {
      nextDate.setDate(nextDate.getDate() + (direction * 7));
    } else {
      nextDate.setMonth(nextDate.getMonth() + direction, 1);
    }
    setAnchorDate(nextDate);
    setSelectedDate(nextDate);
  };

  return (
    <div>
      <div className="mb-0.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="discover-calendar-period text-xs font-semibold sm:text-sm">
          {formatPeriod(anchorDate, mode)}
        </h2>

        <div className="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            onClick={() => onModeChange?.(mode === 'month' ? 'week' : 'month')}
            className="btn-tertiary !h-8 !min-h-8 !px-2 !py-1 !text-xs"
            aria-label={mode === 'month' ? 'Switch to week view' : 'Switch to month view'}
          >
            {mode === 'month' ? (
              <>
              <ViewColumnsIcon className="h-3 w-3" aria-hidden />
                Week view
              </>
            ) : (
              <>
                <CalendarDaysIcon className="h-3 w-3" aria-hidden />
                Month view
              </>
            )}
          </button>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => changePeriod(-1)}
              className="btn-tertiary btn-icon !h-8 !min-h-8 !w-8"
              aria-label={`Previous ${mode}`}
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => changePeriod(1)}
              className="btn-tertiary btn-icon !h-8 !min-h-8 !w-8"
              aria-label={`Next ${mode}`}
            >
              <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {mode === 'week' ? (
        <WeekSchedule
          days={visibleDays}
          itemsByDate={itemsByDate}
          today={today}
          onItemClick={onItemClick}
        />
      ) : (
        <>
          <div className="hidden sm:block">
            <div className="mb-0.5 grid grid-cols-7">
              {DAY_NAMES.map((dayName) => (
                <div
                  key={dayName}
                  className="discover-calendar-weekday py-1 text-center text-[10px] font-semibold uppercase tracking-[0.12em]"
                >
                  {dayName}
                </div>
              ))}
            </div>

            <div
              className="discover-calendar-grid discover-calendar-grid-desktop grid grid-cols-7 gap-px"
              role="grid"
              aria-label={formatPeriod(anchorDate, mode)}
            >
              {visibleDays.map((date) => {
                const dayItems = itemsByDate.get(dateKey(date)) ?? [];
                const isToday = isSameDay(date, today);
                const isOutsideMonth = date.getMonth() !== anchorDate.getMonth();
                // Keep the month view readable on short laptop screens. The
                // day dialog still exposes every remaining opportunity.
                const visibleItems = dayItems.slice(0, 2);
                const hiddenItemCount = Math.max(0, dayItems.length - visibleItems.length);
                const dateLabel = date.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });

                return (
                  <div
                    key={dateKey(date)}
                    role="gridcell"
                    className={[
                      'discover-calendar-day',
                      isOutsideMonth ? 'discover-calendar-day-outside' : '',
                      isToday ? 'discover-calendar-day-today' : '',
                    ].join(' ')}
                  >
                    <div className="mb-px flex items-center justify-between gap-1">
                      <span
                        className={[
                          'grid h-5 w-5 shrink-0 place-items-center text-[11px] font-semibold',
                          isToday
                            ? 'discover-calendar-date-number--today rounded-full'
                            : isOutsideMonth
                              ? 'discover-calendar-date-number--outside'
                              : 'discover-calendar-date-number',
                        ].join(' ')}
                      >
                        {date.getDate()}
                      </span>
                      {hiddenItemCount > 0 && (
                        <button
                          type="button"
                          onClick={() => onShowDay?.({
                            date: dateKey(date),
                            items: dayItems,
                          })}
                          className="discover-calendar-more inline-flex min-h-5 shrink-0 items-center px-1 text-[9px] font-semibold leading-none underline-offset-2 transition hover:underline focus-visible:outline-hidden focus-visible:ring-2"
                          aria-label={`View all ${dayItems.length} opportunities on ${dateLabel}`}
                        >
                          +{hiddenItemCount}
                          <span className="hidden md:inline">&nbsp;more</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-px">
                      {visibleItems.map((item) => (
                        <EventPill
                          key={`${item.source}-${item.id}`}
                          item={item}
                          onClick={onItemClick}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sm:hidden">
            <div className="mb-2 grid grid-cols-7">
              {DAY_NAMES.map((dayName) => (
                <span
                  key={dayName}
                  className="discover-calendar-weekday py-1 text-center text-[10px] font-semibold uppercase tracking-wider"
                >
                  {dayName.slice(0, 1)}
                </span>
              ))}
            </div>

            <div className="discover-calendar-grid grid grid-cols-7 gap-px">
              {visibleDays.map((date) => {
                const dayItems = itemsByDate.get(dateKey(date)) ?? [];
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);
                const isOutsideMonth = date.getMonth() !== anchorDate.getMonth();

                return (
                  <button
                    key={dateKey(date)}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={[
                      'discover-calendar-mobile-day',
                      isSelected ? 'discover-calendar-mobile-day-selected' : '',
                      isOutsideMonth ? 'opacity-40' : '',
                    ].join(' ')}
                    aria-pressed={isSelected}
                    aria-label={date.toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  >
                    <span className={isToday ? 'discover-calendar-mobile-today' : ''}>{date.getDate()}</span>
                    {dayItems.length > 0 && (
                      <span className="discover-calendar-mobile-dot h-1 w-1 rounded-full" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <p className="discover-calendar-selected-date text-xs font-semibold uppercase tracking-[0.16em]">
                {selectedDate.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <div className="mt-2 space-y-2">
                {selectedItems.length > 0 ? (
                  selectedItems.map((item) => (
                    <EventPill
                      key={`${item.source}-${item.id}`}
                      item={item}
                      onClick={onItemClick}
                    />
                  ))
                ) : (
                  <p className="body-subtle py-3">No opportunities on this day.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DiscoverCalendar;
