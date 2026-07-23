import type { Cuisine, PriceLevel } from "@/lib/types";

/** A restaurant from Google Places — not yet in PickyBites DB until user rates or opens it */
export interface PlaceResult {
  googlePlaceId: string;
  name: string;
  address: string;
  city: string;
  cuisine: Cuisine;
  priceLevel: PriceLevel;
  /** True when Google returned a real priceLevel field (not a default guess). */
  priceLevelKnown?: boolean;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  openNow?: boolean | null;
  /** Optional Yelp Fusion enrichment (server-side only). */
  yelpRating?: number | null;
  yelpReviewCount?: number | null;
  yelpUrl?: string | null;
  yelpId?: string | null;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
