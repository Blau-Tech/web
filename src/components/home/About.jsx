import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Laptop, Riffle, Terminal } from '@lucasmarkes/hairline/react';
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

import { useCity } from '../../lib/city/cityContext';
import { CENTRAL_LINKEDIN_URL, FALLBACK_WHATSAPP_URL, hasPrograms } from '../../lib/city/cityConfig';
import { upcomingEvents } from '../../lib/discovery/eventAgenda';
import { homeShowcase } from '../../lib/discovery/homeShowcase';
import { opportunityDetailPath } from '../../lib/discovery/opportunityDetail';
import { fetchDiscoveryItems, filterMemberDiscoveryItems } from '../../lib/member/memberDiscovery';
import { NEWSLETTER_ENABLED, openNewsletter } from '../../lib/newsletter';
import { Link, useLocation, useNavigate } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import SectionHeading from '../common/SectionHeading';
import { EnvelopeIcon as EnvelopeSolidIcon } from '@heroicons/react/24/solid';
import { LinkedInIcon, WhatsAppIcon } from './BrandIcons';
import { ProgramRunwayArt } from './OpportunityArt';
import '../../styles/home-sections.css';

const CONTACT_MAILTO = 'mailto:partner@blau-tech.de';


const photoUrl = (name) => `/assets/home-bento/${name}.jpg`;

/* Photos fill two squares of the left column and the two tall tiles; without programs a wide one fills the programs slot.
   Three of them are galleries: the spare photos wait off stage, and a tile that turns over swaps its photo for one
   of them, so no photo is ever on show twice. */
const POSITIONS = Object.freeze({
  room: '42% 58%',
  talk: '50% 40%',
  circle: '54% 50%',
  portrait: '50% 22%',
  desk: '30% 50%',
  hands: '50% 50%',
});
const STILL_TILE = Object.freeze({ current: 'talk', leaving: null, swiped: false });
const GALLERY_START = Object.freeze({ a: 'room', c: 'circle', d: 'portrait' });
const SPARE_PHOTOS = Object.freeze(['desk', 'hands']);
const WIDE_PHOTO = 'desk';

/* Each tile has its own run of hold times, which it repeats, so the three never fall into step and the eye
   cannot learn when the next one is coming. */
const GALLERY_SWIPE_MS = 800;
const GALLERY_HOLDS_MS = Object.freeze({
  a: Object.freeze([5000, 7500, 6000]),
  c: Object.freeze([8000, 5500, 9000, 6500]),
  d: Object.freeze([6500, 9500, 5000]),
});

const galleryReducer = (state, action) => {
  const tile = state.tiles[action.key];
  if (action.type === 'swipe') {
    const next = state.spares.find((name) => name !== action.blocked);
    if (!next) return state;
    return {
      spares: state.spares.filter((name) => name !== next),
      tiles: { ...state.tiles, [action.key]: { current: next, leaving: tile.current, swiped: true } },
    };
  }
  // Once it is off the right edge, the old photo goes back to the spares.
  if (!tile.leaving) return state;
  return {
    spares: [...state.spares, tile.leaving],
    tiles: { ...state.tiles, [action.key]: { ...tile, leaving: null } },
  };
};

