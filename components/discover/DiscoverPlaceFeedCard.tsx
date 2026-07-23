import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { PlaceResult } from "@/lib/places/types";
import { formatDistance, formatPrice } from "@/lib/utils";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { hapticLight } from "@/lib/haptics";
import { wantToTryBookmarkLabel } from "@/lib/bites";

/**
 * Full-bleed Discover list card — same visual language as map tray cards (no match %).
 */
export function DiscoverPlaceFeedCard({
  place,
  distanceMeters,
  rating,
  yelpRating,
  yelpReviewCount,
  isBookmarked,
  sectionLabel = "Near you",
  onPress,
  onBookmark,
}: {
  place: PlaceResult;
  distanceMeters?: number | null;
  rating?: number | null;
  /** Kept for callers; not rendered. */
  matchPercent?: number | null;
  yelpRating?: number | null;
  yelpReviewCount?: number | null;
  isBookmarked?: boolean;
  /** Eyebrow above the name (e.g. city after a search jump). */
  sectionLabel?: string;
  onPress: () => void;
  onBookmark?: () => void;
}) {
  const price = place.priceLevelKnown ? formatPrice(place.priceLevel) : null;
  const meta = [
    place.cuisine,
    distanceMeters != null ? formatDistance(distanceMeters) : place.city || null,
    price,
  ]
    .filter(Boolean)
    .join(" · ");

  const openLabel = place.openNow == null ? null : place.openNow ? "Open now" : "Closed";

  return (
    <View
      className="rounded-2xl overflow-hidden border border-savr-100 dark:border-savr-800 bg-white dark:bg-savr-900"
      testID="discover-place-feed-card"
    >
      <Pressable
        onPress={() => {
          hapticLight();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={place.name}
      >
        {place.imageUrl ? (
          <Image
            source={{ uri: place.imageUrl }}
            style={{ width: "100%", aspectRatio: 16 / 9 }}
            contentFit="cover"
          />
        ) : (
          <View className="w-full aspect-[16/9] items-center justify-center bg-savr-100">
            <Ionicons name="restaurant" size={32} color={brandColors.primary} />
          </View>
        )}
      </Pressable>

      <View className="p-3 gap-2">
        <View className="gap-0.5">
          <Text className={`text-[11px] font-semibold uppercase tracking-wide ${ui.text.muted}`}>
            {sectionLabel}
          </Text>
          <Text className={`text-base font-bold ${ui.text.primary}`} numberOfLines={2}>
            {place.name}
          </Text>
          {meta ? <Text className={`text-xs ${ui.text.secondary}`}>{meta}</Text> : null}
        </View>

        <View className="flex-row items-center justify-between pt-1">
          <View className="flex-row items-center gap-3 flex-wrap">
            {rating != null ? (
              <Text className={`text-xs font-semibold ${ui.text.secondary}`}>
                ★ {rating.toFixed(1)}
              </Text>
            ) : null}
            {yelpRating != null ? (
              <Text className={`text-xs ${ui.text.muted}`}>
                Yelp {yelpRating.toFixed(1)}
                {yelpReviewCount != null ? ` (${yelpReviewCount})` : ""}
              </Text>
            ) : null}
            {openLabel ? (
              <Text
                style={{ color: place.openNow ? brandColors.success : brandColors.iconInactive }}
                className="text-xs font-medium"
              >
                {openLabel}
              </Text>
            ) : null}
          </View>
          {onBookmark ? (
            <Pressable
              onPress={onBookmark}
              accessibilityLabel={wantToTryBookmarkLabel(!!isBookmarked)}
              hitSlop={8}
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={20}
                color={brandColors.primary}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
