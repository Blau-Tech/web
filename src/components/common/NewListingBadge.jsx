import { isNewListing, isRecentlyAdded } from '../../lib/discovery/newListings';

// Renders nothing unless the row reached Supabase inside the "new" window, so
// every card can mount it unconditionally next to its own kicker copy.
export default function NewListingBadge({ item, createdAt, className = '' }) {
  const isNew = createdAt === undefined
    ? isNewListing(item)
    : isRecentlyAdded(createdAt);

  if (!isNew) return null;

  return (
    <span className={className ? `new-listing-badge ${className}` : 'new-listing-badge'}>
      New
    </span>
  );
}
