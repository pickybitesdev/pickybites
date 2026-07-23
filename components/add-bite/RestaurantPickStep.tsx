import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import type { Bookmark, Cuisine, Restaurant, Review } from "@/lib/types";
import type { Coordinates, PlaceResult } from "@/lib/places/types";
import { CUISINES } from "@/lib/types";
import {
  searchNearbyRestaurants,
  searchRestaurantsByText,
  getPlacesSearchStatus,
} from "@/lib/places/google";
import {
  buildRecentRestaurantItems,
  createMissingPlace,
  mapNearbyPlacesToItems,
  pickItemSelectionKey,
  type RestaurantPickItem,
  type RestaurantSourceTab,
} from "@/lib/add-bite-restaurant-sources";
import { RestaurantPickRow } from "@/components/add-bite/RestaurantPickRow";
import { Button } from "@/components/ui/Button";
import { brandColors } from "@/constants/branding";
import { useThemedColors } from "@/lib/useThemedColors";

export function RestaurantPickStep({
  coords,
  currentUserId,
  restaurants,
  reviews,
  bookmarks,
  selectedRestaurantId,
  selectedPlaceId,
  selectedName,
  onSelectPlace,
  onSelectLocal,
  onContinue,
  onSaveWithoutReview,
  continueLabel = "Continue",
  showBookmarkLink = true,
}: {
  coords: Coordinates | null;
  currentUserId: string | null;
  restaurants: Restaurant[];
  reviews: Review[];
  bookmarks: Bookmark[];
  selectedRestaurantId: string | null;
  selectedPlaceId: string | null;
  selectedName: string;
  onSelectPlace: (place: PlaceResult) => void;
  onSelectLocal: (restaurant: Restaurant) => void;
  onContinue: () => void;
  onSaveWithoutReview: () => void;
  continueLabel?: string;
  showBookmarkLink?: boolean;
}) {
  const colors = useThemedColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<RestaurantSourceTab>("nearby");
  const [query, setQuery] = useState("");
  const [nearby, setNearby] = useState<RestaurantPickItem[]>([]);
  const [searchResults, setSearchResults] = useState<RestaurantPickItem[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [nearbyError, setNearbyError] = useState<"location" | "failed" | null>(null);
  const [searchError, setSearchError] = useState<"sign_in" | "unavailable" | "failed" | null>(null);
  const [showMissingForm, setShowMissingForm] = useState(false);
  const [missingName, setMissingName] = useState("");
  const [missingCity, setMissingCity] = useState("");
  const [missingCuisine, setMissingCuisine] = useState<Cuisine>("American");

  const useSupabase = useAppStore((s) => s.useSupabase);
  const placesStatus = getPlacesSearchStatus({
    isAuthenticated: !!currentUserId,
    useRemotePlaces: useSupabase,
  });
  const placesReady = placesStatus === "ready";
  const q = query.trim();
  const isSearching = q.length > 0;

  const recent = useMemo(
    () => buildRecentRestaurantItems(currentUserId, restaurants, reviews, bookmarks, coords),
    [currentUserId, restaurants, reviews, bookmarks, coords],
  );

  const loadNearby = useCallback(async () => {
    setNearbyError(null);
    if (!placesReady) {
      setNearby([]);
      return;
    }
    if (!coords) {
      setNearby([]);
      setNearbyError("location");
      return;
    }
    setLoadingNearby(true);
    try {
      const places = await searchNearbyRestaurants(coords);
      setNearby(mapNearbyPlacesToItems(places, restaurants, reviews, coords));
    } catch {
      setNearby([]);
      setNearbyError("failed");
    } finally {
      setLoadingNearby(false);
    }
  }, [coords, placesReady, restaurants, reviews]);

  useEffect(() => {
    void loadNearby();
  }, [loadNearby]);

  useEffect(() => {
    if (!q) {
      setSearchResults([]);
      setSearchAttempted(false);
      setSearchError(null);
      setShowMissingForm(false);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        setSearchError(null);
        if (!placesReady) {
          setSearchResults([]);
          setSearchAttempted(true);
          setSearchError(placesStatus === "sign_in" ? "sign_in" : "unavailable");
          return;
        }
        setLoadingSearch(true);
        try {
          const places = await searchRestaurantsByText(q, coords ?? undefined);
          setSearchResults(mapNearbyPlacesToItems(places, restaurants, reviews, coords));
          setSearchAttempted(true);
        } catch {
          setSearchResults([]);
          setSearchAttempted(true);
          setSearchError("failed");
        } finally {
          setLoadingSearch(false);
        }
      })();
    }, 400);
    return () => clearTimeout(t);
  }, [q, placesReady, placesStatus, coords, restaurants, reviews]);

  const listItems = useMemo(() => {
    if (isSearching) return searchResults;
    return tab === "nearby" ? nearby : recent;
  }, [isSearching, searchResults, tab, nearby, recent]);

  const selectedKey = selectedRestaurantId
    ? `rest:${selectedRestaurantId}`
    : selectedPlaceId
      ? `place:${selectedPlaceId}`
      : null;

  const hasSelection = Boolean(selectedName.trim());

  const onPressItem = (item: RestaurantPickItem) => {
    if (item.restaurantId) {
      const r = restaurants.find((x) => x.id === item.restaurantId);
      if (r) {
        onSelectLocal(r);
        return;
      }
    }
    if (item.place) onSelectPlace(item.place);
  };

  const submitMissing = () => {
    if (!missingName.trim()) return;
    const place = createMissingPlace({
      name: missingName,
      city: missingCity,
      cuisine: missingCuisine,
    });
    onSelectPlace(place);
    setShowMissingForm(false);
    setQuery("");
  };

  const showNoResults = isSearching && searchAttempted && !loadingSearch && searchResults.length === 0;

  const emptyNearbyMessage = (() => {
    if (tab !== "nearby" || isSearching || loadingNearby) return null;
    if (!placesReady) {
      if (placesStatus === "sign_in") {
        return "Sign in to search nearby restaurants, or pick from Recent.";
      }
      return "Restaurant search isn’t available right now. Use Recent, or add a place manually.";
    }
    if (nearbyError === "location" || !coords) {
      return "Turn on location to see nearby spots, or search by name.";
    }
    if (nearbyError === "failed") {
      return "Couldn’t load nearby places. Try again, search by name, or add a place manually.";
    }
    if (nearby.length === 0) {
      return "No nearby restaurants found. Try searching by name.";
    }
    return null;
  })();

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      style={{ backgroundColor: brandColors.background }}
    >
      <View className="flex-1 px-4 gap-3" style={{ paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: brandColors.textPrimary }}>
          Where did you eat?
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            minHeight: 52,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: brandColors.border,
            backgroundColor: brandColors.surface,
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Ionicons name="search" size={20} color={colors.iconMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search restaurant or location"
            placeholderTextColor={colors.placeholder}
            style={{ flex: 1, fontSize: 16, color: brandColors.textPrimary, paddingVertical: 12 }}
            returnKeyType="search"
            autoCorrect={false}
            testID="add-bite-restaurant-search"
          />
          {loadingSearch ? <ActivityIndicator size="small" color={colors.spinner} /> : null}
        </View>

        {!isSearching ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["nearby", "recent"] as const).map((key) => {
              const active = tab === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTab(key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  testID={`add-bite-source-${key}`}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: active ? brandColors.primary : brandColors.surface,
                    borderWidth: 1,
                    borderColor: active ? brandColors.primary : brandColors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: active ? "#FFFFFF" : brandColors.textSecondary,
                    }}
                  >
                    {key === "nearby" ? "Nearby" : "Recent"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {emptyNearbyMessage ? (
          <View
            style={{
              gap: 8,
              padding: 12,
              borderRadius: 14,
              backgroundColor: brandColors.primaryLight,
            }}
            testID="add-bite-nearby-status"
          >
            <Text style={{ fontSize: 14, color: brandColors.textSecondary }}>{emptyNearbyMessage}</Text>
            {(nearbyError === "location" || (!coords && placesReady)) ? (
              <Pressable onPress={() => void Linking.openSettings()} hitSlop={8}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: brandColors.primary }}>
                  Open Settings
                </Text>
              </Pressable>
            ) : null}
            {nearbyError === "failed" ? (
              <Pressable onPress={() => void loadNearby()} hitSlop={8}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: brandColors.primary }}>
                  Try again
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {loadingNearby && tab === "nearby" && !isSearching ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={colors.spinner} />
          </View>
        ) : (
          <FlatList
            data={listItems}
            keyExtractor={(item) => item.key}
            keyboardShouldPersistTaps="always"
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 8, paddingBottom: 16, flexGrow: 1 }}
            renderItem={({ item }) => (
              <RestaurantPickRow
                item={item}
                selected={pickItemSelectionKey(item) === selectedKey || item.name === selectedName}
                onPress={() => onPressItem(item)}
              />
            )}
            ListEmptyComponent={
              showNoResults ? (
                <View style={{ gap: 12, paddingVertical: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: brandColors.textPrimary }}>
                    {searchError === "sign_in"
                      ? "Sign in to search restaurants"
                      : searchError === "unavailable"
                        ? "Search unavailable"
                        : searchError === "failed"
                          ? "Search failed"
                          : "No restaurants found."}
                  </Text>
                  <Text style={{ fontSize: 14, color: brandColors.textSecondary }}>
                    {searchError === "sign_in"
                      ? "You can still pick from Recent, or add a missing restaurant."
                      : searchError === "unavailable"
                        ? "Try Recent, or add a restaurant manually."
                        : searchError === "failed"
                          ? "Check your connection, try another name, or add a place manually."
                          : "Try another name, or add a missing restaurant."}
                  </Text>
                  {!showMissingForm ? (
                    <Button
                      label="Add missing restaurant"
                      variant="secondary"
                      onPress={() => {
                        setShowMissingForm(true);
                        setMissingName(q);
                      }}
                      testID="add-bite-add-missing"
                    />
                  ) : (
                    <View
                      style={{
                        gap: 10,
                        padding: 14,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: brandColors.border,
                        backgroundColor: brandColors.surface,
                      }}
                    >
                      <TextInput
                        value={missingName}
                        onChangeText={setMissingName}
                        placeholder="Restaurant name"
                        placeholderTextColor={colors.placeholder}
                        style={{
                          borderWidth: 1,
                          borderColor: brandColors.border,
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          color: brandColors.textPrimary,
                        }}
                        testID="add-bite-missing-name"
                      />
                      <TextInput
                        value={missingCity}
                        onChangeText={setMissingCity}
                        placeholder="City (optional)"
                        placeholderTextColor={colors.placeholder}
                        style={{
                          borderWidth: 1,
                          borderColor: brandColors.border,
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          color: brandColors.textPrimary,
                        }}
                      />
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {CUISINES.slice(0, 8).map((c) => (
                          <Pressable
                            key={c}
                            onPress={() => setMissingCuisine(c)}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 999,
                              backgroundColor:
                                missingCuisine === c ? brandColors.primaryLight : brandColors.background,
                              borderWidth: 1,
                              borderColor:
                                missingCuisine === c ? brandColors.primary : brandColors.border,
                            }}
                          >
                            <Text style={{ fontSize: 12, color: brandColors.textSecondary }}>{c}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <Button
                        label="Use this restaurant"
                        onPress={submitMissing}
                        disabled={!missingName.trim()}
                        testID="add-bite-missing-submit"
                      />
                    </View>
                  )}
                </View>
              ) : !isSearching && tab === "recent" && recent.length === 0 ? (
                <Text style={{ paddingVertical: 20, color: brandColors.textSecondary }}>
                  No recent places yet. Try Nearby or search.
                </Text>
              ) : null
            }
          />
        )}
      </View>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 12),
          borderTopWidth: 1,
          borderTopColor: brandColors.border,
          backgroundColor: brandColors.background,
          gap: 10,
        }}
      >
        <Button
          label={continueLabel}
          onPress={onContinue}
          disabled={!hasSelection}
          testID="add-bite-continue"
        />
        {showBookmarkLink ? (
          <Pressable onPress={onSaveWithoutReview} hitSlop={8} accessibilityRole="button">
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                color: brandColors.textSecondary,
                textDecorationLine: "underline",
              }}
            >
              Save to Bites only (no review)
            </Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
