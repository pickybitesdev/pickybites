import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { PlaceResult, Coordinates } from "./types";
import type { PlaceSuggestion, ResolvedSearchPlace } from "./autocomplete";
import {
  isYelpPlaceId,
  mapYelpBusiness,
  stripYelpPlaceId,
  yelpBusinessToPlaceResult,
  yelpBusinessToResolved,
  yelpBusinessToSuggestion,
  type RawYelpBusiness,
  type YelpEnrichment,
} from "./yelp-map";
import { MOCK_RESTAURANTS } from "@/lib/mock-data";

export type { YelpEnrichment } from "./yelp-map";
export {
  isYelpPlaceId,
  stripYelpPlaceId,
  yelpBusinessToPlaceResult,
  yelpPlaceId,
} from "./yelp-map";

type YelpResponse = {
  enrichment?: YelpEnrichment | null;
  places?: PlaceResult[];
  businesses?: RawYelpBusiness[];
  place?: PlaceResult | null;
  error?: string;
};

const sessionCache = new Map<string, YelpEnrichment | null>();

export function isYelpConfigured(): boolean {
  return isSupabaseConfigured();
}

export function clearYelpEnrichmentCache() {
  sessionCache.clear();
}

async function parseYelpInvokeError(error: unknown, data: YelpResponse | null): Promise<string> {
  if (data?.error) return data.error;
  if (error && typeof error === "object" && "context" in error) {
    try {
      const ctx = (error as { context: Response }).context;
      const body = await ctx.json() as YelpResponse;
      if (body?.error) return body.error;
    } catch {
      // ignore
    }
  }
  if (error instanceof Error) return error.message;
  return "Yelp search failed.";
}

async function invokeYelpRaw(body: Record<string, unknown>): Promise<YelpResponse> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Sign in required to search restaurants.");
  }

  const { data, error } = await supabase.functions.invoke<YelpResponse>("yelp", { body });
  if (error) throw new Error(await parseYelpInvokeError(error, data));
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

async function invokeYelpEnrichment(body: Record<string, unknown>): Promise<YelpEnrichment | null> {
  try {
    const data = await invokeYelpRaw(body);
    return data.enrichment ?? null;
  } catch {
    return null;
  }
}

/** Demo / offline pins when there is no Supabase session (Try Demo). */
export function mockNearbyPlaces(coords: Coordinates, limit = 12): PlaceResult[] {
  return MOCK_RESTAURANTS.slice(0, limit).map((r, i) => {
    const angle = (i / Math.max(limit, 1)) * Math.PI * 2;
    const dist = 0.006 + (i % 4) * 0.003;
    return {
      googlePlaceId: r.googlePlaceId ?? `mock:${r.id}`,
      name: r.name,
      address: r.address,
      city: r.city,
      cuisine: r.cuisine,
      priceLevel: r.priceLevel,
      priceLevelKnown: true,
      imageUrl: r.imageUrl,
      latitude: coords.latitude + Math.cos(angle) * dist,
      longitude: coords.longitude + Math.sin(angle) * dist,
      openNow: true,
    };
  });
}

export async function searchNearbyYelp(
  coords: Coordinates,
  radiusMeters = 1500,
  term = "restaurants",
): Promise<PlaceResult[]> {
  const data = await invokeYelpRaw({
    action: "search",
    latitude: coords.latitude,
    longitude: coords.longitude,
    radiusMeters,
    term,
    limit: 20,
  });

  if (data.places?.length) return data.places;

  return (data.businesses ?? [])
    .map(yelpBusinessToPlaceResult)
    .filter(Boolean) as PlaceResult[];
}

export async function searchYelpSuggestions(
  query: string,
  coords: Coordinates,
  radiusMeters = 25000,
): Promise<PlaceSuggestion[]> {
  const data = await invokeYelpRaw({
    action: "search",
    latitude: coords.latitude,
    longitude: coords.longitude,
    radiusMeters,
    term: query.trim() || "restaurants",
    limit: 8,
  });
  const businesses = data.businesses?.length
    ? data.businesses
    : (data.places ?? []).map((p) => ({
        id: stripYelpPlaceId(p.googlePlaceId),
        name: p.name,
        image_url: p.imageUrl ?? undefined,
        location: { city: p.city, display_address: p.address ? [p.address] : [] },
        coordinates: { latitude: p.latitude, longitude: p.longitude },
      }));

  return businesses.map(yelpBusinessToSuggestion).filter(Boolean) as PlaceSuggestion[];
}

