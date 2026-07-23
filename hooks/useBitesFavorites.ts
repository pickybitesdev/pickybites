import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getFavoriteDishes, getFavoriteRestaurants } from "@/lib/favorites";
import {
  applyFavoriteDishFilters,
  applyFavoriteRestaurantFilters,
  type BitesFilterState,
} from "@/lib/bites-filters";
import { matchesFavoriteDish, matchesFavoriteRestaurant } from "@/lib/bites-search";
import {
  sortFavoriteDishes,
  sortFavoriteRestaurants,
  type FavoritesSort,
} from "@/lib/bites-sort";

export type FavoritesSubSegment = "restaurants" | "dishes";

export function useBitesFavorites(
  search: string,
  filters: BitesFilterState,
  sort: FavoritesSort,
  subSegment: FavoritesSubSegment,
) {
  const favorites = useAppStore((s) => s.favorites);
  const restaurants = useAppStore((s) => s.restaurants);
  const dishes = useAppStore((s) => s.dishes);
  const toggleRestaurantFavorite = useAppStore((s) => s.toggleRestaurantFavorite);
  const toggleDishFavorite = useAppStore((s) => s.toggleDishFavorite);

  const restaurantItems = useMemo(() => {
    const all = getFavoriteRestaurants(favorites, restaurants);
    const searched = all.filter((i) => matchesFavoriteRestaurant(i, search));
    const filtered = applyFavoriteRestaurantFilters(searched, filters);
    return sortFavoriteRestaurants(filtered, sort);
  }, [favorites, restaurants, search, filters, sort]);

  const dishItems = useMemo(() => {
    const all = getFavoriteDishes(favorites, dishes, restaurants);
    const searched = all.filter((i) => matchesFavoriteDish(i, search));
    const filtered = applyFavoriteDishFilters(searched, filters);
    return sortFavoriteDishes(filtered, sort);
  }, [favorites, dishes, restaurants, search, filters, sort]);

  const allRestaurantCount = useMemo(
    () => getFavoriteRestaurants(favorites, restaurants).length,
    [favorites, restaurants],
  );
  const allDishCount = useMemo(
    () => getFavoriteDishes(favorites, dishes, restaurants).length,
    [favorites, dishes, restaurants],
  );

  const items = subSegment === "restaurants" ? restaurantItems : dishItems;
  const allCount = subSegment === "restaurants" ? allRestaurantCount : allDishCount;

  return {
    restaurantItems,
    dishItems,
    items,
    allCount,
    totalCount: allRestaurantCount + allDishCount,
    isEmpty: allRestaurantCount + allDishCount === 0,
    isFilterEmpty: allCount > 0 && items.length === 0,
    toggleRestaurantFavorite,
    toggleDishFavorite,
  };
}
