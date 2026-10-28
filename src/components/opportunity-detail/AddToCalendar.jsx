import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDaysIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

import {
  calendarEntry,
  googleCalendarUrl,
  icsDocument,
  icsFileName,
  outlookCalendarUrl,
} from '../../lib/discovery/calendarExport';
import '../../styles/add-to-calendar.css';

const MENU_GAP = 8;
const MENU_WIDTH = 232;

function downloadIcs(entry, item) {
  const blob = new Blob([icsDocument([entry])], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = icsFileName(item);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * "Add to calendar" for a listing: Google and Outlook open prefilled, Apple
 * Calendar and everything else take the .ics file. Program deadlines arrive as
 * an all-day entry with a reminder three days before.
 */
export default function AddToCalendar({ item, variant = 'inline' }) {
  const entry = useMemo(() => calendarEntry(item), [item]);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const isProgram = item?.category === 'programs';

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // The hero clips its overflow, so the menu is portalled and pinned to the trigger.
  const place = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight || 200;
    const fitsBelow = rect.bottom + MENU_GAP + menuHeight <= window.innerHeight;
    setPosition({
      left: Math.min(Math.max(12, rect.left), window.innerWidth - MENU_WIDTH - 12),
      top: fitsBelow ? rect.bottom + MENU_GAP : Math.max(12, rect.top - MENU_GAP - menuHeight),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus({ preventScroll: true });

    const onPointerDown = (event) => {
      if (menuRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) return;
      close();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const items = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])];
      const index = items.indexOf(document.activeElement);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      event.preventDefault();
      items[(index + step + items.length) % items.length]?.focus();
    };
    const onViewportChange = () => place();

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [close, open, place]);

  if (!entry) return null;

  const label = isProgram ? 'Remind me' : 'Add to calendar';
  const options = [
    { key: 'google', label: 'Google Calendar', href: googleCalendarUrl(entry) },
    { key: 'apple', label: 'Apple Calendar', onSelect: () => downloadIcs(entry, item) },
    { key: 'outlook', label: 'Outlook', href: outlookCalendarUrl(entry) },
    { key: 'ics', label: 'Download .ics file', onSelect: () => downloadIcs(entry, item), quiet: true },
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`add-to-calendar add-to-calendar--${variant}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <CalendarDaysIcon aria-hidden="true" />
        {label}
        <ChevronDownIcon className="add-to-calendar__chevron" aria-hidden="true" />
      </button>

      {open ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className="add-to-calendar__menu"
          style={{
            width: MENU_WIDTH,
            left: position?.left ?? -9999,
            top: position?.top ?? -9999,
          }}
        >
          {isProgram ? (
            <p className="add-to-calendar__caption">The deadline, with a reminder three days before.</p>
          ) : null}
          {options.map((option) => (option.href ? (
            <a
              key={option.key}
              role="menuitem"
              href={option.href}
              target="_blank"
              rel="noopener noreferrer"
              className="add-to-calendar__item"
              onClick={() => close()}
            >
              {option.label}
            </a>
          ) : (
            <button
              key={option.key}
              type="button"
              role="menuitem"
              className={`add-to-calendar__item${option.quiet ? ' add-to-calendar__item--quiet' : ''}`}
              onClick={() => { option.onSelect(); close(true); }}
            >
              {option.label}
            </button>
          )))}
        </div>,
        document.body,
      ) : null}
    </>
  );
}
