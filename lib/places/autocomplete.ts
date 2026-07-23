import type { Coordinates } from "@/lib/places/types";

export const AUTOCOMPLETE_DEBOUNCE_MS = 300;
export const AUTOCOMPLETE_MIN_CHARS = 2;

export type PlaceSuggestionKind = "restaurant" | "area" | "address" | "other";

export type PlaceSuggestion = {
  id: string;
  placeId: string;
  primaryText: string;
  secondaryText: string;
  kinds: string[];
  kind: PlaceSuggestionKind;
};

export type ResolvedSearchPlace = {
  placeId: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  cuisineTypes: string[];
  primaryType?: string | null;
  imageUrl: string | null;
  priceLevel?: string | number | null;
  openNow?: boolean | null;
  viewport?: {
    low: Coordinates;
    high: Coordinates;
  } | null;
  kind: PlaceSuggestionKind;
};

const RESTAURANT_TYPES = new Set([
  "restaurant",
  "cafe",
  "bakery",
  "meal_takeaway",
  "meal_delivery",
  "bar",
  "food",
]);

const AREA_TYPES = new Set([
  "locality",
  "sublocality",
  "sublocality_level_1",
  "neighborhood",
  "administrative_area_level_1",
  "administrative_area_level_2",
  "administrative_area_level_3",
  "postal_code",
  "colloquial_area",
  "political",
]);

const ADDRESS_TYPES = new Set([
  "street_address",
  "route",
  "premise",
  "subpremise",
  "geocode",
]);

export function createAutocompleteSessionToken(): string {
  // UUID v4 — Google recommends this for Places Autocomplete sessions.
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function classifyPlaceTypes(types: string[] | undefined | null): PlaceSuggestionKind {
  const list = types ?? [];
  if (list.some((t) => RESTAURANT_TYPES.has(t) || t.endsWith("_restaurant"))) {
    return "restaurant";
  }
  // Cities often arrive as geocode + locality/political — treat as areas.
  if (list.some((t) => AREA_TYPES.has(t))) return "area";
  if (list.some((t) => ADDRESS_TYPES.has(t))) return "address";
  return "other";
}

/** True when the suggestion looks like a city/state/neighborhood for the typed query. */
export function looksLikeAreaMatch(suggestion: PlaceSuggestion, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const primary = suggestion.primaryText.trim().toLowerCase();
  if (suggestion.kind === "area") return true;
  if (suggestion.kinds.some((t) => AREA_TYPES.has(t))) return true;
  // "New York, NY, USA" / "New York State" style geocodes
  if (
    suggestion.kind === "address" &&
    (primary === q ||
      primary.startsWith(`${q},`) ||
      primary.startsWith(`${q} `) ||
      primary.includes(" state"))
  ) {
    return true;
  }
  return false;
}

export function normalizePlaceResourceId(placeIdOrName: string): string {
  return placeIdOrName.replace(/^places\//, "");
}

export function mapAutocompleteSuggestion(raw: {
  placePrediction?: {
    place?: string;
    placeId?: string;
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
    types?: string[];
  };
}): PlaceSuggestion | null {
  const pred = raw.placePrediction;
  if (!pred) return null;
  const placeId = normalizePlaceResourceId(pred.placeId ?? pred.place ?? "");
  if (!placeId) return null;
  const primaryText =
    pred.structuredFormat?.mainText?.text?.trim() ||
    pred.text?.text?.trim() ||
    "";
  if (!primaryText) return null;
  const secondaryText = pred.structuredFormat?.secondaryText?.text?.trim() ?? "";
  const kinds = pred.types ?? [];
  return {
    id: placeId,
    placeId,
    primaryText,
    secondaryText,
    kinds,
    kind: classifyPlaceTypes(kinds),
  };
}

export function shouldFetchAutocomplete(query: string, minChars = AUTOCOMPLETE_MIN_CHARS): boolean {
  return query.trim().length >= minChars;
}

/** Landmarks/venues that clutter Discover city/restaurant search. */
const DISCOVER_NOISE_TYPES = new Set([
  "stadium",
  "arena",
  "lodging",
  "hotel",
  "motel",
  "resort_hotel",
  "aquarium",
  "museum",
  "tourist_attraction",
  "amusement_park",
  "zoo",
  "shopping_mall",
  "department_store",
  "movie_theater",
  "gym",
  "hospital",
  "school",
  "university",
  "primary_school",
  "secondary_school",
  "church",
  "place_of_worship",
  "parking",
  "airport",
  "transit_station",
  "bus_station",
  "train_station",
  "subway_station",
]);

export const DISCOVER_SUGGESTION_LIMIT = 5;

function suggestionScore(s: PlaceSuggestion, query: string): number {
  const q = query.trim().toLowerCase();
  const primary = s.primaryText.trim().toLowerCase();
  const areaMatch = looksLikeAreaMatch(s, query);

  // Exact/prefix city matches always win over "Russo's New York Pizzeria".
  if (areaMatch && (primary === q || primary.startsWith(`${q},`) || primary.startsWith(`${q} `))) {
    return 0;
  }
  if (areaMatch || s.kind === "area") return 1;
  if (s.kind === "restaurant") {
    // Demote restaurants that only match because the query appears in the name
    // while the venue is clearly elsewhere (secondary text differs a lot).
    if (q && primary.includes(q) && s.secondaryText && !s.secondaryText.toLowerCase().includes(q)) {
      return 5;
    }
    return 2;
  }
  if (s.kind === "address") return 3;
  return 4;
}

/**
 * Prefer cities/neighborhoods for Discover place jumps, then restaurants.
 * Drop stadiums, hotels, aquariums, etc. Cap to a short list.
 */
export function rankDiscoverSuggestions(
  suggestions: PlaceSuggestion[],
  query = "",
  limit = DISCOVER_SUGGESTION_LIMIT,
): PlaceSuggestion[] {
  const filtered = suggestions.filter((s) => {
    if (s.kinds.some((t) => DISCOVER_NOISE_TYPES.has(t))) return false;
    if (s.kind === "other" && !looksLikeAreaMatch(s, query)) return false;
    return true;
  });
  const hasAreaMatch = filtered.some((s) => looksLikeAreaMatch(s, query));
  const ranked = filtered.filter((s) => {
    // When jumping cities, hide local restaurants that only match the query in their name.
    if (!hasAreaMatch) return true;
    return suggestionScore(s, query) < 5;
  });
  return [...ranked]
    .sort((a, b) => suggestionScore(a, query) - suggestionScore(b, query))
    .slice(0, limit);
}