/* `blocked` is a spare that is already on show elsewhere (the wide tile) and so must not be swapped in. */
const useGalleries = (blocked) => {
  const [state, dispatch] = useReducer(galleryReducer, null, () => ({
    spares: [...SPARE_PHOTOS],
    tiles: Object.fromEntries(Object.entries(GALLERY_START).map(([key, name]) => [key, { current: name, leaving: null, swiped: false }])),
  }));
  const blockedRef = useRef(blocked);
  useEffect(() => { blockedRef.current = blocked; }, [blocked]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timers = new Set();
    const later = (run, ms) => {
      const id = setTimeout(() => { timers.delete(id); run(); }, ms);
      timers.add(id);
    };
    Object.entries(GALLERY_HOLDS_MS).forEach(([key, holds]) => {
      const turn = (count) => {
        dispatch({ type: 'swipe', key, blocked: blockedRef.current });
        later(() => dispatch({ type: 'settle', key }), GALLERY_SWIPE_MS);
        later(() => turn(count + 1), GALLERY_SWIPE_MS + holds[(count + 1) % holds.length]);
      };
      later(() => turn(0), holds[0]);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return state.tiles;
};

const Photo = ({ name, motion }) => (
  <img
    src={photoUrl(name)}
    alt=""
    decoding="async"
    className={motion ? `ho-photo__img ho-photo__img--${motion}` : undefined}
    style={{ objectPosition: POSITIONS[name] }}
  />
);

const PhotoTile = ({ id, tile }) => (
  <figure className={`ho-tile ho-photo ho-photo--${id}`}>
    {tile.leaving ? <Photo key={tile.leaving} name={tile.leaving} motion="out" /> : null}
    <Photo key={tile.current} name={tile.current} motion={tile.swiped ? 'in' : undefined} />
  </figure>
);

/* One small tile turns over through the artwork of upcoming events, each of which opens its event. Until
   there is any artwork to show it keeps its still photo. */
const EVENT_HOLD_MS = 6000;

const EventPhoto = ({ event, motion, search, onBroken }) => (
  <Link
    to={opportunityDetailPath(event, search)}
    className={`ho-photo__event${motion ? ` ho-photo__img--${motion}` : ''}`}
    aria-hidden={motion === 'out' || undefined}
    tabIndex={motion === 'out' ? -1 : undefined}
  >
    <img src={event.imageUrl} alt="" decoding="async" onError={() => onBroken(event.imageUrl)} />
    {motion === 'out' ? null : <span className="sr-only">{event.title}</span>}
  </Link>
);

const EventPhotoTile = ({ id, events, search }) => {
  const [broken, setBroken] = useState(() => new Set());
  const [turn, setTurn] = useState({ index: 0, leaving: null });
  const pool = useMemo(() => events.filter((event) => !broken.has(event.imageUrl)), [events, broken]);
  const count = pool.length;
  const markBroken = useCallback((url) => setBroken((current) => new Set(current).add(url)), []);

  useEffect(() => {
    if (count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let settle;
    const timer = setInterval(() => {
      setTurn((current) => ({ index: (current.index + 1) % count, leaving: current.index % count }));
      clearTimeout(settle);
      settle = setTimeout(() => setTurn((current) => ({ ...current, leaving: null })), GALLERY_SWIPE_MS);
    }, EVENT_HOLD_MS + GALLERY_SWIPE_MS);
    return () => { clearInterval(timer); clearTimeout(settle); };
  }, [count]);

  if (count === 0) return <PhotoTile id={id} tile={STILL_TILE} />;

  const current = pool[turn.index % count];
  const leaving = turn.leaving === null ? null : pool[turn.leaving];
  return (
    <figure className={`ho-tile ho-photo ho-photo--${id}`} data-follow="arrow">
      {leaving && leaving !== current ? <EventPhoto key={leaving.id} event={leaving} motion="out" search={search} onBroken={markBroken} /> : null}
      <EventPhoto key={current.id} event={current} motion={turn.leaving === null ? undefined : 'in'} search={search} onBroken={markBroken} />
    </figure>
  );
};

const EVENT_TYPES = Object.freeze(['events', 'hackathons']);
const ALL_TYPES = Object.freeze(['events', 'hackathons', 'programs']);

const TileBody = ({ title, label, fresh }) => (
  <span className="ho-path__body">
    <strong className="ho-path__title">
      {title}
      {fresh ? <i className="ho-path__fresh" aria-hidden="true" /> : null}
    </strong>
    <span className="sr-only">{fresh ? `${label}, new` : label}</span>
  </span>
);

/* One round button that trails the mouse while it is over a tile marked data-follow, in place of a
   fixed button on every tile. Only mice drive it; touch and keyboard users keep the tiles as plain links. */
const useCursorButton = () => {
  const bentoRef = useRef(null);
  const buttonRef = useRef(null);
  const frame = useRef({ id: 0, x: 0, y: 0, tx: 0, ty: 0, shown: false });

  const step = useCallback(function tick() {
    const state = frame.current;
    const node = buttonRef.current;
    if (!node) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    state.x = still ? state.tx : state.x + (state.tx - state.x) * 0.3;
    state.y = still ? state.ty : state.y + (state.ty - state.y) * 0.3;
    node.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
    const settled = Math.abs(state.tx - state.x) < 0.1 && Math.abs(state.ty - state.y) < 0.1;
    state.id = settled ? 0 : requestAnimationFrame(tick);
  }, []);

  const hide = useCallback(() => {
    frame.current.shown = false;
    buttonRef.current?.classList.remove('is-shown');
  }, []);

  /* Point is in viewport coordinates; the tile is whichever data-follow element holds the mouse. */
  const follow = useCallback((tile, clientX, clientY) => {
    const bento = bentoRef.current;
    const node = buttonRef.current;
    if (!bento || !node) return;
    if (!tile) { hide(); return; }

    const box = bento.getBoundingClientRect();
    const state = frame.current;
    state.tx = clientX - box.left;
    state.ty = clientY - box.top;
    node.dataset.kind = tile.dataset.follow;
    node.dataset.tone = tile.dataset.tone ?? 'light';
    if (!state.shown) {
      // It appears where the mouse is rather than sliding in from the last tile.
      state.shown = true;
      state.x = state.tx;
      state.y = state.ty;
      node.classList.add('is-shown');
    }
    if (!state.id) state.id = requestAnimationFrame(step);
  }, [hide, step]);

  useEffect(() => () => cancelAnimationFrame(frame.current.id), []);

  const onPointerMove = useCallback((event) => {
    if (event.pointerType !== 'mouse') { hide(); return; }
    follow(event.target.closest('[data-follow]'), event.clientX, event.clientY);
  }, [follow, hide]);

  /* Pointer events inside a figure's own frame never reach the page, so the frame passes them on. */
  const onFrameMove = useCallback((frameElement, event) => {
    const box = frameElement.getBoundingClientRect();
    follow(frameElement.closest('[data-follow]'), box.left + event.clientX, box.top + event.clientY);
  }, [follow]);

  return { bentoRef, buttonRef, onPointerMove, onPointerLeave: hide, onFrameMove };
};

const FrameMoveContext = createContext(undefined);

/* The bento grid, with the mouse-following button laid over its tiles. */
const CursorBento = ({ children }) => {
  const { bentoRef, buttonRef, onPointerMove, onPointerLeave, onFrameMove } = useCursorButton();

  return (
    <div
      id="explore"
      ref={bentoRef}
      className="ho-bento"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <FrameMoveContext.Provider value={onFrameMove}>{children}</FrameMoveContext.Provider>
      <span ref={buttonRef} className="ho-follow" data-kind="arrow" aria-hidden="true">
        <span className="ho-follow__dot">
          <ArrowRightIcon className="ho-follow__arrow" />
          <ArrowUpRightIcon className="ho-follow__out" />
        </span>
      </span>
    </div>
  );
};

/* A square card: a silver plate holding one of the brand's line figures, then the title row. */
const FigureCard = ({ className, to, title, label, fresh, figure: Figure }) => {
  const navigate = useNavigate();
  const onFrameMove = useContext(FrameMoveContext);
  const open = () => navigate(to);

  return (
    <article className={`ho-tile ho-card ${className}`} data-follow="arrow">
      <div className="ho-card__figure" onClick={open} aria-hidden="true">
        <div className="ho-card__plate"><Figure onActivate={open} onMove={onFrameMove} /></div>
      </div>
      <Link to={to} className="ho-card__link">
        <TileBody title={title} label={label} fresh={fresh} />
      </Link>
    </article>
  );
};

const TerminalFigure = () => <Terminal theme="light" />;
const LaptopFigure = () => <Laptop theme="light" />;
// A tray of issues: the one under the pointer stands up, as an issue is pulled to be read.
const RiffleFigure = () => <Riffle theme="light" />;

// The mortarboard is a standalone figure, so clicks inside its frame are passed on by hand.
const MortarboardFigure = ({ onActivate, onMove }) => (
  <iframe
    className="ho-card__frame"
    src="/assets/home-bento/mortarboard.html"
    title=""
    tabIndex={-1}
    loading="lazy"
    onLoad={(event) => {
      const frame = event.currentTarget;
      try {
        frame.contentDocument.addEventListener('click', onActivate);
        frame.contentDocument.addEventListener('pointermove', (move) => {
          if (move.pointerType === 'mouse') onMove?.(frame, move);
        });
      } catch {
        // A frame we cannot reach keeps its figure; the title row still links.
      }
    }}
  />
);

const About = () => {
  const { city, enabledSections, selectedDiscoveryCityCodes } = useCity();
  const { search } = useLocation();
  const programsEnabled = hasPrograms(enabledSections);
  const [items, setItems] = useState([]);
  const cityKey = selectedDiscoveryCityCodes.join(',');
  const galleries = useGalleries(programsEnabled ? null : WIDE_PHOTO);

  useEffect(() => {
    let isCurrent = true;
    fetchDiscoveryItems(supabase, {
      cities: cityKey.split(','),
      opportunityTypes: programsEnabled ? ALL_TYPES : EVENT_TYPES,
    })
      .then((nextItems) => { if (isCurrent) setItems(nextItems); })
      // The graphics fall back to their empty frames; the links still work.
      .catch((error) => console.error('Could not load the opportunity showcase.', error));
    return () => { isCurrent = false; };
  }, [cityKey, programsEnabled]);

  const showcase = useMemo(() => homeShowcase({
    events: filterMemberDiscoveryItems(items, 'events'),
    hackathons: filterMemberDiscoveryItems(items, 'hackathons'),
    programs: programsEnabled ? filterMemberDiscoveryItems(items, 'programs') : [],
  }), [items, programsEnabled]);
  const eventPhotos = useMemo(() => {
    const seen = new Set();
    return upcomingEvents([
      ...filterMemberDiscoveryItems(items, 'events'),
      ...filterMemberDiscoveryItems(items, 'hackathons'),
    ]).filter((item) => {
      if (!item.imageUrl || seen.has(item.imageUrl)) return false;
      seen.add(item.imageUrl);
      return true;
    });
  }, [items]);
  const communityUrl = city?.whatsappUrl || FALLBACK_WHATSAPP_URL;
  const linkedinUrl = city?.linkedinUrl || CENTRAL_LINKEDIN_URL;
  const opportunitiesPath = programsEnabled ? '/discover/programs' : '/discover/events';

  return (
    <section id="about" className="about-section relative z-10 w-full" aria-labelledby="about-title">
      <CursorBento>
        <div className="ho-tile ho-tile--intro">
          <SectionHeading
            titleId="about-title"
            title="Find your next opportunity"
            description={programsEnabled
              ? 'What’s on this week, the next hackathons, and deadlines closing soon.'
              : 'What’s on this week and the next hackathons to build at.'}
          />
        </div>

        {Object.entries(galleries).filter(([id]) => id !== 'a').map(([id, tile]) => <PhotoTile key={id} id={id} tile={tile} />)}
        
        <EventPhotoTile id="b" events={eventPhotos} search={search} />
        {programsEnabled ? null : <PhotoTile id="wide" tile={{ ...STILL_TILE, current: WIDE_PHOTO }} />}

        <FigureCard
          className="ho-card--events"
          to={{ pathname: '/discover/events', search }}
          title="Events"
          label="Browse events"
          fresh
          figure={TerminalFigure}
        />
        <FigureCard
          className="ho-card--hackathons"
          to={{ pathname: '/discover/hackathons', search }}
          title="Hackathons"
          label="Browse hackathons"
          fresh
          figure={LaptopFigure}
        />
        <FigureCard
          className="ho-card--opportunities"
          to={{ pathname: opportunitiesPath, search }}
          title="Opportunities"
          label="Browse opportunities"
          fresh
          figure={MortarboardFigure}
        />

        {programsEnabled ? (
          <Link to={{ pathname: '/discover/programs', search }} className="ho-tile ho-path ho-path--programs" data-follow="arrow">
            <span className="ho-path__stage"><ProgramRunwayArt marks={showcase.programs.marks} /></span>
            <TileBody title="Programs" label="Browse programs" />
          </Link>
        ) : null}

        <div className="ho-stack">
          {galleries.a ? <PhotoTile id="a" tile={galleries.a} /> : null}
          <div className="ho-tile ho-links">
            <TileBody title="Links" label="Blau Tech links" />
            <span className="ho-links__row">
              <a href={communityUrl} target="_blank" rel="noreferrer" className="ho-links__link" aria-label="WhatsApp community">
                <WhatsAppIcon />
              </a>
              <a href={CONTACT_MAILTO} className="ho-links__link" aria-label="Email Blau Tech">
                <EnvelopeSolidIcon aria-hidden="true" />
              </a>
              <a href={linkedinUrl} target="_blank" rel="noreferrer" className="ho-links__link" aria-label="Blau Tech on LinkedIn">
                <LinkedInIcon />
              </a>
            </span>
          </div>

          <Link to="/partners#submit-event" className="ho-tile ho-path ho-path--submit" data-follow="arrow" data-tone="dark">
            <span className="ho-tile__icon"><PlusIcon aria-hidden="true" /></span>
            <TileBody title="Submit an event" label="Submit an event" />
          </Link>
        </div>

        <a href={communityUrl} target="_blank" rel="noreferrer" className="ho-tile ho-path ho-path--community" data-follow="external">
          <span className="ho-tile__icon"><ChatBubbleLeftRightIcon aria-hidden="true" /></span>
          <TileBody title="Join the chat" label="Open WhatsApp community" />
        </a>

        {NEWSLETTER_ENABLED ? (
          <article className="ho-tile ho-card ho-card--news" data-follow="arrow">
            <div className="ho-card__figure" onClick={() => openNewsletter()} aria-hidden="true">
              <div className="ho-card__plate"><RiffleFigure /></div>
            </div>
            <button type="button" className="ho-card__link" onClick={() => openNewsletter()}>
              <TileBody title="Newsletter" label="Subscribe to the newsletter" />
            </button>
          </article>
        ) : (
          <Link to="/partners" className="ho-tile ho-path ho-path--news" data-follow="arrow">
            <span className="ho-tile__icon"><UserGroupIcon aria-hidden="true" /></span>
            <TileBody title="For organisers" label="For organisers" />
          </Link>
        )}
      </CursorBento>
    </section>
  );
};

export default About;
