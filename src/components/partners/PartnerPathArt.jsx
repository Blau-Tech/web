import { useRef } from 'react';
import gsap from 'gsap';
import watermarkSvg from '../../assets/brand/watermark.svg';
import useLoopWhileVisible from './useLoopWhileVisible';

const SEAT_COUNT = 60;
const RSVP_TARGET = 180;
// One loop of the room filling and emptying; must match `bp-seat` in partners.css.
const SEAT_CYCLE = 7;
// Seats fill in a fixed scattered order. 37 is coprime with 60, so every seat
// gets its own slot; the fill itself runs in CSS on opacity and scale only.
const seatDelay = (index) => `${((index * 37) % SEAT_COUNT) * 0.035}s`;
const INNER_ORBIT = Object.freeze(['Students', 'Developers', 'Founders']);
const OUTER_ORBIT = Object.freeze(['Berlin', 'Researchers', 'Munich', 'Organisers']);

// Drives only the counter and label, in step with the CSS seat loop.
function cohostTimeline(root) {
  const q = gsap.utils.selector(root);
  const counter = q('.bp-art-seats__count')[0];
  const rsvps = { value: 0 };
  let shown = -1;
  const renderCount = () => {
    const next = Math.round(rsvps.value);
    if (next === shown) return;
    shown = next;
    counter.textContent = next;
  };

  return gsap.timeline({ repeat: -1 })
    .set(q('.bp-art-seats__full'), { autoAlpha: 0 })
    .fromTo(rsvps, { value: 0 }, { value: RSVP_TARGET, duration: 2.5, ease: 'power1.out', onUpdate: renderCount }, 0)
    .to(q('.bp-art-seats__full'), { autoAlpha: 1, duration: 0.4 }, 2.5)
    .addLabel('hold')
    .to(rsvps, { value: 0, duration: 2, ease: 'power1.in', onUpdate: renderCount }, 4.9)
    .to(q('.bp-art-seats__full'), { autoAlpha: 0, duration: 0.3 }, 4.9)
    .to({}, { duration: SEAT_CYCLE - 6.9 });
}

function CohostArt() {
  const scope = useRef(null);
  useLoopWhileVisible(scope, cohostTimeline);

  return (
    <div ref={scope} className="bp-art bp-art-seats" aria-hidden="true">
      <div className="bp-art-seats__head">
        <strong className="bp-art-seats__count">{RSVP_TARGET}</strong>
        <span>RSVPs</span>
      </div>
      <div className="bp-art-seats__stage">
        {Array.from({ length: SEAT_COUNT }, (_, index) => (
          <i className="bp-art-seats__seat" style={{ '--d': seatDelay(index) }} key={index} />
        ))}
      </div>
      <span className="bp-art-seats__full">Room full</span>
    </div>
  );
}

function OrbitRing({ items, className }) {
  return (
    <div className={`bp-art-orbit__ring ${className}`}>
      {items.map((item, index) => (
        <span className="bp-art-orbit__node" style={{ '--angle': `${(360 / items.length) * index + 18}deg` }} key={item}>
          <span className="bp-art-orbit__upright">
            <span className="bp-art-orbit__label">{item}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

function OrbitArt() {
  const scope = useRef(null);
  useLoopWhileVisible(scope, null);

  return (
    <div ref={scope} className="bp-art bp-art-orbit" aria-hidden="true">
      <span className="bp-art-orbit__track bp-art-orbit__track--inner" />
      <span className="bp-art-orbit__track bp-art-orbit__track--outer" />
      <OrbitRing items={OUTER_ORBIT} className="bp-art-orbit__ring--outer" />
      <OrbitRing items={INNER_ORBIT} className="bp-art-orbit__ring--inner" />
      <span className="bp-art-orbit__core"><img src={watermarkSvg} alt="" /></span>
    </div>
  );
}

const ARTWORKS = Object.freeze({ cohost: CohostArt, orbit: OrbitArt });

export default function PartnerPathArt({ variant }) {
  const Artwork = ARTWORKS[variant];
  return Artwork ? <Artwork /> : null;
}
