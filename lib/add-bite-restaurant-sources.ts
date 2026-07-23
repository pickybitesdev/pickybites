import type { Bookmark, Restaurant, Review } from "@/lib/types";
import type { Coordinates, PlaceResult } from "@/lib/places/types";
import { distanceMeters } from "@/lib/location";
import { getPickyBitesScore } from "@/lib/pickybites-score";

export type RestaurantSourceTab = "nearby" | "recent";

export type RestaurantPickItem = {
  key: string;
  name: string;
  cuisine: string;
  city: string;
  address: string;
  imageUrl: string | null;
  distanceMeters: number | null;
  pickybitesScore: number | null;
  restaurantId: string | null;
  place: PlaceResult | null;
};

export function restaurantToPickItem(
  r: Restaurant,
  opts?: { coords?: Coordinates | null; reviews?: Review[] },
): RestaurantPickItem {
  let dist: number | null = null;
  if (
    opts?.coords &&
    r.latitude != null &&
    r.longitude != null &&
    Number.isFinite(r.latitude) &&
    Number.isFinite(r.longitude)
  ) {
    dist = distanceMeters(opts.coords, { latitude: r.latitude, longitude: r.longitude });
  }
  const score = opts?.reviews
    ? getPickyBitesScore(r.id, opts.reviews)
    : { reviewCount: 0, weightedScore: 0 };
  return {
    key: `rest:${r.id}`,
    name: r.name,
    cuisine: r.cuisine,
    city: r.city,
    address: r.address,
    imageUrl: r.imageUrl,
    distanceMeters: dist,
    pickybitesScore: score.reviewCount > 0 ? Math.round(score.weightedScore) : null,
    restaurantId: r.id,
    place: null,
  };
}

export function placeToPickItem(
  place: PlaceResult,
  opts?: { coords?: Coordinates | null; restaurantId?: string | null; pickybitesScore?: number | null },
): RestaurantPickItem {
  let dist: number | null = null;
  if (opts?.coords && Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
    dist = distanceMeters(opts.coords, {
      latitude: place.latitude,
      longitude: place.longitude,
    });
  }
  return {
    key: `place:${place.googlePlaceId}`,
    name: place.name,
    cuisine: place.cuisine,
    city: place.city,
    address: place.address,
    imageUrl: place.imageUrl,
    distanceMeters: dist,
    pickybitesScore: opts?.pickybitesScore ?? null,
    restaurantId: opts?.restaurantId ?? null,
    place,
  };
}

/** Recent = reviewed + bookmarked restaurants, deduped, newest first. */
export function buildRecentRestaurantItems(
  userId: string | null,
  restaurants: Restaurant[],
  reviews: Review[],
  bookmarks: Bookmark[],
  coords?: Coordinates | null,
): RestaurantPickItem[] {
  if (!userId) return [];
  const byId = new Map(restaurants.map((r) => [r.id, r]));
  const scored = new Map<string, { restaurant: Restaurant; sortAt: number }>();

  const myReviews = reviews
    .filter((r) => r.userId === userId)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  for (const rev of myReviews) {
    const restaurant = byId.get(rev.restaurantId);
    if (!restaurant || scored.has(restaurant.id)) continue;
    scored.set(restaurant.id, {
      restaurant,
      sortAt: new Date(rev.createdAt).getTime(),
    });
  }

  const myBookmarks = bookmarks
    .filter((b) => b.userId === userId)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  for (const b of myBookmarks) {
    const restaurant =
      (b.restaurantId ? byId.get(b.restaurantId) : undefined) ??
      restaurants.find((r) => r.googlePlaceId && r.googlePlaceId === b.googlePlaceId);
    if (restaurant) {
      if (scored.has(restaurant.id)) continue;
      scored.set(restaurant.id, {
        restaurant,
        sortAt: new Date(b.createdAt).getTime(),
      });
      continue;
    }
    // Bookmark without linked restaurant row — still show in Recent
    if (!b.placeName.trim()) continue;
    const syntheticKey = `bookmark:${b.id}`;
    if (scored.has(syntheticKey)) continue;
    scored.set(syntheticKey, {
      restaurant: {
        id: syntheticKey,
        name: b.placeName,
        address: b.placeAddress,
        city: b.placeCity,
        cuisine: b.placeCuisine ?? "American",
        priceLevel: b.placePriceLevel ?? 2,
        imageUrl: b.placeImageUrl,
        googlePlaceId: b.googlePlaceId,
        latitude: b.latitude,
        longitude: b.longitude,
        createdAt: b.createdAt,
      },
      sortAt: new Date(b.createdAt).getTime(),
    });
  }

  return [...scored.values()]
    .sort((a, b) => b.sortAt - a.sortAt)
    .slice(0, 40)
    .map(({ restaurant }) => {
      if (restaurant.id.startsWith("bookmark:")) {
        return placeToPickItem(
          {
            googlePlaceId: restaurant.googlePlaceId ?? restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            city: restaurant.city,
            cuisine: restaurant.cuisine,
            priceLevel: restaurant.priceLevel,
            imageUrl: restaurant.imageUrl,
            latitude: restaurant.latitude ?? 0,
            longitude: restaurant.longitude ?? 0,
            openNow: null,
          },
          { coords },
        );
      }
      return restaurantToPickItem(restaurant, { coords, reviews });
    });
}

export function mapNearbyPlacesToItems(
  places: PlaceResult[],
  restaurants: Restaurant[],
  reviews: Review[],
  coords: Coordinates | null,
): RestaurantPickItem[] {
  return places.map((place) => {
    const linked = restaurants.find((r) => r.googlePlaceId === place.googlePlaceId);
    const score = linked ? getPickyBitesScore(linked.id, reviews) : null;
    return placeToPickItem(place, {
      coords,
      restaurantId: linked?.id ?? null,
      pickybitesScore: score && score.reviewCount > 0 ? Math.round(score.weightedScore) : null,
    });
  });
}

export function createMissingPlace(input: {
  name: string;
  city?: string;
  cuisine?: PlaceResult["cuisine"];
}): PlaceResult {
  const name = input.name.trim();
  return {
    googlePlaceId: `manual:${Date.now()}-${name.toLowerCase().replace(/\s+/g, "-").slice(0, 24)}`,
    name,
    address: "",
    city: (input.city ?? "").trim(),
    cuisine: input.cuisine ?? "American",
    priceLevel: 2,
    priceLevelKnown: false,
    imageUrl: null,
    latitude: 0,
    longitude: 0,
    openNow: null,
  };
}

export function pickItemSelectionKey(item: RestaurantPickItem): string {
  return item.restaurantId ? `rest:${item.restaurantId}` : item.key;
}
