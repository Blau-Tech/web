// Live material for the Partners page: real upcoming listings for the hero wall
// and per-city reach for the audience map. Everything is public, published data.

const SHOWCASE_CITIES = Object.freeze([
  { code: 'BERLIN', name: 'Berlin' },
  { code: 'MUNICH', name: 'Munich' },
]);
const LISTING_LIMIT = 30;

function listingItem(row) {
  return {
    id: row.id,
    title: row.name,
    date: row.start_date,
    imageUrl: row.image_url || null,
    category: row.event_type === 'HACKATHON' ? 'hackathons' : 'events',
  };
}

function cityCountQueries(client, cityCode, isoToday) {
  const publishedInCity = () => client.from('events')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('city', cityCode);

  return [publishedInCity(), publishedInCity().gte('start_date', isoToday)];
}

export async function fetchPartnerShowcase(client, today = new Date()) {
  if (!client?.from) throw new TypeError('A Supabase client is required.');

  const isoToday = today.toISOString().slice(0, 10);
  const results = await Promise.all([
    client.from('events')
      .select('id, name, start_date, image_url, event_type')
      .eq('is_published', true)
      .in('city', SHOWCASE_CITIES.map(({ code }) => code))
      .gte('start_date', isoToday)
      .order('start_date', { ascending: true })
      .limit(LISTING_LIMIT),
    ...SHOWCASE_CITIES.flatMap(({ code }) => cityCountQueries(client, code, isoToday)),
  ]);

  const failed = results.find(({ error }) => error);
  if (failed) throw failed.error;

  const [listings, ...cityCounts] = results;
  return {
    listings: (listings.data || []).map(listingItem),
    cities: SHOWCASE_CITIES.map((city, index) => ({
      ...city,
      events: cityCounts[index * 2].count ?? 0,
      upcoming: cityCounts[index * 2 + 1].count ?? 0,
    })),
  };
}
