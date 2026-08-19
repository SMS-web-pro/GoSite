/**
 * Bing Maps Local Business Scraper
 *
 * Multi-source strategy (in order of preference):
 *   1. Photon (Komoot) - fastest, well-structured
 *   2. Nominatim search with viewbox
 *   3. OSM /map API (only if absolutely needed, with very small bboxes)
 *
 * All sources are bounded by timeouts to prevent hangs.
 */

export type ScrapedBusiness = {
  name: string;
  category: string | null;
  subcategory: string | null;
  osmType: string | null;
  osmId: number | null;
  wikidataId: string | null;
  wikipedia: string | null;
  address: string | null;
  housenumber: string | null;
  street: string | null;
  neighbourhood: string | null;
  suburb: string | null;
  postcode: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  linkedin: string | null;
  youtube: string | null;
  openingHours: string | null;
  cuisine: string | null;
  description: string | null;
  wheelchair: string | null;
  wifi: string | null;
  takeaway: string | null;
  delivery: string | null;
  outdoorSeating: string | null;
  smoking: string | null;
  reservation: string | null;
  parking: string | null;
  airConditioning: string | null;
  paymentCash: string | null;
  paymentCard: string | null;
  capacity: string | null;
  stars: string | null;
  latitude: string | null;
  longitude: string | null;
  bingUrl: string | null;
  osmUrl: string | null;
  googleMapsUrl: string | null;
  rating: string | null;
  reviewsCount: number | null;
  source: string;
  extraTags: string | null;
  detailCount: number;
  popularity: number | null;
};

type GeoLocation = {
  lat: number;
  lon: number;
  displayName: string;
  bbox?: [number, number, number, number];
};

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];
function pickUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch with a hard timeout via AbortController.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<Response | null> {
  const { timeoutMs = 10000, headers = {}, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...rest,
      headers: { "User-Agent": pickUserAgent(), ...headers },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(id);
    return res;
  } catch {
    clearTimeout(id);
    return null;
  }
}

/**
 * Geocode a location using Open-Meteo (no rate limit, no key needed).
 * Falls back to Nominatim if Open-Meteo doesn't know the place.
 */
export async function geocodeLocation(
  location: string,
  signal?: AbortSignal
): Promise<GeoLocation | null> {
  // Open-Meteo first
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      location
    )}&count=1&language=fr&format=json`;
    const res = await fetchWithTimeout(url, { timeoutMs: 8000, signal });
    if (res && res.ok) {
      const data = (await res.json()) as {
        results?: Array<{
          latitude: number;
          longitude: number;
          name: string;
          country?: string;
          admin1?: string;
          admin2?: string;
          admin3?: string;
          admin4?: string;
        }>;
      };
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        const displayName = [item.name, item.admin3, item.admin2, item.admin1, item.country]
          .filter(Boolean)
          .join(", ");
        // Compute a default ~5km bbox around the point
        const bbox = bboxAround(item.latitude, item.longitude, 5000);
        return {
          lat: item.latitude,
          lon: item.longitude,
          displayName,
          bbox,
        };
      }
    }
  } catch {}
  // Nominatim fallback
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(
      location
    )}`;
    const res = await fetchWithTimeout(url, {
      timeoutMs: 8000,
      signal,
      headers: { Accept: "application/json" },
    });
    if (res && res.ok) {
      const data = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
        boundingbox?: [string, string, string, string];
      }>;
      if (data && data.length > 0) {
        const item = data[0];
        let bbox: [number, number, number, number] | undefined;
        if (item.boundingbox && item.boundingbox.length === 4) {
          bbox = [
            parseFloat(item.boundingbox[0]),
            parseFloat(item.boundingbox[1]),
            parseFloat(item.boundingbox[2]),
            parseFloat(item.boundingbox[3]),
          ];
        }
        return {
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: item.display_name,
          bbox,
        };
      }
    }
  } catch {}
  return null;
}

function bboxAround(
  lat: number,
  lon: number,
  radiusMeters: number
): [number, number, number, number] {
  const dLat = radiusMeters / 111_320;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const dLon = radiusMeters / (111_320 * Math.max(cosLat, 0.01));
  return [lat - dLat, lon - dLon, lat + dLat, lon + dLon];
}

/**
 * Geocode a location and return country code + city name for filtering.
 */
