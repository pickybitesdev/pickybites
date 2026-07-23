import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { View, Dimensions, type ViewToken } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import type { PlaceResult } from "@/lib/places/types";
import { DiscoverResultCard } from "@/components/discover/DiscoverResultCard";
import { distanceMeters as haversine } from "@/lib/location";
import type { Coordinates } from "@/lib/places/types";
import { DISCOVER_TRAY_HORIZONTAL_MARGIN } from "@/lib/discover-tray";

const GAP = 12;
const SCREEN_W = Dimensions.get("window").width;
/** Vertical card with next-card peek (~80% width). */
export const DISCOVER_CARD_WIDTH = Math.min(
  SCREEN_W * 0.8,
  SCREEN_W - DISCOVER_TRAY_HORIZONTAL_MARGIN * 2 - 28,
);
const SIDE_PAD = DISCOVER_TRAY_HORIZONTAL_MARGIN;
const SNAP = DISCOVER_CARD_WIDTH + GAP;

export type DiscoverCarouselItem = {
  place: PlaceResult;
  distanceMeters?: number | null;
  rating?: number | null;
  matchPercent?: number | null;
  isBookmarked?: boolean;
  yelpRating?: number | null;
  yelpReviewCount?: number | null;
};

export type DiscoverResultsCarouselHandle = {
  scrollToId: (id: string, animated?: boolean) => void;
};

export const DiscoverResultsCarousel = forwardRef<
  DiscoverResultsCarouselHandle,
  {
    items: DiscoverCarouselItem[];
    selectedId: string | null;
    coords: Coordinates | null;
    onSelectId: (id: string) => void;
    onOpen: (place: PlaceResult) => void;
    onBookmark: (place: PlaceResult) => void;
    onShare?: (place: PlaceResult) => void;
    onDirections?: (place: PlaceResult) => void;
    onAddToList?: (place: PlaceResult) => void;
  }
>(function DiscoverResultsCarousel(
  { items, selectedId, coords, onSelectId, onOpen, onBookmark, onShare, onDirections, onAddToList },
  ref,
) {
  const listRef = useRef<FlatList<DiscoverCarouselItem>>(null);
  const ignoreViewable = useRef(false);

  useImperativeHandle(ref, () => ({
    scrollToId: (id: string, animated = true) => {
      const index = items.findIndex((i) => i.place.googlePlaceId === id);
      if (index < 0) return;
      ignoreViewable.current = true;
      listRef.current?.scrollToIndex({ index, animated, viewPosition: 0 });
      requestAnimationFrame(() => {
        ignoreViewable.current = false;
      });
    },
  }));

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (ignoreViewable.current) return;
      const first = viewableItems[0]?.item as DiscoverCarouselItem | undefined;
      if (!first) return;
      const id = first.place.googlePlaceId;
      if (id !== selectedId) onSelectId(id);
    },
    [onSelectId, selectedId],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  if (!items.length) return null;

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={items}
      keyExtractor={(item) => item.place.googlePlaceId}
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={SNAP}
      snapToAlignment="start"
      disableIntervalMomentum
      contentContainerStyle={{ paddingHorizontal: SIDE_PAD }}
      ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
      getItemLayout={(_, index) => ({
        length: SNAP,
        offset: SNAP * index,
        index,
      })}
      onScrollToIndexFailed={({ index }) => {
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index, animated: true });
        }, 100);
      }}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      testID="discover-results-carousel"
      renderItem={({ item }) => {
        const place = item.place;
        const dist =
          item.distanceMeters ??
          (coords ? haversine(coords, place) : null);
        return (
          <View style={{ width: DISCOVER_CARD_WIDTH }}>
            <DiscoverResultCard
              width={DISCOVER_CARD_WIDTH}
              name={place.name}
              cuisine={place.cuisine}
              imageUrl={place.imageUrl}
              priceLevel={place.priceLevel}
              priceLevelKnown={place.priceLevelKnown}
              distanceMeters={dist}
              rating={item.rating}
              openNow={place.openNow}
              isBookmarked={item.isBookmarked}
              yelpRating={item.yelpRating}
              yelpReviewCount={item.yelpReviewCount}
              selected={place.googlePlaceId === selectedId}
              onOpen={() => onOpen(place)}
              onBookmark={() => onBookmark(place)}
              onShare={onShare ? () => onShare(place) : undefined}
              onDirections={onDirections ? () => onDirections(place) : undefined}
              onAddToList={onAddToList ? () => onAddToList(place) : undefined}
            />
          </View>
        );
      }}
    />
  );
});
