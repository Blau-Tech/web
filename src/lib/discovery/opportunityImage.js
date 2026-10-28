// Every listing renders an image. A row's own `image_url` is preferred; when it
// is missing or fails to load, the curated house photograph for that category
// takes over. All fallbacks are 1200x630 so a card never drops to a flat colour.

export const HOUSE_IMAGES = Object.freeze({
  events: '/assets/nav-community/events.jpg',
  hackathons: '/assets/nav-community/events.jpg',
  programs: '/assets/nav-community/programs.webp',
  organisers: '/assets/nav-community/organisers.webp',
});

const CATEGORY_ALIASES = Object.freeze({
  event: 'events',
  events: 'events',
  hackathon: 'hackathons',
  hackathons: 'hackathons',
  program: 'programs',
  programs: 'programs',
  fellowship: 'programs',
  opportunities: 'programs',
  organisation: 'organisers',
  organisations: 'organisers',
  organisers: 'organisers',
  community: 'organisers',
});

export function houseImage(category) {
  const key = CATEGORY_ALIASES[String(category || '').trim().toLowerCase()];
  return HOUSE_IMAGES[key] || HOUSE_IMAGES.events;
}

// `category` is the normalized discovery category; `tag` covers the Community
// Pulse feed, which labels rows 'Event' / 'Program' / 'Organisation' instead.
export function opportunityImage(item) {
  return item?.imageUrl || houseImage(item?.category || item?.tag);
}