async function geocodeWithCountryInfo(
  location: string,
  signal?: AbortSignal
): Promise<{
  lat: number;
  lon: number;
  displayName: string;
  countryCode: string | null;
  cityName: string;
} | null> {
  // Try Open-Meteo first (returns country_code directly)
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      location
    )}&count=1&language=fr&format=json`;
    const res = await fetchWithTimeout(url, { timeoutMs: 8000, signal });
    if (res && res.ok) {
      const data = (await res.json()) as {
        results?: Array<{
          latitude: number;
          longitude: number;
          name: string;
          country?: string;
          country_code?: string;
          admin1?: string;
          admin2?: string;
          admin3?: string;
        }>;
      };
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        const displayName = [item.name, item.admin3, item.admin2, item.admin1, item.country]
          .filter(Boolean)
          .join(", ");
        return {
          lat: item.latitude,
          lon: item.longitude,
          displayName,
          countryCode: item.country_code || null,
          cityName: item.name,
        };
      }
    }
  } catch {}
  // Nominatim fallback
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(
      location
    )}`;
    const res = await fetchWithTimeout(url, {
      timeoutMs: 8000,
      signal,
      headers: { Accept: "application/json" },
    });
    if (res && res.ok) {
      const data = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
        address?: { country_code?: string; city?: string; town?: string; village?: string };
      }>;
      if (data && data.length > 0) {
        const item = data[0];
        return {
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: item.display_name,
          countryCode: item.address?.country_code || null,
          cityName: item.address?.city || item.address?.town || item.address?.village || item.display_name.split(",")[0],
        };
      }
    }
  } catch {}
  return null;
}

/**
 * Sector → OSM tag mapping for filtering.
 */
const SECTOR_TO_OSM_TAGS: Record<string, string[]> = {
  restaurant: ["amenity=restaurant"],
  cafe: ["amenity=cafe"],
  bar: ["amenity=bar"],
  boulangerie: ["shop=bakery"],
  boulanger: ["shop=bakery"],
  pharmacie: ["amenity=pharmacy"],
  pharmacy: ["amenity=pharmacy"],
  coiffeur: ["shop=hairdresser"],
  coiffure: ["shop=hairdresser"],
  garagiste: ["shop=car_repair"],
  garage: ["shop=car_repair"],
  dentiste: ["amenity=dentist"],
  docteur: ["amenity=doctors"],
  medecin: ["amenity=doctors"],
  hopital: ["amenity=hospital"],
  clinique: ["amenity=clinic"],
  ecole: ["amenity=school"],
  universite: ["amenity=university"],
  salle: ["leisure=fitness_centre"],
  sport: ["leisure=fitness_centre"],
  fitness: ["leisure=fitness_centre"],
  hotel: ["tourism=hotel"],
  immobilier: ["office=estate_agent"],
  notaire: ["office=notary"],
  avocat: ["office=lawyer"],
  banque: ["amenity=bank"],
  supermarche: ["shop=supermarket"],
  epicerie: ["shop=convenience"],
  boucherie: ["shop=butcher"],
  fleuriste: ["shop=florist"],
  librairie: ["shop=books"],
};

function sectorToOsmTag(sector: string): string | null {
  const lc = sector.toLowerCase().trim();
  for (const key of Object.keys(SECTOR_TO_OSM_TAGS)) {
    if (lc.includes(key)) {
      return SECTOR_TO_OSM_TAGS[key][0];
    }
  }
  return null;
}

/**
 * Synonyms for common sectors to maximize Photon matches.
 */
const SECTOR_SYNONYMS: Record<string, string[]> = {
  restaurant: ["restaurant", "resto"],
  cafe: ["cafe", "café", "coffee"],
  pharmacie: ["pharmacie", "pharmacy"],
  coiffeur: ["coiffeur", "hairdresser"],
  boulangerie: ["boulangerie", "baker"],
  garage: ["garage", "car_repair"],
  dentiste: ["dentiste", "dentist"],
  hotel: ["hotel", "hôtel"],
  sport: ["fitness", "gym", "sport"],
  avocat: ["avocat", "lawyer"],
  banque: ["banque", "bank"],
  supermarche: ["supermarché", "supermarket"],
};

function expandSector(sector: string): string[] {
  const lc = sector.toLowerCase().trim();
  for (const key of Object.keys(SECTOR_SYNONYMS)) {
    if (lc.includes(key)) {
      return Array.from(new Set([sector, ...SECTOR_SYNONYMS[key]]));
    }
  }
  return [sector];
}

type PhotonFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    osm_id?: number;
    osm_type?: string;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

function photonToBase(
  f: PhotonFeature,
  sector: string,
  displayName: string
): ScrapedBusiness {
  const p = f.properties || {};
  const [lon, lat] = f.geometry.coordinates;
  const street = [p.housenumber, p.street].filter(Boolean).join(" ");
  const address = [street, p.postcode, p.city].filter(Boolean).join(", ") ||
    displayName.split(",").slice(0, 2).join(",");
  const category = p.osm_key && p.osm_value ? `${p.osm_key}=${p.osm_value}` : sector;
  return {
    name: p.name || "",
    category,
    subcategory: p.osm_value || null,
    osmType: p.osm_type || null,
    osmId: p.osm_id ?? null,
    wikidataId: null,
    wikipedia: null,
    address,
    housenumber: p.housenumber || null,
    street: p.street || null,
    neighbourhood: null,
    suburb: null,
    postcode: p.postcode || null,
    city: p.city || null,
    state: p.state || null,
    country: p.country || null,
    phone: null, mobile: null, email: null, website: null,
    facebook: null, twitter: null, instagram: null, linkedin: null, youtube: null,
    openingHours: null, cuisine: null, description: null,
    wheelchair: null, wifi: null, takeaway: null, delivery: null,
    outdoorSeating: null, smoking: null, reservation: null, parking: null,
    airConditioning: null, paymentCash: null, paymentCard: null,
    capacity: null, stars: null,
    latitude: lat != null ? String(lat) : null,
    longitude: lon != null ? String(lon) : null,
    bingUrl: lat != null && lon != null
      ? `https://www.bing.com/maps?cp=${lat}~${lon}&lvl=17`
      : null,
    osmUrl: p.osm_id
      ? `https://www.openstreetmap.org/${p.osm_type || "node"}/${p.osm_id}`
      : null,
    googleMapsUrl: lat != null && lon != null
      ? `https://www.google.com/maps?q=${lat},${lon}`
      : null,
    rating: null, reviewsCount: null,
    source: "photon",
    extraTags: null,
    detailCount: 0,
    popularity: null,
  };
}

type NominatimItem = {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  category?: string;
  type?: string;
  name?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
  namedetails?: Record<string, string>;
};

function nominatimToBase(
  it: NominatimItem,
  sector: string,
  displayName: string
): ScrapedBusiness {
  const lat = parseFloat(it.lat);
  const lon = parseFloat(it.lon);
  const t = it.extratags || {};
  const addr = it.address || {};
  const street = [addr.housenumber, addr.road].filter(Boolean).join(" ");
  return {
    name: it.namedetails?.name || it.name || "",
    category: it.category ? `${it.category}=${it.type}` : sector,
    subcategory: it.type || t.cuisine || null,
    osmType: it.osm_type,
    osmId: it.osm_id,
    wikidataId: t.wikidata || null,
    wikipedia: t.wikipedia || null,
    address: [street, addr.postcode, addr.city || addr.town || addr.village]
      .filter(Boolean).join(", ") || displayName,
    housenumber: addr.housenumber || null,
    street: addr.road || null,
    neighbourhood: addr.neighbourhood || addr.quarter || null,
    suburb: addr.suburb || addr.city_district || null,
    postcode: addr.postcode || null,
    city: addr.city || addr.town || addr.village || null,
    state: addr.state || addr.region || null,
    country: addr.country || null,
    phone: t.phone || t["contact:phone"] || null,
    mobile: t["contact:mobile"] || t.mobile || null,
    email: t.email || t["contact:email"] || null,
    website: t.website || t["contact:website"] || t.url || null,
    facebook: t["contact:facebook"] || t.facebook || null,
    twitter: t["contact:twitter"] || t.twitter || null,
    instagram: t["contact:instagram"] || t.instagram || null,
    linkedin: t["contact:linkedin"] || t.linkedin || null,
    youtube: t["contact:youtube"] || t.youtube || null,
    openingHours: t.opening_hours || null,
    cuisine: t.cuisine || null,
    description: t.description || t.note || null,
    wheelchair: t.wheelchair || null,
    wifi: t.wifi || t.internet_access || null,
    takeaway: t.takeaway || null,
    delivery: t["delivery:food"] || t.delivery || null,
    outdoorSeating: t.outdoor_seating || null,
    smoking: t.smoking || null,
    reservation: t.reservation || null,
    parking: t.parking || null,
    airConditioning: t.air_conditioning || null,
    paymentCash: t["payment:cash"] || t.payment_cash || null,
    paymentCard: t["payment:credit_cards"] || t["payment:debit_cards"] || t["payment:cards"] || null,
    capacity: t.capacity || null,
    stars: t.stars || null,
    latitude: String(lat),
    longitude: String(lon),
    bingUrl: `https://www.bing.com/maps?cp=${lat}~${lon}&lvl=17`,
    osmUrl: `https://www.openstreetmap.org/${it.osm_type}/${it.osm_id}`,
    googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
    rating: null, reviewsCount: null,
    source: "openstreetmap",
    extraTags: Object.keys(t).length > 0 ? JSON.stringify(t) : null,
    detailCount: 0,
    popularity: null,
  };
}

