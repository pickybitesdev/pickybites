import { memo, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice, formatDistance } from "@/lib/utils";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { brandColors } from "@/constants/branding";
import { wantToTryBookmarkLabel } from "@/lib/bites";
import { hapticLight } from "@/lib/haptics";
import {
  DISCOVER_FLOATING_SHADOW,
  DISCOVER_RESULT_CARD_HEIGHT,
  DISCOVER_RESULT_IMAGE_HEIGHT,
  DISCOVER_TRAY_CORNER_RADIUS,
} from "@/lib/discover-tray";

export type DiscoverResultCardProps = {
  name: string;
  cuisine?: string | null;
  imageUrl?: string | null;
  priceLevel?: number | null;
  priceLevelKnown?: boolean;
  distanceMeters?: number | null;
  rating?: number | null;
  yelpRating?: number | null;
  yelpReviewCount?: number | null;
  matchPercent?: number | null;
  openNow?: boolean | null;
  isBookmarked?: boolean;
  selected?: boolean;
  onOpen: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onDirections?: () => void;
  onAddToList?: () => void;
  width: number;
};

/** Primary line: cuisine · distance · price (skip empties). */
export function buildPrimaryMetaParts({
  cuisine,
  distance,
  price,
}: {
  cuisine?: string | null;
  distance?: string | null;
  price?: string | null;
}): string[] {
  return [cuisine, distance, price].filter((p): p is string => Boolean(p));
}

/** Secondary line: ★ rating · Open now|Closed (skip empties). */
export function buildSecondaryMetaParts({
  rating,
  openNow,
}: {
  rating?: number | null;
  openNow?: boolean | null;
}): { kind: "rating" | "open"; text: string }[] {
  const parts: { kind: "rating" | "open"; text: string }[] = [];
  if (rating != null) parts.push({ kind: "rating", text: `★ ${rating.toFixed(1)}` });
  if (openNow != null) {
    parts.push({ kind: "open", text: openNow ? "Open now" : "Closed" });
  }
  return parts;
}

export function buildCardAccessibilityLabel({
  name,
  openNow,
  selected,
}: {
  name: string;
  openNow?: boolean | null;
  selected?: boolean;
}): string {
  const bits = [name];
  if (openNow != null) bits.push(openNow ? "Open now" : "Closed");
  if (selected) bits.push("selected");
  return `${bits.join(", ")}. Opens restaurant details`;
}

