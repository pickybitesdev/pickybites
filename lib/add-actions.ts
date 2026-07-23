import type { Href } from "expo-router";
import type { Bookmark, Cuisine, PriceLevel } from "@/lib/types";
import type { PlaceResult } from "@/lib/places/types";
import type { AddBiteDraft } from "@/lib/add-bite-draft";
import { createEmptyDraft } from "@/lib/add-bite-draft";
import type { Restaurant } from "@/lib/types";

export type AddAction = {
  href: Href;
  title: string;
  description: string;
};

/** Primary create entry — center plus opens New Post. Secondary deep links remain. */
export const ADD_BITE_HREF: Href = "/add-bite";

export type AddBitePrefillParams = {
  restaurantId?: string | null;
  bookmarkId?: string | null;
};

/** New posts / ratings go here. Prefill via restaurantId and/or bookmarkId. */
export function addBiteHref(opts?: string | null | AddBitePrefillParams): Href {
  if (opts == null || opts === "") return ADD_BITE_HREF;

  if (typeof opts === "string") {
    return { pathname: "/add-bite", params: { restaurantId: opts } };
  }

  const params: Record<string, string> = {};
  if (opts.restaurantId) params.restaurantId = opts.restaurantId;
  if (opts.bookmarkId) params.bookmarkId = opts.bookmarkId;
  if (!Object.keys(params).length) return ADD_BITE_HREF;
  return { pathname: "/add-bite", params };
}

/** Build a PlaceResult from a saved Try Next / Visited bookmark. */
export function placeResultFromBookmark(bookmark: Bookmark): PlaceResult | null {
  if (
    !bookmark.googlePlaceId ||
    bookmark.latitude == null ||
    bookmark.longitude == null ||
    !Number.isFinite(bookmark.latitude) ||
    !Number.isFinite(bookmark.longitude)
  ) {
    return null;
  }

  return {
    googlePlaceId: bookmark.googlePlaceId,
    name: bookmark.placeName,
    address: bookmark.placeAddress,
    city: bookmark.placeCity,
    cuisine: (bookmark.placeCuisine as Cuisine) || "American",
    priceLevel: (bookmark.placePriceLevel as PriceLevel) || 2,
    priceLevelKnown: bookmark.placePriceLevel != null,
    imageUrl: bookmark.placeImageUrl,
    latitude: bookmark.latitude,
    longitude: bookmark.longitude,
  };
}

/**
 * Prefill New Post restaurant fields from a restaurant row and/or bookmark.
 * Deep-link opens should call this so Visited → Add a Bite always has a place.
 */
export function draftWithRestaurantPrefill(
  base: AddBiteDraft,
  opts: {
    restaurant?: Restaurant | null;
    bookmark?: Bookmark | null;
  },
): AddBiteDraft {
  const { restaurant, bookmark } = opts;
  if (restaurant) {
    return {
      ...base,
      mode: "review",
      restaurantId: restaurant.id,
      place: null,
      restaurantName: restaurant.name,
      address: restaurant.address,
      city: restaurant.city,
      cuisine: restaurant.cuisine,
      priceLevel: restaurant.priceLevel,
      ratingMax: 10,
    };
  }

  if (bookmark) {
    const place = placeResultFromBookmark(bookmark);
    return {
      ...base,
      mode: "review",
      restaurantId: bookmark.restaurantId,
      place,
      restaurantName: bookmark.placeName,
      address: bookmark.placeAddress,
      city: bookmark.placeCity,
      cuisine: (bookmark.placeCuisine as Cuisine) || "American",
      priceLevel: (bookmark.placePriceLevel as PriceLevel) || 2,
      ratingMax: 10,
    };
  }

  return base;
}

export function createPrefillDraft(opts: {
  restaurant?: Restaurant | null;
  bookmark?: Bookmark | null;
}): AddBiteDraft {
  return draftWithRestaurantPrefill(createEmptyDraft(), opts);
}

export const ADD_ACTIONS: AddAction[] = [
  {
    href: "/add-bite",
    title: "Add a Bite",
    description: "Photos, place, caption, rating — share to Feed or keep in Bites",
  },
  {
    href: "/add-dish",
    title: "Quick Dish Log",
    description: "Add a dish to an existing review",
  },
];