/**
 * Single Photon query.
 */
async function photonQuery(
  q: string,
  bbox: [number, number, number, number],
  signal?: AbortSignal
): Promise<PhotonFeature[]> {
  // bbox = [south, west, north, east]
  const [s, w, n, e] = bbox;
  const params = new URLSearchParams({
    q,
    bbox: `${w},${s},${e},${n}`,
    limit: "50",
    lang: "fr",
  });
  const url = `https://photon.komoot.io/api?${params.toString()}`;
  const res = await fetchWithTimeout(url, { timeoutMs: 6000, signal });
  if (!res || !res.ok) return [];
  try {
    const data = (await res.json()) as { features?: PhotonFeature[] };
    return data.features || [];
  } catch {
    return [];
  }
}

/**
 * Single Nominatim search with viewbox.
 */
let lastNominatimCallAt = 0;
const NOMINATIM_MIN_DELAY_MS = 1100;

async function nominatimSearch(
  q: string,
  bbox: [number, number, number, number],
  options: { countryCode?: string; cityName?: string } = {},
  signal?: AbortSignal
): Promise<NominatimItem[]> {
  // Rate limit
  const now = Date.now();
  const wait = NOMINATIM_MIN_DELAY_MS - (now - lastNominatimCallAt);
  if (wait > 0) await sleep(wait);
  lastNominatimCallAt = Date.now();
  // bbox = [south, west, north, east], viewbox needs [west, north, east, south]
  const [s, w, n, e] = bbox;
  // Use just the sector as query (Nominatim respects the viewbox for
  // generic queries; adding the city name can sometimes break viewbox
  // filtering).
  const searchQuery = q;
  const params = new URLSearchParams();
  params.set("q", searchQuery);
  params.set("format", "json");
  params.set("addressdetails", "1");
  params.set("extratags", "1");
  params.set("namedetails", "1");
  params.set("limit", "50");
  // bbox = [south, west, north, east], viewbox needs [west, north, east, south]
  params.set("viewbox", `${w},${n},${e},${s}`);
  params.set("bounded", "1");
  if (options.countryCode) {
    params.set("countrycodes", options.countryCode);
  }
  // Build URL with + instead of %20 for the q parameter
  const url = `https://nominatim.openstreetmap.org/search?${params.toString().replace(/%20/g, "+")}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: 8000,
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res || !res.ok) return [];
  try {
    const data = (await res.json()) as NominatimItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Enrich a business via reverse geocoding (1 req per call, throttled).
 */
async function reverseGeocode(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<NominatimItem | null> {
  const now = Date.now();
  const wait = NOMINATIM_MIN_DELAY_MS - (now - lastNominatimCallAt);
  if (wait > 0) await sleep(wait);
  lastNominatimCallAt = Date.now();
  const params = new URLSearchParams({
    format: "json",
    lat: String(lat),
    lon: String(lon),
    zoom: "18",
    addressdetails: "1",
    extratags: "1",
    namedetails: "1",
  });
  const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: 8000,
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res || !res.ok) return null;
  try {
    return (await res.json()) as NominatimItem;
  } catch {
    return null;
  }
}

function countDetails(b: ScrapedBusiness): number {
  return (
    (b.phone ? 1 : 0) + (b.website ? 1 : 0) + (b.email ? 1 : 0) +
    (b.openingHours ? 1 : 0) + (b.cuisine ? 1 : 0) +
    (b.wheelchair ? 1 : 0) + (b.wifi ? 1 : 0) +
    (b.outdoorSeating ? 1 : 0) + (b.delivery ? 1 : 0) +
    (b.takeaway ? 1 : 0) + (b.reservation ? 1 : 0) +
    (b.description ? 1 : 0) +
    (b.facebook || b.instagram || b.twitter || b.linkedin ? 1 : 0)
  );
}

function computePopularity(b: ScrapedBusiness): number {
  let score = 0;
  if (b.phone) score += 8;
  if (b.website) score += 12;
  if (b.email) score += 5;
  if (b.openingHours) score += 12;
  if (b.cuisine) score += 5;
  if (b.wheelchair) score += 3;
  if (b.wifi) score += 2;
  if (b.outdoorSeating) score += 2;
  if (b.delivery) score += 2;
  if (b.takeaway) score += 2;
  if (b.reservation) score += 3;
  if (b.description) score += 10;
  if (b.wikipedia) score += 15;
  if (b.facebook || b.instagram) score += 5;
  if (b.stars) score += parseInt(b.stars) * 4;
  if (b.capacity) score += 2;
  if (b.housenumber) score += 3;
  if (b.postcode) score += 2;
  return Math.min(100, score);
}

async function fetchWikipedia(
  wikidataId: string,
  signal?: AbortSignal
): Promise<{ description: string; url: string } | null> {
  try {
    const wdRes = await fetchWithTimeout(
      `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`,
      { timeoutMs: 6000, signal }
    );
    if (!wdRes || !wdRes.ok) return null;
    const wdData = await wdRes.json();
    const entity = wdData.entities?.[wikidataId];
    const frwiki = entity?.sitelinks?.frwiki;
    if (!frwiki) return null;
    const title = frwiki.title;
    const extractRes = await fetchWithTimeout(
      `https://fr.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}`,
      { timeoutMs: 6000, signal }
    );
    if (!extractRes || !extractRes.ok) return null;
    const extData = await extractRes.json();
    const pages = extData.query?.pages || {};
    const firstKey = Object.keys(pages)[0];
    const extract = pages[firstKey]?.extract || "";
    if (!extract || extract.length < 30) return null;
    const cleanExtract = extract.length > 400 ? extract.slice(0, 400) + "…" : extract;
    return {
      description: cleanExtract,
      url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
    };
  } catch {
    return null;
  }
}