export async function resolveYelpPlace(placeId: string): Promise<ResolvedSearchPlace | null> {
  if (!isYelpPlaceId(placeId)) return null;
  const data = await invokeYelpRaw({
    action: "details",
    yelpId: stripYelpPlaceId(placeId),
  });
  if (data.place) {
    return {
      placeId: data.place.googlePlaceId,
      name: data.place.name,
      address: data.place.address,
      city: data.place.city,
      latitude: data.place.latitude,
      longitude: data.place.longitude,
      cuisineTypes: [data.place.cuisine],
      primaryType: "restaurant",
      imageUrl: data.place.imageUrl,
      priceLevel: data.place.priceLevel,
      openNow: data.place.openNow ?? null,
      viewport: null,
      kind: "restaurant",
    };
  }
  return null;
}

/**
 * Enrich a place with Yelp rating / review count.
 * Soft-fails to null when Supabase/Yelp is unavailable. Skips yelp:* places.
 */
export async function enrichPlaceWithYelp(place: PlaceResult): Promise<YelpEnrichment | null> {
  if (!isYelpConfigured()) return null;
  if (isYelpPlaceId(place.googlePlaceId) || place.yelpId) {
    return place.yelpId
      ? {
          yelpId: place.yelpId,
          rating: place.yelpRating ?? null,
          reviewCount: place.yelpReviewCount ?? null,
          url: place.yelpUrl ?? null,
          imageUrl: place.imageUrl,
          name: place.name,
        }
      : null;
  }

  const cacheKey = place.googlePlaceId;
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey) ?? null;
  }

  try {
    const enrichment = await invokeYelpEnrichment({
      action: "match",
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      city: place.city,
    });
    sessionCache.set(cacheKey, enrichment);
    return enrichment;
  } catch {
    sessionCache.set(cacheKey, null);
    return null;
  }
}

export async function fetchYelpDetails(yelpId: string): Promise<YelpEnrichment | null> {
  if (!isYelpConfigured() || !yelpId) return null;
  try {
    return await invokeYelpEnrichment({ action: "details", yelpId: stripYelpPlaceId(yelpId) });
  } catch {
    return null;
  }
}

/** Batch enrich with limited concurrency (Discover tray). */
export async function enrichPlacesWithYelp(
  places: PlaceResult[],
  concurrency = 4,
): Promise<Map<string, YelpEnrichment>> {
  const out = new Map<string, YelpEnrichment>();
  if (!isYelpConfigured() || places.length === 0) return out;

  const targets = places.filter((p) => !isYelpPlaceId(p.googlePlaceId));
  let i = 0;
  async function worker() {
    while (i < targets.length) {
      const idx = i++;
      const place = targets[idx];
      if (!place) continue;
      const enrichment = await enrichPlaceWithYelp(place);
      if (enrichment) out.set(place.googlePlaceId, enrichment);
    }
  }

  // Seed map with ratings already on Yelp-sourced places.
  for (const place of places) {
    if (!isYelpPlaceId(place.googlePlaceId)) continue;
    if (place.yelpRating == null && place.yelpReviewCount == null) continue;
    out.set(place.googlePlaceId, {
      yelpId: place.yelpId ?? stripYelpPlaceId(place.googlePlaceId),
      rating: place.yelpRating ?? null,
      reviewCount: place.yelpReviewCount ?? null,
      url: place.yelpUrl ?? null,
      imageUrl: place.imageUrl,
      name: place.name,
    });
  }

  const workers = Array.from({ length: Math.min(concurrency, Math.max(targets.length, 1)) }, () => worker());
  await Promise.all(workers);
  return out;
}

/** Test helper re-exports */
export { mapYelpBusiness, yelpBusinessToResolved };
