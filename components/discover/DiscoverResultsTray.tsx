import { useEffect, useMemo, useCallback, useState, type RefObject } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import type { PlaceResult } from "@/lib/places/types";
import type { Coordinates } from "@/lib/places/types";
import { DiscoverMapListToggle } from "@/components/discover/DiscoverMapListToggle";
import {
  DiscoverResultsCarousel,
  type DiscoverCarouselItem,
  type DiscoverResultsCarouselHandle,
} from "@/components/discover/DiscoverResultsCarousel";
import type { DiscoverViewMode } from "@/lib/discover-view";
import {
  DISCOVER_EXPAND_PILL_HEIGHT,
  DISCOVER_EXPAND_PILL_MAX_WIDTH,
  DISCOVER_EXPAND_PILL_RADIUS,
  DISCOVER_FLOATING_SHADOW,
  DISCOVER_TRAY_CORNER_RADIUS,
  EMPTY_TRAY_MESSAGE,
  expandResultsLabel,
  expandedTrayHeight,
  nearbyHeaderLabel,
  trayBottomOffset,
} from "@/lib/discover-tray";
import { ui } from "@/constants/ui";
import { brandColors } from "@/constants/branding";
import { Button } from "@/components/ui/Button";
import { hapticSelection } from "@/lib/haptics";

/** Soft spring — lower stiffness / higher damping = less bounce jank. */
const SPRING = { damping: 28, stiffness: 220, mass: 0.9, overshootClamping: false };
const SCREEN_W = Dimensions.get("window").width;