function ActionButton({
  label,
  icon,
  onPress,
  accessibilityLabel,
  active,
  testID,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      hitSlop={6}
      style={({ pressed }) => [
        styles.actionBtn,
        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={[styles.actionIcon, active && styles.actionIconActive]} pointerEvents="none">
        <Ionicons
          name={icon}
          size={20}
          color={active ? "#FFFFFF" : brandColors.primary}
        />
      </View>
      <Text
        style={[styles.actionLabel, active && styles.actionLabelActive]}
        numberOfLines={1}
        pointerEvents="none"
      >
        {label}
      </Text>
    </Pressable>
  );
}

export const DiscoverResultCard = memo(function DiscoverResultCard({
  name,
  cuisine,
  imageUrl,
  priceLevel,
  priceLevelKnown,
  distanceMeters,
  rating,
  openNow,
  isBookmarked,
  selected,
  onOpen,
  onBookmark,
  onShare,
  onDirections,
  onAddToList,
  width,
}: DiscoverResultCardProps) {
  const colors = useThemedColors();
  const [imageStatus, setImageStatus] = useState<"loading" | "loaded" | "error">(
    imageUrl ? "loading" : "error",
  );

  useEffect(() => {
    setImageStatus(imageUrl ? "loading" : "error");
  }, [imageUrl]);

  const price = priceLevelKnown && priceLevel ? formatPrice(priceLevel) : null;
  const primaryParts = buildPrimaryMetaParts({
    cuisine,
    distance: distanceMeters != null ? formatDistance(distanceMeters) : null,
    price,
  });
  const primaryMeta = primaryParts.join(" · ");
  const secondaryParts = buildSecondaryMetaParts({ rating, openNow });
  const a11yLabel = buildCardAccessibilityLabel({ name, openNow, selected });
  const showImage = Boolean(imageUrl) && imageStatus !== "error";

  return (
    <View
      testID="discover-result-card"
      style={[
        styles.card,
        {
          width,
          borderColor: selected ? brandColors.primarySoft : brandColors.border,
          backgroundColor: brandColors.surface,
          ...DISCOVER_FLOATING_SHADOW,
        },
      ]}
    >
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityState={{ selected: !!selected }}
        accessibilityLabel={a11yLabel}
        style={{ flex: 1 }}
      >
        <View style={styles.imageWrap}>
          {showImage ? (
            <>
              <Image
                source={{ uri: imageUrl! }}
                style={styles.image}
                contentFit="cover"
                transition={200}
                onLoad={() => setImageStatus("loaded")}
                onError={() => setImageStatus("error")}
              />
              {imageStatus === "loading" ? (
                <View
                  style={[styles.image, styles.imageLoading]}
                  testID="discover-result-card-image-loading"
                />
              ) : null}
              {imageStatus === "loaded" ? (
                <LinearGradient
                  colors={["transparent", "rgba(36,31,29,0.35)"]}
                  style={styles.imageGradient}
                  pointerEvents="none"
                />
              ) : null}
            </>
          ) : (
            <View style={[styles.image, styles.imageFallback]} testID="discover-result-card-image-fallback">
              <Ionicons name="restaurant" size={32} color={colors.brand} />
            </View>
          )}
        </View>

        <View style={styles.bodyDetails}>
          <View style={styles.details}>
            <Text
              className={`font-bold text-[16px] leading-5 ${ui.text.primary}`}
              numberOfLines={2}
            >
              {name}
            </Text>
            {primaryMeta ? (
              <Text
                className={`text-[12px] ${ui.text.secondary}`}
                numberOfLines={1}
                testID="discover-result-primary-meta"
              >
                {primaryMeta}
              </Text>
            ) : null}
            {secondaryParts.length > 0 ? (
              <View style={styles.metaRow} testID="discover-result-secondary-meta">
                {secondaryParts.map((part, index) => (
                  <View key={`${part.kind}-${part.text}`} style={styles.metaPart}>
                    {index > 0 ? (
                      <Text className={`text-[12px] ${ui.text.muted}`}> · </Text>
                    ) : null}
                    {part.kind === "open" ? (
                      <Text
                        style={{
                          color: openNow ? brandColors.success : brandColors.warning,
                        }}
                        className="text-[12px] font-medium"
                        testID="discover-result-open-status"
                      >
                        {part.text}
                      </Text>
                    ) : (
                      <Text className={`text-[12px] font-semibold ${ui.text.primary}`}>
                        {part.text}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      {/* Actions sit outside the open-pressable so Save / List / Share always receive taps. */}
      <View style={styles.actionsPad} accessibilityRole="toolbar">
        <View style={styles.actionsRow}>
          {onDirections ? (
            <ActionButton
              label="Directions"
              icon="navigate"
              onPress={onDirections}
              accessibilityLabel={`Get directions to ${name}`}
              testID="discover-result-directions"
            />
          ) : null}
          {onAddToList ? (
            <ActionButton
              label="List"
              icon="list-outline"
              onPress={onAddToList}
              accessibilityLabel={`Add ${name} to a list`}
              testID="discover-result-add-to-list"
            />
          ) : null}
          {onShare ? (
            <ActionButton
              label="Share"
              icon="share-outline"
              onPress={onShare}
              accessibilityLabel={`Share ${name}`}
              testID="discover-result-share"
            />
          ) : null}
          {onBookmark ? (
            <ActionButton
              label={isBookmarked ? "Saved" : "Try Next"}
              icon={isBookmarked ? "bookmark" : "bookmark-outline"}
              onPress={onBookmark}
              accessibilityLabel={wantToTryBookmarkLabel(!!isBookmarked)}
              active={!!isBookmarked}
              testID="discover-result-save"
            />
          ) : null}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    height: DISCOVER_RESULT_CARD_HEIGHT,
    borderWidth: 1,
    borderRadius: DISCOVER_TRAY_CORNER_RADIUS,
    overflow: "hidden",
    backgroundColor: brandColors.surface,
  },
  imageWrap: {
    width: "100%",
    flex: 1,
    minHeight: DISCOVER_RESULT_IMAGE_HEIGHT,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: brandColors.primaryLight,
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brandColors.primaryLight,
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "25%",
  },
  bodyDetails: {
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 2,
  },
  actionsPad: {
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  details: {
    gap: 2,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 2,
  },
  metaPart: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brandColors.primaryLight,
  },
  actionIconActive: {
    backgroundColor: brandColors.primary,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: brandColors.textSecondary,
    textAlign: "center",
  },
  actionLabelActive: {
    color: brandColors.primary,
    fontWeight: "700",
  },
});
