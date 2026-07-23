/** Pure Yelp response mappers — unit-testable without Deno / network. */

import type { Cuisine, PriceLevel } from "@/lib/types";
import { CUISINES } from "@/lib/types";
import type { PlaceResult } from "./types";
import type { PlaceSuggestion, ResolvedSearchPlace } from "./autocomplete";

export type YelpEnrichment = {
  yelpId: string;
  rating: number | null;
  reviewCount: number | null;
  url: string | null;
  imageUrl: string | null;
  name: string | null;
};

export type RawYelpBusiness = {
  id?: string;
  name?: string;
  rating?: number;
  review_count?: number;
  url?: string;
  image_url?: string;
  price?: string;
  is_closed?: boolean;
  categories?: { alias?: string; title?: string }[];
  coordinates?: { latitude?: number; longitude?: number };
  location?: {
    address1?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    display_address?: string[];
  };
};

export function yelpPlaceId(yelpId: string): string {
  return yelpId.startsWith("yelp:") ? yelpId : `yelp:${yelpId}`;
}

export function isYelpPlaceId(placeId: string | null | undefined): boolean {
  return Boolean(placeId?.startsWith("yelp:"));
}

export function stripYelpPlaceId(placeId: string): string {
  return placeId.startsWith("yelp:") ? placeId.slice("yelp:".length) : placeId;
}

export function mapYelpBusiness(b: RawYelpBusiness | null | undefined): YelpEnrichment | null {
  if (!b?.id) return null;
  return {
    yelpId: b.id,
    rating: typeof b.rating === "number" ? b.rating : null,
    reviewCount: typeof b.review_count === "number" ? b.review_count : null,
    url: b.url ?? null,
    imageUrl: b.image_url ?? null,
    name: b.name ?? null,
  };
}

/** Soft-fail: any throw / missing data → null enrichment. */
export function safeMapYelpBusiness(b: unknown): YelpEnrichment | null {
  try {
    if (!b || typeof b !== "object") return null;
    return mapYelpBusiness(b as RawYelpBusiness);
  } catch {
    return null;
  }
}

export function priceLevelFromYelp(price?: string | null): { level: PriceLevel; known: boolean } {
  if (!price) return { level: 2, known: false };
  const n = price.length;
  if (n <= 1) return { level: 1, known: true };
  if (n === 2) return { level: 2, known: true };
  if (n === 3) return { level: 3, known: true };
  return { level: 4, known: true };
}

export function cuisineFromYelpCategories(
  categories?: { alias?: string; title?: string }[] | null,
): Cuisine {
  const titles = (categories ?? []).map((c) => (c.title ?? c.alias ?? "").toLowerCase());
  for (const cuisine of CUISINES) {
    if (titles.some((t) => t.includes(cuisine.toLowerCase()))) return cuisine;
  }
  const aliasHints: Record<string, Cuisine> = {
    sushi: "Japanese",
    ramen: "Japanese",
    pizza: "Italian",
    tacos: "Mexican",
    mexican: "Mexican",
    italian: "Italian",
    chinese: "Chinese",
    thai: "Thai",
    indian: "Indian",
    korean: "Korean",
    vietnamese: "Vietnamese",
    greek: "Greek",
    mediterranean: "Mediterranean",
    french: "French",
    caribbean: "Caribbean",
    spanish: "Spanish",
    tapas: "Spanish",
  };
  for (const c of categories ?? []) {
    const key = (c.alias ?? c.title ?? "").toLowerCase();
    for (const [hint, cuisine] of Object.entries(aliasHints)) {
      if (key.includes(hint)) return cuisine;
    }
  }
  return "American";
}

function formatYelpAddress(b: RawYelpBusiness): string {
  const display = b.location?.display_address?.filter(Boolean);
  if (display?.length) return display.join(", ");
  const parts = [b.location?.address1, b.location?.city, b.location?.state].filter(Boolean);
  return parts.join(", ");
}

export function yelpBusinessToPlaceResult(b: RawYelpBusiness | null | undefined): PlaceResult | null {
  if (!b?.id || !b.name) return null;
  const lat = b.coordinates?.latitude;
  const lng = b.coordinates?.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const { level, known } = priceLevelFromYelp(b.price);
  const enrichment = mapYelpBusiness(b);

  return {
    googlePlaceId: yelpPlaceId(b.id),
    name: b.name,
    address: formatYelpAddress(b),
    city: b.location?.city ?? "",
    cuisine: cuisineFromYelpCategories(b.categories),
    priceLevel: level,
    priceLevelKnown: known,
    imageUrl: b.image_url ?? null,
    latitude: lat,
    longitude: lng,
    openNow: typeof b.is_closed === "boolean" ? !b.is_closed : null,
    yelpId: b.id,
    yelpRating: enrichment?.rating ?? null,
    yelpReviewCount: enrichment?.reviewCount ?? null,
    yelpUrl: enrichment?.url ?? null,
  };
}

export function yelpBusinessToSuggestion(b: RawYelpBusiness): PlaceSuggestion | null {
  if (!b.id || !b.name) return null;
  const placeId = yelpPlaceId(b.id);
  return {
    id: placeId,
    placeId,
    primaryText: b.name,
    secondaryText: formatYelpAddress(b) || b.location?.city || "",
    kinds: ["restaurant"],
    kind: "restaurant",
  };
}

export function yelpBusinessToResolved(b: RawYelpBusiness): ResolvedSearchPlace | null {
  const place = yelpBusinessToPlaceResult(b);
  if (!place) return null;
  return {
    placeId: place.googlePlaceId,
    name: place.name,
    address: place.address,
    city: place.city,
    latitude: place.latitude,
    longitude: place.longitude,
    cuisineTypes: [place.cuisine],
    primaryType: "restaurant",
    imageUrl: place.imageUrl,
    priceLevel: place.priceLevel,
    openNow: place.openNow ?? null,
    viewport: null,
    kind: "restaurant",
  };
}
