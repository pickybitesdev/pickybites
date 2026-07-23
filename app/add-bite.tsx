import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "@/store/useAppStore";
import { PlaceSearch } from "@/components/restaurants/PlaceSearch";
import { RestaurantPickStep } from "@/components/add-bite/RestaurantPickStep";
import {
  NewPostMediaPicker,
  promptAddPhotos,
} from "@/components/add-bite/NewPostMediaPicker";
import { NewPostRestaurantRow } from "@/components/add-bite/NewPostRestaurantRow";
import { NewPostRatingRow } from "@/components/add-bite/NewPostRatingRow";
import { NewPostDishesSection } from "@/components/add-bite/NewPostDishesSection";
import { NewPostMoreSection } from "@/components/add-bite/NewPostMoreSection";
import { Button } from "@/components/ui/Button";
import { getCurrentCoordinates } from "@/lib/location";
import type { Coordinates } from "@/lib/places/types";
import type { PlaceResult } from "@/lib/places/types";
import {
  ADD_BITE_MAX_PHOTOS,
  ADD_BITE_MAX_TEXT,
  clearAddBiteDraft,
  coerceAddBiteVisibility,
  createReviewDraft,
  dishesReadyForSubmit,
  draftIsPopulated,
  hasChosenNewPostRating,
  isNewPostPrivate,
  loadAddBiteDraft,
  newPostJournalSubcopy,
  newPostPrivateSubcopy,
  newPostSubmitLabel,
  saveAddBiteDraft,
  type AddBiteDraft,
} from "@/lib/add-bite-draft";
import { draftWithRestaurantPrefill } from "@/lib/add-actions";
import { buildNormalizedRating, validateRatingScale } from "@/lib/rating-scale";
import { brandColors } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { hapticSuccess } from "@/lib/haptics";

