import { useRef } from 'react';

import ListingThumb from '../showcase/ListingThumb';
import useInViewOnce from '../showcase/useInViewOnce';

/** Entry points by program type, each fanned out from its own listings. */
export default function ProgramTypeTiles({ types, activeKey, onSelect }) {
  const scope = useRef(null);
  const inView = useInViewOnce(scope);

  return (
    <div ref={scope} className={`ds-types${inView ? ' is-in' : ''}`} role="group" aria-label="Browse programs by type">
      {types.map((type, index) => (
        <button
          key={type.key}
          type="button"
          className="ds-type"
          style={{ '--i': index }}
          aria-pressed={activeKey === type.key}
          onClick={() => onSelect(type.key)}
        >
          <span className="ds-type__fan" aria-hidden="true">
            {type.items.slice(0, 3).map((item, fanIndex) => (
              <span key={`${item.source}-${item.id}`} className="ds-type__card" style={{ '--f': fanIndex }}>
                <ListingThumb item={item} />
              </span>
            ))}
          </span>
          <span className="ds-type__label">
            <strong>{type.label}</strong>
            <small>{type.count} {type.count === 1 ? 'program' : 'programs'}</small>
          </span>
        </button>
      ))}
    </div>
  );
}
