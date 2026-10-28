import { useState } from 'react';

import { houseImage, opportunityImage } from '../../../lib/discovery/opportunityImage';

/** A listing's own image, falling back to the house photograph if it fails. */
export default function ListingThumb({ item, eager = false, className = '' }) {
  // Track the URL that failed rather than a boolean, so a recycled thumb
  // re-tries the next listing's own image.
  const [failedUrl, setFailedUrl] = useState(null);
  const preferred = opportunityImage(item);
  const source = preferred === failedUrl ? houseImage(item.category || item.tag) : preferred;

  return (
    <img
      className={className}
      src={source}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedUrl(preferred)}
    />
  );
}
