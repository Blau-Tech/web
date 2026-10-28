import { useState } from 'react';

import { houseImage } from '../../lib/discovery/opportunityImage';

const DiscoverArtwork = ({ imageUrl, category, label, fallbackClassName = '' }) => {
  // Track the URL that failed rather than a boolean, so this component recycled
  // for a different row re-tries that row's own image.
  const [failedUrl, setFailedUrl] = useState(null);
  const fallback = houseImage(category || label);
  const preferred = imageUrl || fallback;
  const source = preferred === failedUrl ? fallback : preferred;
  // The tinted fallback class sits behind the house photograph only, matching
  // the category wash the cards used before they always carried an image.
  const surfaceClass = source === fallback ? fallbackClassName : '';

  return (
    <span className={`discover-agenda-image pointer-events-none ${surfaceClass}`}>
      <img
        src={source}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(preferred)}
        className="h-full w-full object-cover"
      />
    </span>
  );
};

export default DiscoverArtwork;
