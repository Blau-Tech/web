import { useRef } from 'react';
import { GlassMaterial } from '../ui/glass-material';
import useLoopWhileVisible from './useLoopWhileVisible';

// Pin positions match the home hero's city picker on the same map asset.
const PIN_POSITIONS = Object.freeze({
  BERLIN: { left: '71.6%', top: '27.54%' },
  MUNICH: { left: '65.2%', top: '51.95%' },
});
const CITY_LINK = 'M724.6 275.4 Q 790 400 659.8 519.5';

const formatCount = (value) => (typeof value === 'number' ? value.toLocaleString('en-GB') : '-');

/** The Blau Tech map, zoomed on the two live cities with their real reach. */
export default function AudienceMap({ cities }) {
  const scope = useRef(null);
  useLoopWhileVisible(scope, null);

  return (
    <div ref={scope} className="bp-map">
      <div className="bp-map__canvas">
        <img src="/assets/blau-tech-europe-map.svg" alt="" aria-hidden="true" />
        <svg className="bp-map__link" viewBox="0 0 1012 1000" aria-hidden="true">
          <path className="bp-map__link-track" d={CITY_LINK} pathLength="100" />
          <path className="bp-map__link-pulse" d={CITY_LINK} pathLength="100" />
        </svg>

        {cities.map((city) => (
          <div className={`bp-map__pin bp-map__pin--${city.code.toLowerCase()}`} style={PIN_POSITIONS[city.code]} key={city.code}>
            <span className="bp-map__dot" aria-hidden="true" />
            <GlassMaterial className="bp-map__callout" materialClassName="bp-map__callout-surface">
              <strong>{city.name}</strong>
              <span>
                <b>{formatCount(city.events)}</b> listed
                <i aria-hidden="true" />
                <b>{formatCount(city.upcoming)}</b> upcoming
              </span>
            </GlassMaterial>
          </div>
        ))}
      </div>
    </div>
  );
}
