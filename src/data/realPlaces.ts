import { PDXActivity, CategoryType } from '../types';
import { PORTLAND_DOWNTOWN_CENTER, haversineMiles } from '../utils/geo';

// Search radius in meters. Kept smaller than the UI's 15-mile max so the free public Overpass
// instance can answer within its timeout — the client still trims further by the Distance slider.
const SEARCH_RADIUS_METERS = 12875; // ~8 miles

// Only these cuisines are shown for now; all other restaurants are hidden to keep the map lightweight
const ALLOWED_CUISINES = ['indian', 'american', 'mexican', 'african', 'arab', 'thai'];

// Max number of places kept per category, to keep the map from lagging with too many markers
const MAX_PER_CATEGORY = 30;

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

const CATEGORY_MOODS: Record<CategoryType, string[]> = {
  food: ['Late Night Craving 🍕', 'Chill Vibe ☕', 'Social / Meet People 🤝'],
  nightlife: ['Live Music & Vibes 🎵', 'Social / Meet People 🤝'],
  sports: ['Spontaneous Sport 🏀'],
  tech_events: ['Tech & Coding 💻', 'Chill Vibe ☕'],
  markets: ['Local Market & Crafts 🛍️'],
  social: ['Social / Meet People 🤝', 'Chill Vibe ☕']
};

const CATEGORY_VIBE: Record<CategoryType, string> = {
  food: 'Cozy & Local',
  nightlife: 'Buzzing & Social',
  sports: 'Energetic & Active',
  tech_events: 'Focused & Productive',
  markets: 'Bustling & Eclectic',
  social: 'Relaxed & Welcoming'
};

const CATEGORY_PRICE: Record<CategoryType, PDXActivity['priceLevel']> = {
  food: '$',
  nightlife: '$$',
  sports: '$$',
  tech_events: 'Free',
  markets: '$',
  social: '$'
};

// Maps raw OSM tags to one of our app categories. Returns null for tags we don't want to show.
function mapOsmTagsToCategory(tags: Record<string, string>): CategoryType | null {
  const amenity = tags.amenity;
  const shop = tags.shop;
  const leisure = tags.leisure;

  if (['restaurant', 'cafe', 'fast_food', 'food_court', 'ice_cream', 'bakery'].includes(amenity) || shop === 'bakery') return 'food';
  if (['bar', 'pub', 'nightclub', 'biergarten'].includes(amenity)) return 'nightlife';
  if (['fitness_centre', 'sports_centre'].includes(leisure) || shop === 'sports') return 'sports';
  if (amenity === 'coworking_space' || tags.office === 'coworking') return 'tech_events';
  if (['supermarket', 'convenience', 'marketplace', 'mall', 'department_store'].includes(shop)) return 'markets';
  if (['library', 'community_centre', 'social_facility'].includes(amenity)) return 'social';
  return null;
}

// Parses a small, common subset of the OSM opening_hours mini-language (e.g. "Mo-Su 08:00-22:00").
// Falls back to "assume open all day" when the format is unrecognized, since guessing "closed" is worse.
function parseOpeningHours(raw: string | undefined): { start: string; end: string } {
  if (!raw) return { start: '00:00', end: '23:59' };
  const match = raw.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!match) return { start: '00:00', end: '23:59' };
  return { start: match[1], end: match[2] };
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  return parts ? `${parts}, Portland, OR` : 'Portland, OR';
}

// Deterministic pseudo-random number from a string id, so the simulated "pulse" count stays stable per place.
function seededCount(id: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return min + (hash % (max - min));
}

interface OsmElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function transformElement(el: OsmElement): PDXActivity | null {
  const tags = el.tags || {};
  const name = tags.name;
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (!name || lat === undefined || lng === undefined) return null;

  const category = mapOsmTagsToCategory(tags);
  if (!category) return null;

