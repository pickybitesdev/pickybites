import type { Dish, Favorite, Restaurant } from "./types";

export type FavoriteRestaurantItem = {
  favoriteId: string;
  restaurantId: string;
  restaurant: Restaurant;
  createdAt: string;
};

export type FavoriteDishItem = {
  favoriteId: string;
  dishId: string;
  dish: Dish;
  restaurant: Restaurant | null;
  createdAt: string;
};

export function isRestaurantFavorited(
  favorites: Favorite[],
  restaurantId: string,
): Favorite | undefined {
  return favorites.find((f) => f.restaurantId === restaurantId);
}

export function isDishFavorited(favorites: Favorite[], dishId: string): Favorite | undefined {
  return favorites.find((f) => f.dishId === dishId);
}

export function getFavoriteRestaurants(
  favorites: Favorite[],
  restaurants: Restaurant[],
): FavoriteRestaurantItem[] {
  const rMap = new Map(restaurants.map((r) => [r.id, r]));
  return favorites
    .filter((f) => f.restaurantId)
    .map((f) => {
      const restaurant = rMap.get(f.restaurantId!);
      if (!restaurant) return null;
      return {
        favoriteId: f.id,
        restaurantId: f.restaurantId!,
        restaurant,
        createdAt: f.createdAt,
      };
    })
    .filter((x): x is FavoriteRestaurantItem => x != null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getFavoriteDishes(
  favorites: Favorite[],
  dishes: Dish[],
  restaurants: Restaurant[],
): FavoriteDishItem[] {
  const dMap = new Map(dishes.map((d) => [d.id, d]));
  const rMap = new Map(restaurants.map((r) => [r.id, r]));
  return favorites
    .filter((f) => f.dishId)
    .map((f) => {
      const dish = dMap.get(f.dishId!);
      if (!dish) return null;
      return {
        favoriteId: f.id,
        dishId: f.dishId!,
        dish,
        restaurant: rMap.get(dish.restaurantId) ?? null,
        createdAt: f.createdAt,
      };
    })
    .filter((x): x is FavoriteDishItem => x != null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
