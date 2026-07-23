import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Pressable,
  Keyboard,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { PlaceResult } from "@/lib/places/types";
import type { Coordinates } from "@/lib/places/types";
import type { Restaurant } from "@/lib/types";
import { searchRestaurantsByText, isGooglePlacesConfigured } from "@/lib/places/google";
import { PlaceResultCard } from "./PlaceResultCard";
import { useThemedColors } from "@/lib/useThemedColors";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";
import { PLACES_UNAVAILABLE_MESSAGE } from "@/lib/discover-view";
import { hapticSelection } from "@/lib/haptics";

function restaurantToPlace(r: Restaurant): PlaceResult {
  return {
    googlePlaceId: r.googlePlaceId ?? `local:${r.id}`,
    name: r.name,
    address: r.address,
    city: r.city,
    cuisine: r.cuisine,
    priceLevel: r.priceLevel,
    priceLevelKnown: true,
    imageUrl: r.imageUrl,
    latitude: r.latitude ?? 0,
    longitude: r.longitude ?? 0,
    openNow: null,
  };
}

export type PlaceSearchHandle = {
  focus: () => void;
};

export const PlaceSearch = forwardRef<
  PlaceSearchHandle,
  {
    coords: Coordinates | null;
    onSelect: (place: PlaceResult) => void;
    placeholder?: string;
    autoFocus?: boolean;
    /** When true, only show a compact one-line notice (e.g. under Discover header). */
    compactUnavailable?: boolean;
    /** Existing app restaurants — always searchable as a fallback. */
    localRestaurants?: Restaurant[];
    /** Prefer this when tapping a known restaurant (avoids re-creating places). */
    onSelectLocal?: (restaurant: Restaurant) => void;
    selectedRestaurantId?: string | null;
    selectedPlaceId?: string | null;
    /** compact = Discover header (search only grows with results). fill = Add a Bite full picker. */
    layout?: "compact" | "fill";
  }
>(function PlaceSearch(
  {
    coords,
    onSelect,
    placeholder = "Search restaurants…",
    autoFocus = false,
    compactUnavailable = false,
    localRestaurants = [],
    onSelectLocal,
    selectedRestaurantId = null,
    selectedPlaceId = null,
    layout = "compact",
  },
  ref,
) {
  const colors = useThemedColors();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const placesReady = isGooglePlacesConfigured();
  const fill = layout === "fill";

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const localMatches = useMemo(() => {
    if (!localRestaurants.length) return [];
    const q = query.trim().toLowerCase();
    // In compact Discover mode, only show local matches once the user is typing
    if (!fill && !q) return [];
    if (!q) return localRestaurants.slice(0, 12);
    return localRestaurants
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [localRestaurants, query, fill]);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim() || !placesReady) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const places = await searchRestaurantsByText(q.trim(), coords ?? undefined);
        setResults(places);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [coords, placesReady],
  );

  useEffect(() => {
    const t = setTimeout(() => search(query), 400);
    return () => clearTimeout(t);
  }, [query, search]);

  const pickLocal = (r: Restaurant) => {
    Keyboard.dismiss();
    hapticSelection();
    if (onSelectLocal) onSelectLocal(r);
    else onSelect(restaurantToPlace(r));
  };

  const pickPlace = (place: PlaceResult) => {
    Keyboard.dismiss();
    hapticSelection();
    const existing = localRestaurants.find((r) => r.googlePlaceId === place.googlePlaceId);
    if (existing && onSelectLocal) {
      onSelectLocal(existing);
      return;
    }
    onSelect(place);
  };

  const showLocal = localMatches.length > 0;
  const showPlacesUnavailable = !placesReady && localRestaurants.length === 0;
  const hasResultList = showLocal || results.length > 0;

  if (showPlacesUnavailable) {
    if (__DEV__) {
      console.warn("[PlaceSearch]", PLACES_UNAVAILABLE_MESSAGE);
    }
    return (
      <View className={cn("rounded-xl", compactUnavailable ? "px-1 py-1" : "p-4", ui.surface.inset)}>
        <Text className={cn(compactUnavailable ? "text-xs" : "text-sm", ui.text.secondary)}>
          {PLACES_UNAVAILABLE_MESSAGE}
        </Text>
      </View>
    );
  }

  const resultBody = (
    <>
      {showLocal ? (
        <View style={{ gap: 8 }}>
          <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
            Your restaurants
          </Text>
          {localMatches.map((r) => {
            const selected = selectedRestaurantId === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => pickLocal(r)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Select ${r.name}`}
                style={({ pressed }) => ({
                  borderRadius: 16,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? brandColors.primary : brandColors.border,
                  backgroundColor: selected ? brandColors.primaryLight : "#FFFFFF",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text className={`font-semibold ${ui.text.primary}`}>{r.name}</Text>
                <Text className={`text-sm ${ui.text.secondary}`}>
                  {[r.cuisine, r.city].filter(Boolean).join(" · ")}
                </Text>
                {selected ? (
                  <Text
                    style={{
                      marginTop: 4,
                      color: brandColors.primary,
                      fontWeight: "600",
                      fontSize: 12,
                    }}
                  >
                    Selected
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {results.length > 0 ? (
        <View style={{ gap: 8 }}>
          {showLocal ? (
            <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
              Search results
            </Text>
          ) : null}
          {results.map((place, i) => {
            const selected =
              selectedPlaceId === place.googlePlaceId ||
              (!!place.googlePlaceId &&
                localRestaurants.some(
                  (r) => r.googlePlaceId === place.googlePlaceId && r.id === selectedRestaurantId,
                ));
            return (
              <View
                key={place.googlePlaceId}
                style={
                  selected
                    ? {
                        borderRadius: 20,
                        borderWidth: 2,
                        borderColor: brandColors.primary,
                        overflow: "hidden",
                      }
                    : undefined
                }
              >
                <PlaceResultCard place={place} index={i} onPress={() => pickPlace(place)} />
              </View>
            );
          })}
        </View>
      ) : null}

      {placesReady &&
      query.trim().length > 0 &&
      !loading &&
      results.length === 0 &&
      localMatches.length === 0 ? (
        <Text className={`text-sm ${ui.text.secondary}`}>No restaurants found. Try another search.</Text>
      ) : null}
    </>
  );

  return (
    <View className={cn("gap-3", fill && "flex-1")}>
      <View className={cn("flex-row items-center rounded-xl px-3 min-h-[52px]", ui.surface.search)}>
        <Ionicons name="search" size={20} color={colors.iconMuted} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn("flex-1 ml-2 text-base", ui.text.primary)}
          placeholderTextColor={colors.placeholder}
          returnKeyType="search"
          blurOnSubmit
        />
        {loading && <ActivityIndicator size="small" color={colors.spinner} />}
      </View>

      {!placesReady && fill && localRestaurants.length > 0 ? (
        <Text className={`text-xs ${ui.text.muted}`}>
          Showing restaurants already in PickyBites. Add a Google Places key for live search.
        </Text>
      ) : null}

      {error && <Text className="text-sm text-red-500">{error}</Text>}

      {hasResultList || (placesReady && query.trim().length > 0) ? (
        fill ? (
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
          >
            {resultBody}
          </ScrollView>
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            nestedScrollEnabled
            style={{ maxHeight: 320 }}
            contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
          >
            {resultBody}
          </ScrollView>
        )
      ) : null}
    </View>
  );
});
