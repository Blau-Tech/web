// A listing shows its own `image_url` and nothing else: when a row has none, or
// the image fails to load, the artwork is simply left out.

export function opportunityImage(item) {
  return item?.imageUrl || null;
}
