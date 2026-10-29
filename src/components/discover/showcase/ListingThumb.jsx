import { useState } from 'react';

import { opportunityImage } from '../../../lib/discovery/opportunityImage';

/** A listing's own image; nothing is drawn when it has none or it fails to load. */
export default function ListingThumb({ item, eager = false, className = '' }) {
  // Track the URL that failed rather than a boolean, so a recycled thumb
  // re-tries the next listing's own image.
  const [failedUrl, setFailedUrl] = useState(null);
  const source = opportunityImage(item);

  if (!source || source === failedUrl) return null;

  return (
    <img
      className={className}
      src={source}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedUrl(source)}
    />
  );
}
