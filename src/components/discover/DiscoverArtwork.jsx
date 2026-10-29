import { useState } from 'react';

const DiscoverArtwork = ({ imageUrl, fallbackClassName = '' }) => {
  // Track the URL that failed rather than a boolean, so this component recycled
  // for a different row re-tries that row's own image.
  const [failedUrl, setFailedUrl] = useState(null);
  const hasImage = Boolean(imageUrl) && imageUrl !== failedUrl;

  // Without an image the tile keeps its category wash and shows nothing on it.
  return (
    <span className={`discover-agenda-image pointer-events-none ${hasImage ? '' : fallbackClassName}`}>
      {hasImage ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(imageUrl)}
          className="h-full w-full object-cover"
        />
      ) : null}
    </span>
  );
};

export default DiscoverArtwork;
