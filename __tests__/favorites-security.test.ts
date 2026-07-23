import {
  isRestaurantFavorited,
  isDishFavorited,
  getFavoriteRestaurants,
  getFavoriteDishes,
} from "@/lib/favorites";
import type { Dish, Favorite, Restaurant } from "@/lib/types";

/**
 * Security / ownership helpers for favorites:
 * favorites are always scoped by userId in fetch + RLS; these assert
 * client-side uniqueness and XOR restaurant/dish shape.
 */
describe("favorites security shape", () => {
  it("enforces restaurant XOR dish on favorited lookups", () => {
    const favorites: Favorite[] = [
      { id: "1", userId: "owner", restaurantId: "r1", dishId: null, createdAt: "2024-01-01" },
      { id: "2", userId: "owner", restaurantId: null, dishId: "d1", createdAt: "2024-01-02" },
      { id: "3", userId: "other", restaurantId: "r1", dishId: null, createdAt: "2024-01-03" },
    ];
    const mine = favorites.filter((f) => f.userId === "owner");
    expect(isRestaurantFavorited(mine, "r1")?.id).toBe("1");
    expect(isDishFavorited(mine, "d1")?.id).toBe("2");
    expect(isRestaurantFavorited(mine, "r1")?.userId).toBe("owner");
  });

  it("does not leak other users restaurants into favorite lists when filtered by owner data", () => {
    const favorites: Favorite[] = [
      { id: "1", userId: "owner", restaurantId: "r1", dishId: null, createdAt: "2024-01-01" },
    ];
    const restaurants: Restaurant[] = [
      {
        id: "r1",
        name: "Mine",
        address: "",
        city: "LA",
        cuisine: "Mexican",
        priceLevel: 2,
        imageUrl: null,
        googlePlaceId: null,
        latitude: null,
        longitude: null,
        createdAt: "2024-01-01",
      },
      {
        id: "r2",
        name: "Other",
        address: "",
        city: "SF",
        cuisine: "Italian",
        priceLevel: 2,
        imageUrl: null,
        googlePlaceId: null,
        latitude: null,
        longitude: null,
        createdAt: "2024-01-01",
      },
    ];
    expect(getFavoriteRestaurants(favorites, restaurants)).toHaveLength(1);
  });

  it("resolves dish favorites only when dish exists", () => {
    const favorites: Favorite[] = [
      { id: "1", userId: "owner", restaurantId: null, dishId: "d1", createdAt: "2024-01-01" },
      { id: "2", userId: "owner", restaurantId: null, dishId: "missing", createdAt: "2024-01-02" },
    ];
    const dishes: Dish[] = [
      {
        id: "d1",
        reviewId: "rev1",
        restaurantId: "r1",
        name: "Taco",
        rating: 9,
        ratingValue: 9,
        ratingMax: 10,
        normalizedRating: 90,
        notes: "",
        photoUrl: null,
        isBestDish: true,
        createdAt: "2024-01-01",
      },
    ];
    const restaurants: Restaurant[] = [];
    expect(getFavoriteDishes(favorites, dishes, restaurants)).toHaveLength(1);
  });
});