export default function AddBiteScreen() {
  const colors = useThemedColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ restaurantId?: string; bookmarkId?: string }>();
  const currentUserId = useAppStore((s) => s.currentUserId);
  const restaurants = useAppStore((s) => s.restaurants);
  const reviews = useAppStore((s) => s.reviews);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const ensureRestaurantFromPlace = useAppStore((s) => s.ensureRestaurantFromPlace);
  const addReview = useAppStore((s) => s.addReview);
  const toggleRestaurantBookmark = useAppStore((s) => s.toggleRestaurantBookmark);

  const [draft, setDraft] = useState<AddBiteDraft>(createReviewDraft);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pickingRestaurant, setPickingRestaurant] = useState(false);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const submitLock = useRef(false);
  const hydrated = useRef(false);
  const deepLinkApplied = useRef(false);

  useEffect(() => {
    void getCurrentCoordinates().then(setCoords).catch(() => null);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const bookmarkId = typeof params.bookmarkId === "string" ? params.bookmarkId : undefined;
    const restaurantIdParam =
      typeof params.restaurantId === "string" ? params.restaurantId : undefined;
    const hasDeepLink = Boolean(bookmarkId || restaurantIdParam);

    const bookmark = bookmarkId
      ? bookmarks.find((b) => b.id === bookmarkId)
      : restaurantIdParam
        ? bookmarks.find((b) => b.restaurantId === restaurantIdParam)
        : undefined;
    const restaurant = restaurantIdParam
      ? restaurants.find((x) => x.id === restaurantIdParam)
      : bookmark?.restaurantId
        ? restaurants.find((x) => x.id === bookmark.restaurantId)
        : undefined;

    // Visited / restaurant deep links: wait for store data, then force-prefill place.
    if (hasDeepLink && !deepLinkApplied.current) {
      if (!restaurant && !bookmark) return;

      deepLinkApplied.current = true;
      hydrated.current = true;
      void (async () => {
        const saved = await loadAddBiteDraft(currentUserId);
        const base =
          saved && draftIsPopulated(saved)
            ? {
                ...saved,
                mode: (saved.mode === "entry" ? "review" : saved.mode) as AddBiteDraft["mode"],
                ratingMax: 10,
                ratingValue: Math.min(10, Math.max(1, saved.ratingValue || 8)),
                visibility: coerceAddBiteVisibility(saved.visibility),
              }
            : createReviewDraft();
        const prefilled = draftWithRestaurantPrefill(base, { restaurant, bookmark });
        setDraft(prefilled);
        if (!prefilled.skipCompare && prefilled.compareRestaurantId) {
          setMoreExpanded(true);
        }
      })();
      return;
    }

    if (hydrated.current) return;
    hydrated.current = true;
    void (async () => {
      const saved = await loadAddBiteDraft(currentUserId);
      if (saved && draftIsPopulated(saved)) {
        const ratingValue = Math.min(10, Math.max(1, saved.ratingValue || 8));
        setDraft({
          ...saved,
          mode: saved.mode === "entry" ? "review" : saved.mode,
          ratingMax: 10,
          ratingValue,
          visibility: coerceAddBiteVisibility(saved.visibility),
        });
        if (!saved.skipCompare && saved.compareRestaurantId) {
          setMoreExpanded(true);
        }
      }
    })();
  }, [currentUserId, params.restaurantId, params.bookmarkId, restaurants, bookmarks]);

  useEffect(() => {
    if (!currentUserId || draft.mode === "success") return;
    const t = setTimeout(() => {
      void saveAddBiteDraft(currentUserId, draft);
    }, 400);
    return () => clearTimeout(t);
  }, [draft, currentUserId]);

  const patch = useCallback((partial: Partial<AddBiteDraft>) => {
    setDraft((d) => ({ ...d, ...partial }));
  }, []);

  const onSelectPlace = (place: PlaceResult) => {
    const existing = restaurants.find((r) => r.googlePlaceId === place.googlePlaceId);
    setDraft((d) => ({
      ...d,
      place,
      restaurantId: existing?.id ?? null,
      restaurantName: place.name,
      address: place.address,
      city: place.city,
      cuisine: place.cuisine,
      priceLevel: place.priceLevel,
    }));
    if (!existing) {
      void ensureRestaurantFromPlace(place).then((restaurant) => {
        if ("error" in restaurant) return;
        setDraft((d) =>
          d.place?.googlePlaceId === place.googlePlaceId
            ? {
                ...d,
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                address: restaurant.address,
                city: restaurant.city,
                cuisine: restaurant.cuisine,
                priceLevel: restaurant.priceLevel,
              }
            : d,
        );
      });
    }
  };

  const onSelectLocalRestaurant = (r: (typeof restaurants)[number]) => {
    setDraft((d) => ({
      ...d,
      place: null,
      restaurantId: r.id,
      restaurantName: r.name,
      address: r.address,
      city: r.city,
      cuisine: r.cuisine,
      priceLevel: r.priceLevel,
    }));
  };

  const comparedOptions = useMemo(() => {
    if (!currentUserId || !draft.restaurantId) return [];
    const current = restaurants.find((r) => r.id === draft.restaurantId);
    const reviewedIds = new Set(
      reviews.filter((r) => r.userId === currentUserId).map((r) => r.restaurantId),
    );
    return restaurants
      .filter((r) => r.id !== draft.restaurantId && reviewedIds.has(r.id))
      .filter((r) => !current || r.cuisine === current.cuisine || r.city === current.city)
      .slice(0, 8);
  }, [currentUserId, draft.restaurantId, restaurants, reviews]);

  const privateOn = isNewPostPrivate(draft.visibility);
  const ratingChosen = hasChosenNewPostRating(draft);
  const canSubmit =
    !!(draft.restaurantId || draft.place) &&
    !!draft.restaurantName.trim() &&
    ratingChosen;

  const discardAndClose = () => {
    if (draftIsPopulated(draft) && draft.mode !== "success") {
      Alert.alert("Discard draft?", "Your Bite draft will be lost.", [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            if (currentUserId) await clearAddBiteDraft(currentUserId);
            router.back();
          },
        },
      ]);
      return;
    }
    router.back();
  };

  const saveBitesOnly = async () => {
    if (!draft.restaurantId && !draft.place) {
      Alert.alert("Select a restaurant first");
      return;
    }
    setSubmitting(true);
    try {
      let restaurantId = draft.restaurantId;
      if (!restaurantId && draft.place) {
        const r = await ensureRestaurantFromPlace(draft.place);
        if ("error" in r) {
          Alert.alert("Could not save", r.error);
          return;
        }
        restaurantId = r.id;
      }
      const restaurant = restaurants.find((r) => r.id === restaurantId);
      if (restaurant) {
        await toggleRestaurantBookmark(restaurant);
      }
      if (currentUserId) await clearAddBiteDraft(currentUserId);
      hapticSuccess();
      patch({ mode: "success" });
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : "Try again");
    } finally {
      setSubmitting(false);
    }
  };

  const submitReview = async () => {
    if (submitLock.current || submitting) return;
    const scale = validateRatingScale(draft.ratingValue, 10);
    if (!scale.ok) {
      Alert.alert("Invalid rating", scale.error);
      return;
    }
    if (!draft.restaurantId && !draft.place) {
      Alert.alert("Tag a restaurant", "Choose where you ate before sharing.");
      return;
    }
    if (!hasChosenNewPostRating(draft)) {
      Alert.alert("Add a rating", "Tap a score from 1 to 10 before sharing.");
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    try {
      const visibility = coerceAddBiteVisibility(draft.visibility);
      const normalized = buildNormalizedRating(draft.ratingValue, 10);
      const photos = [...draft.photoUris];
      if (draft.coverPhotoIndex > 0 && photos.length > draft.coverPhotoIndex) {
        const [cover] = photos.splice(draft.coverPhotoIndex, 1);
        photos.unshift(cover);
      }
      const result = await addReview({
        restaurantId: draft.restaurantId ?? undefined,
        place: draft.place ?? undefined,
        restaurantName: draft.restaurantName,
        address: draft.address,
        city: draft.city,
        cuisine: draft.cuisine ?? undefined,
        priceLevel: draft.priceLevel ?? undefined,
        rating: draft.ratingValue,
        ratingValue: draft.ratingValue,
        ratingMax: 10,
        normalizedRating: normalized.normalizedRating,
        visibility,
        categoryScores: {
          foodQuality: Math.min(10, Math.max(1, draft.ratingValue)),
          service: Math.min(10, Math.max(1, draft.ratingValue)),
          atmosphere: Math.min(10, Math.max(1, draft.ratingValue)),
          value: Math.min(10, Math.max(1, draft.ratingValue)),
        },
        ratingManualOverride: true,
        waitTime: draft.waitTime,
        wouldReturn: draft.wouldReturn,
        wouldRecommend: draft.wouldRecommend,
        text: draft.text.slice(0, ADD_BITE_MAX_TEXT),
        visitDate: draft.visitDate,
        tags: draft.tags,
        photoUris: photos,
        dishes: dishesReadyForSubmit(draft.dishes),
        comparison:
          !draft.skipCompare && draft.compareRestaurantId && draft.comparePreference
            ? {
                comparedRestaurantId: draft.compareRestaurantId,
                preference: draft.comparePreference,
                reason: draft.compareReason,
              }
            : undefined,
        saveToBites: draft.saveToBites || visibility === "private",
      });
      if ("error" in result) {
        Alert.alert("Could not submit", result.error);
        return;
      }
      if (currentUserId) await clearAddBiteDraft(currentUserId);
      hapticSuccess();
      patch({ mode: "success", restaurantId: result.restaurantId });
    } catch (e) {
      Alert.alert("Submission failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  const pickPhotos = async (fromCamera: boolean) => {
    if (draft.photoUris.length >= ADD_BITE_MAX_PHOTOS) {
      Alert.alert("Limit reached", `You can add up to ${ADD_BITE_MAX_PHOTOS} photos.`);
      return;
    }
    const remaining = ADD_BITE_MAX_PHOTOS - draft.photoUris.length;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Camera permission needed");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
      });
      if (!res.canceled && res.assets[0]?.uri) {
        patch({ photoUris: [...draft.photoUris, res.assets[0].uri] });
      }
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photo library permission needed");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });
    if (!res.canceled) {
      const uris = res.assets.map((a) => a.uri).filter(Boolean);
      patch({ photoUris: [...draft.photoUris, ...uris].slice(0, ADD_BITE_MAX_PHOTOS) });
    }
  };

  if (draft.mode === "success") {
    return (
      <View className={`flex-1 ${ui.screen} px-5 justify-center gap-4`}>
        <Text className={`text-3xl font-bold text-center ${ui.text.primary}`}>
          Your Bite was added
        </Text>
        <Text className={`text-center ${ui.text.secondary}`}>
          Saved to your Journal{draft.saveToBites ? " and Bites" : ""}.
        </Text>
        <Button
          label="View Restaurant"
          onPress={() => {
            if (draft.restaurantId) router.replace(`/restaurant/${draft.restaurantId}`);
            else router.replace("/(tabs)/feed");
          }}
        />
        <Button label="View Bites" variant="secondary" onPress={() => router.replace({ pathname: "/(tabs)/bites", params: { segment: "journal" } })} />
        <Button label="Return to Feed" variant="secondary" onPress={() => router.replace("/(tabs)/feed")} />
      </View>
    );
  }

  if (draft.mode === "bites_only") {
    return (
      <KeyboardAvoidingView
        className={`flex-1 ${ui.screen}`}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          className="flex-row items-center justify-between px-4 pb-2"
          style={{ paddingTop: Math.max(insets.top, 8) }}
        >
          <Pressable onPress={() => patch({ mode: "review" })} hitSlop={8}>
            <Text className={`text-base font-semibold ${ui.text.secondary}`}>Back</Text>
          </Pressable>
          <Text className={`text-base font-bold ${ui.text.primary}`}>Save to Bites</Text>
          <View style={{ width: 48 }} />
        </View>
        <ScrollView
          className="flex-1 px-4"
          contentContainerClassName="gap-4 pb-8 pt-2"
          keyboardShouldPersistTaps="always"
        >
          <Text className={`text-sm ${ui.text.secondary}`}>
            Bookmark this spot in Bites without a review. No rating and nothing on Feed.
          </Text>
          <PlaceSearch
            coords={coords}
            onSelect={onSelectPlace}
            onSelectLocal={onSelectLocalRestaurant}
            localRestaurants={restaurants}
            placeholder="Search restaurants…"
            autoFocus
            layout="fill"
          />
          {draft.restaurantName ? (
            <View className="rounded-2xl border border-savr-100 p-3 bg-white dark:bg-savr-900">
              <Text className={`font-bold ${ui.text.primary}`}>{draft.restaurantName}</Text>
              <Text className={`text-xs ${ui.text.secondary}`}>
                {[draft.cuisine, draft.city].filter(Boolean).join(" · ")}
              </Text>
            </View>
          ) : null}
          <TextInput
            value={draft.bitesNote}
            onChangeText={(t) => patch({ bitesNote: t })}
            placeholder="Optional note"
            placeholderTextColor={colors.placeholder}
            className={`rounded-xl border border-savr-200 px-3 py-3 ${ui.text.primary}`}
          />
          <Button
            label={submitting ? "Saving…" : "Save to My Bites"}
            onPress={() => void saveBitesOnly()}
            disabled={submitting || !draft.restaurantName}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const restaurantSubtitle = [draft.cuisine, draft.city].filter(Boolean).join(" · ");

  return (
    <View className={`flex-1 ${ui.screen}`} testID="add-bite-screen">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          className="flex-row items-center justify-between px-4 pb-3"
          style={{ paddingTop: Math.max(insets.top, 8) }}
        >
          <Pressable onPress={discardAndClose} hitSlop={8} accessibilityLabel="Cancel">
            <Text className={`text-base font-semibold ${ui.text.secondary}`}>Cancel</Text>
          </Pressable>
          <Text className={`text-base font-bold ${ui.text.primary}`}>New Post</Text>
          <View style={{ width: 56 }} />
        </View>

        <ScrollView
          className="flex-1 px-4"
          contentContainerClassName="gap-5 pb-6"
          keyboardShouldPersistTaps="handled"
        >
          <NewPostMediaPicker
            photoUris={draft.photoUris}
            coverPhotoIndex={draft.coverPhotoIndex}
            onAddPress={() =>
              promptAddPhotos({
                onCamera: () => void pickPhotos(true),
                onLibrary: () => void pickPhotos(false),
              })
            }
            onSelectCover={(i) => patch({ coverPhotoIndex: i })}
            onRemove={(i) =>
              patch({
                photoUris: draft.photoUris.filter((_, idx) => idx !== i),
                coverPhotoIndex: 0,
              })
            }
          />

          <NewPostRestaurantRow
            name={draft.restaurantName}
            subtitle={restaurantSubtitle}
            onPress={() => setPickingRestaurant(true)}
          />

          <TextInput
            value={draft.text}
            onChangeText={(t) => patch({ text: t.slice(0, ADD_BITE_MAX_TEXT) })}
            multiline
            placeholder="Write a caption..."
            placeholderTextColor={colors.placeholder}
            className={`min-h-[96px] rounded-2xl border px-3 py-3 text-base ${ui.text.primary}`}
            style={{ borderColor: brandColors.border, backgroundColor: brandColors.surface }}
            textAlignVertical="top"
          />

          <NewPostRatingRow
            value={draft.ratingValue}
            chosen={ratingChosen}
            onChange={(ratingValue) =>
              patch({ ratingMax: 10, ratingValue, ratingChosen: true })
            }
          />

          <NewPostDishesSection
            dishes={draft.dishes}
            onChange={(dishes) => patch({ dishes })}
          />

          <View
            className="rounded-2xl border px-4 py-3 gap-4"
            style={{ borderColor: brandColors.border, backgroundColor: brandColors.surface }}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="book-outline" size={22} color={brandColors.primary} />
              <View className="flex-1">
                <Text className={`text-base font-semibold ${ui.text.primary}`}>
                  Add to my journal
                </Text>
                <Text className={`text-xs mt-0.5 ${ui.text.muted}`}>
                  {newPostJournalSubcopy({
                    saveToBites: draft.saveToBites,
                    isPrivate: privateOn,
                  })}
                </Text>
              </View>
              <Switch
                value={draft.saveToBites || privateOn}
                disabled={privateOn}
                onValueChange={(saveToBites) => patch({ saveToBites })}
                trackColor={{ false: brandColors.border, true: brandColors.primarySoft }}
                thumbColor={draft.saveToBites || privateOn ? brandColors.primary : "#f4f3f4"}
              />
            </View>

            <View className="flex-row items-center gap-3">
              <Ionicons
                name={privateOn ? "lock-closed-outline" : "people-outline"}
                size={22}
                color={privateOn ? brandColors.textSecondary : brandColors.primary}
              />
              <View className="flex-1">
                <Text className={`text-base font-semibold ${ui.text.primary}`}>Private post</Text>
                <Text className={`text-xs mt-0.5 ${ui.text.muted}`}>
                  {newPostPrivateSubcopy(privateOn)}
                </Text>
              </View>
              <Switch
                value={privateOn}
                onValueChange={(on) =>
                  patch({
                    visibility: on ? "private" : "friends",
                    saveToBites: on ? true : draft.saveToBites,
                  })
                }
                trackColor={{ false: brandColors.border, true: brandColors.primarySoft }}
                thumbColor={privateOn ? brandColors.primary : "#f4f3f4"}
              />
            </View>
          </View>

          <NewPostMoreSection
            expanded={moreExpanded}
            onToggle={() => setMoreExpanded((v) => !v)}
            options={comparedOptions}
            compareRestaurantId={draft.compareRestaurantId}
            comparePreference={draft.comparePreference}
            onSelectRestaurant={(id) =>
              patch({
                compareRestaurantId: id,
                skipCompare: false,
              })
            }
            onSelectPreference={(comparePreference) =>
              patch({ comparePreference, skipCompare: false })
            }
            onClear={() =>
              patch({
                skipCompare: true,
                compareRestaurantId: null,
                comparePreference: null,
              })
            }
          />

          <Pressable
            onPress={() => patch({ mode: "bites_only", saveToBites: true })}
            hitSlop={8}
            className="self-center py-1"
          >
            <Text className={`text-sm underline ${ui.text.muted}`}>
              Save to Bites only (no review)
            </Text>
          </Pressable>
        </ScrollView>

        <View
          className="px-4 pt-2 border-t"
          style={{
            paddingBottom: Math.max(insets.bottom, 12),
            borderTopColor: brandColors.border,
            backgroundColor: brandColors.background,
          }}
        >
          {submitting ? (
            <View className="py-3">
              <ActivityIndicator color={colors.spinner} />
            </View>
          ) : (
            <Button
              label={newPostSubmitLabel(draft.visibility)}
              onPress={() => void submitReview()}
              disabled={!canSubmit}
              testID="new-post-submit"
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={pickingRestaurant}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickingRestaurant(false)}
      >
        <View className={`flex-1 ${ui.screen}`}>
          <View
            className="flex-row items-center justify-between px-4 pb-2"
            style={{ paddingTop: Math.max(insets.top, 12) }}
          >
            <Pressable onPress={() => setPickingRestaurant(false)} hitSlop={8}>
              <Text className={`text-base font-semibold ${ui.text.secondary}`}>Close</Text>
            </Pressable>
            <Text className={`text-base font-bold ${ui.text.primary}`}>Tag a restaurant</Text>
            <View style={{ width: 48 }} />
          </View>
          <RestaurantPickStep
            coords={coords}
            currentUserId={currentUserId}
            restaurants={restaurants}
            reviews={reviews}
            bookmarks={bookmarks}
            selectedRestaurantId={draft.restaurantId}
            selectedPlaceId={draft.place?.googlePlaceId ?? null}
            selectedName={draft.restaurantName}
            onSelectPlace={onSelectPlace}
            onSelectLocal={onSelectLocalRestaurant}
            onContinue={() => setPickingRestaurant(false)}
            onSaveWithoutReview={() => {
              setPickingRestaurant(false);
              patch({ mode: "bites_only", saveToBites: true });
            }}
            continueLabel="Done"
            showBookmarkLink={false}
          />
        </View>
      </Modal>
    </View>
  );
}
