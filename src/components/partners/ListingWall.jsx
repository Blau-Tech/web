import { useMemo, useRef } from 'react';
import ListingTile from './ListingTile';
import useLoopWhileVisible from './useLoopWhileVisible';

const COLUMN_COUNT = 5;
const TILES_PER_COLUMN = 5;
const EAGER_COLUMNS = 3;

/**
 * The hero backdrop: real upcoming Blau Tech listings drifting in columns, so
 * the submit field sits in the middle of the place a new event will land.
 */
export default function ListingWall({ listings }) {
  const scope = useRef(null);
  useLoopWhileVisible(scope, null);

  const columns = useMemo(() => {
    if (!listings.length) return [];
    return Array.from({ length: COLUMN_COUNT }, (_, column) => (
      Array.from({ length: TILES_PER_COLUMN }, (_, row) => (
        listings[(column + row * COLUMN_COUNT) % listings.length]
      ))
    ));
  }, [listings]);

  return (
    <div ref={scope} className="bp-wall" aria-hidden="true">
      {columns.map((tiles, column) => (
        <div className={`bp-wall__column bp-wall__column--${column + 1}`} key={column}>
          <div className="bp-wall__track">
            {[0, 1].map((copy) => tiles.map((listing, row) => (
              // Lazy images inside the moving, rotated wall load late and flash
              // in, so the columns every screen size shows load eagerly at low
              // priority. Columns 4 and 5 are hidden on smaller screens and
              // stay lazy so phones never download them.
              <ListingTile
                listing={listing}
                loading={column < EAGER_COLUMNS ? 'eager' : 'lazy'}
                priority="low"
                key={`${copy}-${row}-${listing.id}`}
              />
            )))}
          </div>
        </div>
      ))}
    </div>
  );
}
