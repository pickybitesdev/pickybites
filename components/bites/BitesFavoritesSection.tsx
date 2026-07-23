import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import type { FavoriteDishItem, FavoriteRestaurantItem } from "@/lib/favorites";
import type { FavoritesSubSegment } from "@/hooks/useBitesFavorites";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { cn } from "@/lib/utils";

const SUB_SEGMENTS: { value: FavoritesSubSegment; label: string }[] = [
  { value: "restaurants", label: "Restaurants" },
  { value: "dishes", label: "Dishes" },
];

export function BitesFavoritesSection({
  subSegment,
  onSubSegmentChange,
  restaurantItems,
  dishItems,
  isEmpty,
  isFilterEmpty,
  hasSearch,
  onUnfavoriteRestaurant,
  onUnfavoriteDish,
  onOpenJournal,
}: {
  subSegment: FavoritesSubSegment;
  onSubSegmentChange: (value: FavoritesSubSegment) => void;
  restaurantItems: FavoriteRestaurantItem[];
  dishItems: FavoriteDishItem[];
  isEmpty: boolean;
  isFilterEmpty: boolean;
  hasSearch: boolean;
  onUnfavoriteRestaurant: (restaurantId: string) => void;
  onUnfavoriteDish: (dishId: string) => void;
  onOpenJournal: () => void;
}) {
  const colors = useThemedColors();

  if (isEmpty) {
    return (
      <EmptyState
        icon="heart-outline"
        title="No Loves yet"
        description="Tap the heart on a restaurant page or Journal card to keep it here."
        actionLabel="Open Journal"
        onAction={onOpenJournal}
      />
    );
  }

  const items = subSegment === "restaurants" ? restaurantItems : dishItems;

  return (
    <View className="gap-4">
      <SegmentedControl
        options={SUB_SEGMENTS}
        value={subSegment}
        onChange={onSubSegmentChange}
        variant="brand"
      />

      {isFilterEmpty || items.length === 0 ? (
        <EmptyState
          icon={hasSearch ? "search-outline" : "heart-outline"}
          title={hasSearch ? "No matches" : `No loved ${subSegment} yet`}
          description={
            hasSearch
              ? "Try a different search term."
              : subSegment === "restaurants"
                ? "Heart restaurants from a restaurant page or your Journal."
                : "Heart dishes from a Bite detail."
          }
        />
      ) : subSegment === "restaurants" ? (
        <View className="gap-3">
          {(items as FavoriteRestaurantItem[]).map((item) => (
            <Pressable
              key={item.favoriteId}
              onPress={() => router.push(`/restaurant/${item.restaurantId}`)}
              className={cn("flex-row overflow-hidden rounded-2xl", ui.surface.card)}
            >
              {item.restaurant.imageUrl ? (
                <Image
                  source={{ uri: item.restaurant.imageUrl }}
                  style={{ width: 80, height: 80 }}
                  contentFit="cover"
                />
              ) : (
                <View className={cn("w-20 h-20 items-center justify-center", ui.surface.muted)}>
                  <Ionicons name="restaurant-outline" size={20} color={colors.iconMuted} />
                </View>
              )}
              <View className="flex-1 flex-row items-center justify-between p-3 gap-2">
                <View className="flex-1 gap-0.5">
                  <Text className={`text-base font-semibold ${ui.text.primary}`} numberOfLines={1}>
                    {item.restaurant.name}
                  </Text>
                  <Text className={`text-xs ${ui.text.muted}`} numberOfLines={1}>
                    {item.restaurant.cuisine}
                    {item.restaurant.city ? ` · ${item.restaurant.city}` : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onUnfavoriteRestaurant(item.restaurantId)}
                  hitSlop={8}
                  accessibilityLabel="Remove favorite"
                >
                  <Ionicons name="heart" size={20} color={colors.brand} />
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="gap-3">
          {(items as FavoriteDishItem[]).map((item) => (
            <Pressable
              key={item.favoriteId}
              onPress={() => router.push(`/dish/${item.dishId}`)}
              className={cn("flex-row overflow-hidden rounded-2xl", ui.surface.card)}
            >
              {item.dish.photoUrl ? (
                <Image
                  source={{ uri: item.dish.photoUrl }}
                  style={{ width: 80, height: 80 }}
                  contentFit="cover"
                />
              ) : (
                <View className={cn("w-20 h-20 items-center justify-center", ui.surface.muted)}>
                  <Ionicons name="fast-food-outline" size={20} color={colors.iconMuted} />
                </View>
              )}
              <View className="flex-1 flex-row items-center justify-between p-3 gap-2">
                <View className="flex-1 gap-0.5">
                  <Text className={`text-base font-semibold ${ui.text.primary}`} numberOfLines={1}>
                    {item.dish.name}
                  </Text>
                  <Text className={`text-xs ${ui.text.muted}`} numberOfLines={1}>
                    {item.restaurant?.name ?? "Unknown restaurant"}
                    {` · ${item.dish.ratingValue}/${item.dish.ratingMax}`}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onUnfavoriteDish(item.dishId)}
                  hitSlop={8}
                  accessibilityLabel="Remove favorite"
                >
                  <Ionicons name="heart" size={20} color={colors.brand} />
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
