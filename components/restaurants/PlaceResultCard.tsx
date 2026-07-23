import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { memo } from "react";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { PlaceResult } from "@/lib/places/types";
import type { Bookmark, Restaurant, Review } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { CommunityRating } from "@/components/restaurants/CommunityRating";
import { RestaurantTagRow } from "@/components/restaurants/RestaurantTagRow";
import { getCommunityRating, getRestaurantCommunityTags } from "@/lib/restaurant-tags";
import { formatPrice, formatDistance, cn } from "@/lib/utils";
import { useThemedColors } from "@/lib/useThemedColors";
import { ui } from "@/constants/ui";

export const PlaceResultCard = memo(function PlaceResultCard({
  place,
  onPress,
  savrRating,
  reviewCount,
  restaurantId,
  reviews = [],
  bookmarks = [],
  restaurants = [],
  userCity,
  distanceMeters,
  isBookmarked,
  onBookmark,
  onAddToList,
}: {
  place: PlaceResult;
  onPress: () => void;
  savrRating?: number;
  reviewCount?: number;
  restaurantId?: string | null;
  reviews?: Review[];
  bookmarks?: Bookmark[];
  restaurants?: Restaurant[];
  userCity?: string | null;
  distanceMeters?: number;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  onAddToList?: () => void;
  index?: number;
}) {
  const colors = useThemedColors();
  const priceLabel = place.priceLevelKnown ? formatPrice(place.priceLevel) : null;

  const linkedRestaurant = restaurantId
    ? restaurants.find((r) => r.id === restaurantId)
    : restaurants.find((r) => r.googlePlaceId === place.googlePlaceId);

  const community = linkedRestaurant
    ? getCommunityRating(linkedRestaurant.id, reviews)
    : { avgRating: savrRating ?? null, reviewCount: reviewCount ?? 0 };

  const tags = linkedRestaurant
    ? getRestaurantCommunityTags(linkedRestaurant, reviews, bookmarks, userCity)
    : [];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} accessibilityRole="button">
      <Card className="p-0 overflow-hidden">
        {place.imageUrl ? (
          <Image
            source={{ uri: place.imageUrl }}
            style={{ width: "100%", height: 132 }}
            contentFit="cover"
            pointerEvents="none"
          />
        ) : (
          <View className={cn("h-[132px] items-center justify-center", ui.surface.muted)} pointerEvents="none">
            <Ionicons name="restaurant" size={32} color={colors.brand} />
          </View>
        )}

        <View className="p-4 gap-2" pointerEvents="box-none">
          <View className="flex-row items-start justify-between gap-2">
            <Text className={`font-semibold text-lg flex-1 ${ui.text.primary}`} numberOfLines={1}>
              {place.name}
            </Text>
            <View className="flex-row items-center gap-0.5">
              {onAddToList && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onAddToList();
                  }}
                  hitSlop={8}
                  className="p-1"
                >
                  <Ionicons name="list-outline" size={20} color={colors.iconMuted} />
                </Pressable>
              )}
              {onBookmark && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onBookmark();
                  }}
                  hitSlop={8}
                  className="p-1"
                >
                  <Ionicons
                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                    size={22}
                    color={isBookmarked ? colors.brand : colors.iconMuted}
                  />
                </Pressable>
              )}
            </View>
          </View>

          <CommunityRating avgRating={community.avgRating} reviewCount={community.reviewCount} size="sm" />

          <Text className={`text-sm ${ui.text.muted}`} numberOfLines={1}>
            {place.cuisine}
            {place.city ? ` · ${place.city}` : ""}
            {priceLabel ? ` · ${priceLabel}` : ""}
          </Text>

          <View className="flex-row flex-wrap items-center gap-2">
            {distanceMeters != null && (
              <View className={cn("px-2.5 py-1 rounded-full", ui.surface.muted)}>
                <Text className={`text-xs font-medium ${ui.text.secondary}`}>
                  {formatDistance(distanceMeters)}
                </Text>
              </View>
            )}
            {place.openNow === true && (
              <View className="bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 rounded-full">
                <Text className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Open</Text>
              </View>
            )}
          </View>

          <RestaurantTagRow tags={tags} />
        </View>
      </Card>
    </TouchableOpacity>
  );
});
