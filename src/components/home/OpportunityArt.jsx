import { useRef } from 'react';
import gsap from 'gsap';

import ListingThumb from '../discover/showcase/ListingThumb';
import useInViewOnce from '../discover/showcase/useInViewOnce';
import useLoopWhileVisible from '../partners/useLoopWhileVisible';
import { WEEK_STACK_LIMIT } from '../../lib/discovery/homeShowcase';

const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const HACKATHON_PLACEHOLDERS = Object.freeze([1, 2, 3].map((id) => ({
  id: `placeholder-${id}`,
  source: 'placeholder',
  category: 'hackathons',
  imageUrl: '/assets/nav-community/hackathon-pulse.jpg',
})));

function formatShortDate(value) {
  const parsed = value ? new Date(`${value}T00:00:00`) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? shortDate.format(parsed) : '';
}

const itemKey = (item) => `${item.source}-${item.id}`;

/* Events: the coming week, each day stacked with what is on. A plate walks
   across the days and lights each one up in turn. */

function weekTimeline(root) {
  const q = gsap.utils.selector(root);
  const plate = q('.ho-week__plate')[0];
  const days = q('.ho-week__day');
  const light = (index) => days.forEach((day, dayIndex) => day.classList.toggle('is-active', dayIndex === index));
  const timeline = gsap.timeline({ repeat: -1 })
    .set(plate, { xPercent: 0, autoAlpha: 1 })
    .call(light, [0])
    .addLabel('hold');

  for (let index = 1; index < days.length; index += 1) {
    timeline
      .to(plate, { xPercent: index * 100, duration: 0.5, ease: 'power2.inOut' }, '+=1.1')
      .call(light, [index], '<0.2');
  }

  return timeline
    .to(plate, { autoAlpha: 0, duration: 0.35 }, '+=1.1')
    .set(plate, { xPercent: 0 })
    .call(light, [0])
    .to(plate, { autoAlpha: 1, duration: 0.35 });
}

export function EventWeekArt({ week }) {
  const scope = useRef(null);
  const inView = useInViewOnce(scope);
  const dataKey = week.map((day) => `${day.key}:${day.items.length}`).join('|');
  useLoopWhileVisible(scope, weekTimeline, [dataKey]);

  return (
    <div ref={scope} className={`ho-art ho-week${inView ? ' is-in' : ''}`} aria-hidden="true">
      <span className="ho-week__plate" />
      <ol className="ho-week__days">
        {week.map((day) => {
          const overflow = day.items.length - WEEK_STACK_LIMIT;
          return (
            <li key={day.key} className="ho-week__day" style={{ '--i': day.index }}>
              <span className="ho-week__stack">
                {day.items.length === 0 ? <span className="ho-week__empty" /> : null}
                {day.items.slice(0, WEEK_STACK_LIMIT).map((item, stackIndex) => (
                  <span key={itemKey(item)} className="ho-week__thumb" style={{ '--s': stackIndex }}>
                    <ListingThumb item={item} />
                  </span>
                ))}
                {overflow > 0 ? <span className="ho-week__more">+{overflow}</span> : null}
              </span>
              <span className="ho-week__weekday">
                {day.index === 0 ? 'Today' : day.date.toLocaleDateString('en-GB', { weekday: 'short' })}
              </span>
              <span className="ho-week__date">{day.date.getDate()}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* Hackathons: a deck of the next hackathons. The front card is dealt away
   and the rest move up, so every upcoming hackathon gets its turn. */

const DECK_POSES = Object.freeze([
  { x: 0, y: 0, rotation: -2, scale: 1, autoAlpha: 1 },
  { x: 26, y: -14, rotation: 4, scale: 0.94, autoAlpha: 1 },
  { x: 50, y: -26, rotation: 9, scale: 0.88, autoAlpha: 1 },
  { x: 70, y: -36, rotation: 13, scale: 0.82, autoAlpha: 0 },
]);
const DECK_HOLD = 2.2;
const DECK_MOVE = 0.7;

function deckTimeline(root) {
  const cards = gsap.utils.selector(root)('.ho-deck__card');
  const count = cards.length;
  // GSAP owns the transform, so the centring lives here rather than in CSS.
  const pose = (slot) => ({
    ...DECK_POSES[Math.min(slot, DECK_POSES.length - 1)], xPercent: -50, yPercent: -50, zIndex: count - slot,
  });
  const timeline = gsap.timeline({ repeat: count > 1 ? -1 : 0 });

  cards.forEach((card, index) => timeline.set(card, pose(index), 0));
  timeline.addLabel('hold');
  if (count < 2) return timeline;

  for (let step = 0; step < count; step += 1) {
    const at = step * (DECK_HOLD + DECK_MOVE) + DECK_HOLD;
    timeline.to(cards[step], {
      x: -90, y: 18, rotation: -14, autoAlpha: 0, duration: DECK_MOVE, ease: 'power2.in',
    }, at);
    cards.forEach((card, index) => {
      if (index === step) return;
      const slot = (index - step - 1 + count) % count;
      timeline.to(card, { ...pose(slot), duration: DECK_MOVE, ease: 'power2.inOut' }, at);
    });
    timeline
      .set(cards[step], { ...pose(count - 1), autoAlpha: 0 }, at + DECK_MOVE)
      .to(cards[step], { autoAlpha: DECK_POSES[Math.min(count - 1, DECK_POSES.length - 1)].autoAlpha, duration: 0.4 }, at + DECK_MOVE);
  }

  return timeline;
}

export function HackathonDeckArt({ deck }) {
  const scope = useRef(null);
  const cards = deck.length ? deck : HACKATHON_PLACEHOLDERS;
  useLoopWhileVisible(scope, deckTimeline, [cards.map(itemKey).join('|')]);

  return (
    <div ref={scope} className="ho-art ho-deck" aria-hidden="true">
      {cards.map((item) => (
        <article key={itemKey(item)} className="ho-deck__card">
          <ListingThumb item={item} />
          {item.title ? (
            <span className="ho-deck__caption">
              <small>{formatShortDate(item.date)}</small>
              <strong>{item.title}</strong>
            </span>
          ) : null}
        </article>
      ))}
    </div>
  );
}

/* Programs: the nearest application deadlines on a line that starts today.
   A signal runs along it and each program pings as the signal passes. */

function daysLabel(days) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
}

export function ProgramRunwayArt({ marks }) {
  const scope = useRef(null);
  const inView = useInViewOnce(scope);
  useLoopWhileVisible(scope, null);

  return (
    <div ref={scope} className={`ho-art ho-runway${inView ? ' is-in' : ''}`} aria-hidden="true">
      <div className="ho-runway__track">
        <span className="ho-runway__line" />
        <span className="ho-runway__signal"><i /></span>
        <span className="ho-runway__today">Today</span>
        {marks.map(({ item, days, position, lane }, index) => (
          <span
            key={itemKey(item)}
            className={`ho-runway__pin ho-runway__pin--lane-${lane}`}
            style={{ '--x': position, '--i': index }}
          >
            <span className="ho-runway__thumb"><ListingThumb item={item} /></span>
            <small>{daysLabel(days)}</small>
          </span>
        ))}
      </div>
    </div>
  );
}
