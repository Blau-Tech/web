const ARTWORK_BY_FLYOUT = {
  Events: {
    src: '/assets/nav-community/events.jpg',
    className: 'nav-flyout-art--events',
  },
  Programs: {
    src: '/assets/nav-community/programs.webp',
    className: 'nav-flyout-art--programs',
  },
  'For organisers': {
    src: '/assets/nav-community/organisers.webp',
    className: 'nav-flyout-art--organisers',
  },
};

export default function NavFlyoutArtwork({ flyout }) {
  const artwork = ARTWORK_BY_FLYOUT[flyout];

  if (!artwork) return null;

  return (
    <figure className={`nav-flyout-art ${artwork.className}`} aria-hidden="true">
      <img src={artwork.src} alt="" decoding="async" />
    </figure>
  );
}