/**
 * Main scrape function. Bounded by 30s, uses multiple sources.
 */
export async function scrapeBusinesses(
  sector: string,
  location: string,
  options: { signal?: AbortSignal } = {}
): Promise<{
  businesses: ScrapedBusiness[];
  sources: string[];
  note?: string;
  total: number;
  enriched: number;
}> {
  const sources: string[] = [];
  const baseBusinesses: ScrapedBusiness[] = [];
  const seen = new Set<string>();

  // Step 1: Geocode (also get country code for filtering)
  const geoResult = await geocodeWithCountryInfo(location, options.signal);
  if (!geoResult) {
    throw new Error(
      `Impossible de géolocaliser "${location}". Précisez la ville et le pays (ex. "Paris, France").`
    );
  }
  const { countryCode, cityName } = geoResult;
  const geo: GeoLocation = {
    lat: geoResult.lat,
    lon: geoResult.lon,
    displayName: geoResult.displayName,
  };

  // Build a focused bbox (~3km radius) for POI search
  const searchBbox: [number, number, number, number] = bboxAround(geo.lat, geo.lon, 3000);

  // Step 2: Try Photon with sector + 1 synonym (limit to 1 query to save time)
  const sectors = expandSector(sector);
  const photonTasks: Promise<PhotonFeature[]>[] = [];
  for (const sec of sectors.slice(0, 1)) {
    photonTasks.push(photonQuery(sec, searchBbox, options.signal));
  }
  const photonResults = await Promise.all(photonTasks);
  let photonCount = 0;
  for (const features of photonResults) {
    for (const f of features) {
      const id = f.properties.osm_id;
      const key = id ? `${f.properties.osm_type}:${id}` : `coord:${f.geometry.coordinates.join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const b = photonToBase(f, sector, geo.displayName);
      if (b.name) {
        baseBusinesses.push(b);
        photonCount++;
      }
      if (baseBusinesses.length >= 300) break;
    }
    if (baseBusinesses.length >= 300) break;
  }
  if (photonCount > 0) sources.push("photon");

  // Step 3: If Photon didn't yield enough, try Nominatim search
  if (baseBusinesses.length < 30) {
    for (const sec of sectors.slice(0, 1)) {
      const items = await nominatimSearch(
        sec,
        searchBbox,
        { countryCode: countryCode || undefined, cityName: undefined },
        options.signal
      );
      for (const it of items) {
        const key = `${it.osm_type}:${it.osm_id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const b = nominatimToBase(it, sector, geo.displayName);
        if (b.name) baseBusinesses.push(b);
      }
      if (baseBusinesses.length >= 200) break;
    }
    if (baseBusinesses.some((b) => b.source === "openstreetmap")) {
      sources.push("openstreetmap");
    }
  }

  if (baseBusinesses.length === 0) {
    throw new Error(
      `Aucun business trouvé pour "${sector}" à "${location}".`
    );
  }

  // Step 4: Enrich only a few (max 10) via reverse geocoding
  const toEnrich = baseBusinesses
    .filter((b) => b.latitude && b.longitude && (!b.phone || !b.website || !b.openingHours))
    .slice(0, 10);
  for (const b of toEnrich) {
    if (options.signal?.aborted) break;
    const lat = parseFloat(b.latitude!);
    const lon = parseFloat(b.longitude!);
    const data = await reverseGeocode(lat, lon, options.signal);
    if (data && data.extratags) {
      const t = data.extratags;
      const addr = data.address || {};
      b.subcategory = b.subcategory || t.cuisine || data.type || null;
      b.phone = b.phone || t.phone || t["contact:phone"] || null;
      b.website = b.website || t.website || t["contact:website"] || t.url || null;
      b.email = b.email || t.email || t["contact:email"] || null;
      b.openingHours = b.openingHours || t.opening_hours || null;
      b.cuisine = b.cuisine || t.cuisine || null;
      b.description = b.description || t.description || t.note || null;
      b.wheelchair = b.wheelchair || t.wheelchair || null;
      b.wifi = b.wifi || t.wifi || null;
      b.outdoorSeating = b.outdoorSeating || t.outdoor_seating || null;
      b.delivery = b.delivery || t["delivery:food"] || t.delivery || null;
      b.takeaway = b.takeaway || t.takeaway || null;
      b.reservation = b.reservation || t.reservation || null;
      b.parking = b.parking || t.parking || null;
      b.airConditioning = b.airConditioning || t.air_conditioning || null;
      b.housenumber = b.housenumber || addr.house_number || null;
      b.street = b.street || addr.road || null;
      b.postcode = b.postcode || addr.postcode || null;
      b.city = b.city || addr.city || addr.town || addr.village || null;
      b.country = b.country || addr.country || null;
      b.address = b.address || [addr.house_number, addr.road, addr.postcode, addr.city].filter(Boolean).join(", ");
      b.extraTags = JSON.stringify(t);
      b.wikidataId = b.wikidataId || t.wikidata || null;
      b.wikipedia = b.wikipedia || t.wikipedia || null;
    }
  }

  // Step 5: Wikipedia enrichment for top results (only 2)
  for (const b of baseBusinesses.filter((b) => b.wikidataId).slice(0, 2)) {
    if (options.signal?.aborted) break;
    const w = await fetchWikipedia(b.wikidataId!, options.signal);
    if (w) {
      b.wikipedia = w.url;
      if (!b.description) b.description = w.description;
    }
  }

  // Compute detail count and popularity
  for (const b of baseBusinesses) {
    b.detailCount = countDetails(b);
    b.popularity = computePopularity(b);
  }
  // Sort by popularity
  baseBusinesses.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  const note =
    `${baseBusinesses.length} business collectés via ${sources.join(" + ")} (Photon + Nominatim + reverse geocoding). ` +
    `Chaque fiche est enrichie avec les tags OSM détaillés. ` +
    `Chaque business est lié à Bing Maps, OpenStreetMap et Google Maps.`;

  return {
    businesses: baseBusinesses,
    sources,
    note,
    total: baseBusinesses.length,
    enriched: baseBusinesses.filter((b) => b.detailCount > 0).length,
  };
}