  const id = `osm-${el.id}`;
  // OSM's cuisine tag can list multiple values separated by ";" (e.g. "american;breakfast;burger") — normalize to a clean, comma-separated list
  const cuisine = tags.cuisine
    ? tags.cuisine.split(';').map(c => c.trim().replace(/_/g, ' ')).filter(Boolean).join(', ')
    : '';

  return {
    id,
    title: name,
    category,
    neighborhood: 'Portland',
    lat,
    lng,
    openHours: parseOpeningHours(tags.opening_hours),
    suitableMoods: CATEGORY_MOODS[category],
    description: cuisine
      ? `A ${cuisine} ${category === 'food' ? 'spot' : 'place'} in Portland.`
      : `A local ${category.replace('_', ' ')} spot in Portland.`,
    isLiveNow: true,
    // Real-time foot traffic isn't available from free public data, so this stays a stable simulated "pulse" number.
    activeUsersCount: seededCount(id, 5, 60),
    address: buildAddress(tags),
    priceLevel: CATEGORY_PRICE[category],
    tags: [cuisine, category].filter(Boolean).map(t => t.charAt(0).toUpperCase() + t.slice(1)),
    vibe: CATEGORY_VIBE[category],
    // No free public rating source is wired up yet, so this is a neutral placeholder rather than a real score.
    rating: 4.3,
    cuisine: category === 'food' && cuisine ? cuisine : undefined
  };
}

// Keeps only food places whose cuisine matches the current allow-list; other categories pass through untouched
function hasAllowedCuisine(act: PDXActivity): boolean {
  if (act.category !== 'food') return true;
  if (!act.cuisine) return false;
  const tokens = act.cuisine.toLowerCase().split(', ');
  return tokens.some(t => ALLOWED_CUISINES.includes(t));
}

// Caps each category to the N closest places to the center point, so the map never has to render too many markers
function capPerCategory(activities: PDXActivity[], limit: number): PDXActivity[] {
  const byCategory = new Map<CategoryType, PDXActivity[]>();
  for (const act of activities) {
    const bucket = byCategory.get(act.category) ?? [];
    bucket.push(act);
    byCategory.set(act.category, bucket);
  }

  const result: PDXActivity[] = [];
  for (const bucket of byCategory.values()) {
    const sortedByDistance = [...bucket].sort(
      (a, b) =>
        haversineMiles(PORTLAND_DOWNTOWN_CENTER.lat, PORTLAND_DOWNTOWN_CENTER.lng, a.lat, a.lng) -
        haversineMiles(PORTLAND_DOWNTOWN_CENTER.lat, PORTLAND_DOWNTOWN_CENTER.lng, b.lat, b.lng)
    );
    result.push(...sortedByDistance.slice(0, limit));
  }
  return result;
}

let cachedActivities: PDXActivity[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour, to be respectful of the free public Overpass instance

export async function fetchDowntownPortlandPlaces(): Promise<PDXActivity[]> {
  if (cachedActivities && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedActivities;
  }

  const { lat, lng } = PORTLAND_DOWNTOWN_CENTER;
  const around = `around:${SEARCH_RADIUS_METERS},${lat},${lng}`;
  const query = `
    [out:json][timeout:50];
    (
      node["amenity"~"restaurant|cafe|fast_food|food_court|ice_cream|bar|pub|nightclub|biergarten|coworking_space|library|community_centre|social_facility"](${around});
      node["shop"~"bakery|sports|supermarket|convenience|marketplace|mall|department_store"](${around});
      node["leisure"~"fitness_centre|sports_centre"](${around});
      node["office"="coworking"](${around});
    );
    out center;
  `;

  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Overpass rejects requests without an identifying User-Agent with a 406
      'User-Agent': 'PulseMapPDX/1.0 (local dev)'
    },
    body: `data=${encodeURIComponent(query)}`
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();
  const activities = (data.elements as OsmElement[])
    .map(transformElement)
    .filter((a): a is PDXActivity => a !== null)
    .filter(hasAllowedCuisine);

  const capped = capPerCategory(activities, MAX_PER_CATEGORY);

  cachedActivities = capped;
  cachedAt = Date.now();
  return capped;
}