export function DiscoverResultsTray({
  resultCount,
  items,
  selectedId,
  coords,
  expanded,
  onExpandedChange,
  viewMode,
  onViewModeChange,
  onSelectId,
  onOpen,
  onBookmark,
  onShare,
  onDirections,
  onAddToList,
  onClearFilters,
  onSearchWider,
  carouselRef,
}: {
  resultCount: number;
  items: DiscoverCarouselItem[];
  selectedId: string | null;
  coords: Coordinates | null;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  viewMode: DiscoverViewMode;
  onViewModeChange: (mode: DiscoverViewMode) => void;
  onSelectId: (id: string) => void;
  onOpen: (place: PlaceResult) => void;
  onBookmark: (place: PlaceResult) => void;
  onShare?: (place: PlaceResult) => void;
  onDirections?: (place: PlaceResult) => void;
  onAddToList?: (place: PlaceResult) => void;
  onClearFilters: () => void;
  onSearchWider: () => void;
  carouselRef?: RefObject<DiscoverResultsCarouselHandle | null>;
}) {
  const insets = useSafeAreaInsets();
  const bottom = trayBottomOffset(insets.bottom);
  const windowHeight = Dimensions.get("window").height;
  const expandedH = useMemo(
    () => expandedTrayHeight(windowHeight, 160, 0.52, bottom),
    [windowHeight, bottom],
  );

  /** 0 = collapsed pill, 1 = fully expanded tray. */
  const progress = useSharedValue(expanded ? 1 : 0);
  const startProgress = useSharedValue(expanded ? 1 : 0);
  /** Keep tray content mounted after first open so re-expand doesn't remount FlatList mid-spring. */
  const [trayContentMounted, setTrayContentMounted] = useState(expanded);

  const notifyCollapsed = useCallback(() => {
    onExpandedChange(false);
  }, [onExpandedChange]);

  const notifyExpanded = useCallback(() => {
    setTrayContentMounted(true);
    onExpandedChange(true);
  }, [onExpandedChange]);

  const expandToTray = useCallback(() => {
    setTrayContentMounted(true);
    hapticSelection();
    progress.value = withSpring(1, SPRING);
    notifyExpanded();
  }, [notifyExpanded, progress]);

  const collapseToPill = useCallback(() => {
    hapticSelection();
    progress.value = withSpring(0, SPRING, (finished) => {
      if (finished) runOnJS(notifyCollapsed)();
    });
  }, [notifyCollapsed, progress]);

  useEffect(() => {
    if (expanded) {
      setTrayContentMounted(true);
      if (progress.value < 0.5) {
        progress.value = withSpring(1, SPRING);
      }
    } else if (progress.value > 0.5) {
      progress.value = withSpring(0, SPRING);
    }
  }, [expanded, progress]);

  const pan = Gesture.Pan()
    .enabled(expanded)
    .activeOffsetY([-12, 12])
    .failOffsetX([-24, 24])
    .onBegin(() => {
      startProgress.value = progress.value;
    })
    .onUpdate((e) => {
      const delta = -e.translationY / expandedH;
      progress.value = Math.min(1, Math.max(0, startProgress.value + delta));
    })
    .onEnd((e) => {
      const shouldCollapse = e.velocityY > 250 || progress.value < 0.55;
      if (shouldCollapse) {
        progress.value = withSpring(0, SPRING, (finished) => {
          if (finished) runOnJS(notifyCollapsed)();
        });
      } else {
        progress.value = withSpring(1, SPRING);
      }
    });

  const trayStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [expandedH + 24, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(progress.value, [0, 0.2, 1], [0, 1, 1], Extrapolation.CLAMP),
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.25], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(progress.value, [0, 0.3], [1, 0.94], Extrapolation.CLAMP),
      },
    ],
  }));

  const expandLabel = expandResultsLabel(resultCount);
  const headerLabel = nearbyHeaderLabel(resultCount);
  const pillWidth = Math.min(SCREEN_W * 0.82, DISCOVER_EXPAND_PILL_MAX_WIDTH);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        height: expandedH,
        zIndex: 20,
      }}
    >
      <Animated.View
        pointerEvents={expanded ? "none" : "box-none"}
        testID="discover-expand-pill-anchor"
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            zIndex: 2,
          },
          pillStyle,
        ]}
      >
        <Pressable
          onPress={expandToTray}
          accessibilityRole="button"
          accessibilityLabel={expandLabel}
          testID="discover-expand-pill"
          style={{
            width: pillWidth,
            height: DISCOVER_EXPAND_PILL_HEIGHT,
            borderRadius: DISCOVER_EXPAND_PILL_RADIUS,
            backgroundColor: brandColors.surface,
            borderWidth: 1,
            borderColor: brandColors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            ...DISCOVER_FLOATING_SHADOW,
          }}
        >
          <Ionicons name="chevron-up" size={18} color={brandColors.primary} />
          <Text className={`text-sm font-semibold ${ui.text.primary}`}>{expandLabel}</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
          pointerEvents={expanded ? "box-none" : "none"}
          testID="discover-expanded-tray-anchor"
          style={[
            {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: expandedH,
              zIndex: 1,
            },
            trayStyle,
          ]}
        >
          <View
            testID="discover-results-panel"
            style={{
              flex: 1,
              marginHorizontal: 10,
              borderRadius: DISCOVER_TRAY_CORNER_RADIUS,
              backgroundColor: brandColors.surface,
              borderWidth: 1,
              borderColor: brandColors.border,
              overflow: "hidden",
              ...DISCOVER_FLOATING_SHADOW,
            }}
          >
            {/* Pan only on the header so card actions (Try Next / Share / etc.) keep receiving taps. */}
            <GestureDetector gesture={pan}>
              <View className="px-3 pt-2 pb-1.5 gap-1.5">
                <View className="items-center">
                  <View
                    style={{
                      width: 36,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "rgba(157,150,146,0.55)",
                    }}
                  />
                </View>

                <View className="flex-row items-center gap-2">
                  <Text
                    className={`flex-1 text-[13px] font-semibold ${ui.text.primary}`}
                    accessibilityLiveRegion="polite"
                    numberOfLines={1}
                  >
                    {headerLabel}
                  </Text>

                  <DiscoverMapListToggle
                    mode={viewMode}
                    onChange={onViewModeChange}
                    size="compact"
                  />

                  <Pressable
                    onPress={collapseToPill}
                    accessibilityRole="button"
                    accessibilityLabel="Collapse results"
                    hitSlop={8}
                    testID="discover-collapse-pill"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: brandColors.background,
                      borderWidth: 1,
                      borderColor: brandColors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="chevron-down" size={18} color={brandColors.primary} />
                  </Pressable>
                </View>
              </View>
            </GestureDetector>

            {trayContentMounted ? (
              items.length === 0 ? (
                <View
                  testID="discover-empty-panel"
                  style={{
                    marginHorizontal: 12,
                    marginBottom: 12,
                    padding: 16,
                    borderRadius: DISCOVER_TRAY_CORNER_RADIUS,
                    backgroundColor: brandColors.background,
                    borderWidth: 1,
                    borderColor: brandColors.border,
                    gap: 12,
                  }}
                >
                  <Text className={`text-sm ${ui.text.secondary}`}>{EMPTY_TRAY_MESSAGE}</Text>
                  <View className="flex-row gap-2">
                    <Button
                      label="Clear Filters"
                      variant="secondary"
                      onPress={onClearFilters}
                      className="flex-1"
                    />
                    <Button label="Search a Wider Area" onPress={onSearchWider} className="flex-1" />
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1, paddingBottom: 12 }} testID="discover-floating-cards-stack">
                  <DiscoverResultsCarousel
                    ref={carouselRef}
                    items={items}
                    selectedId={selectedId}
                    coords={coords}
                    onSelectId={onSelectId}
                    onOpen={onOpen}
                    onBookmark={onBookmark}
                    onShare={onShare}
                    onDirections={onDirections}
                    onAddToList={onAddToList}
                  />
                </View>
              )
            ) : null}
          </View>
        </Animated.View>
    </View>
  );
}
