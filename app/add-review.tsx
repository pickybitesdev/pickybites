import { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Image, Alert } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAppStore } from "@/store/useAppStore";
import { REVIEW_TAGS, type ReviewTag } from "@/lib/types";
import type { PlaceResult } from "@/lib/places/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Card } from "@/components/ui/Card";
import { PlaceSearch } from "@/components/restaurants/PlaceSearch";
import { VisitDatePicker } from "@/components/reviews/VisitDatePicker";
import { StepProgress } from "@/components/reviews/StepProgress";
import {
  StructuredRatingForm,
  createStructuredRatingState,
  type StructuredRatingState,
} from "@/components/reviews/StructuredRatingForm";
import { getCurrentCoordinates } from "@/lib/location";
import { Ionicons } from "@expo/vector-icons";
import { validateReviewSubmit } from "@/lib/review-validation";
import { goBackOr } from "@/lib/navigation";
import { ui } from "@/constants/ui";

const MAX_REVIEW_TEXT = 500;

const STEPS = ["Restaurant", "Ratings", "Favorite Dish", "Photos", "Tags", "Review"];

interface DishForm {
  name: string;
  rating: number;
  notes: string;
  isBestDish: boolean;
}

/** New reviews go through Add a Bite; this screen remains for editing existing reviews. */
export default function AddReviewScreen() {
  const { restaurantId: paramRestaurantId, reviewId: paramReviewId } = useLocalSearchParams<{
    restaurantId?: string;
    reviewId?: string;
  }>();

  if (!paramReviewId) {
    return (
      <Redirect
        href={
          paramRestaurantId
            ? { pathname: "/add-bite", params: { restaurantId: paramRestaurantId } }
            : "/add-bite"
        }
      />
    );
  }

  return <EditReviewScreen reviewId={paramReviewId} restaurantId={paramRestaurantId} />;
}

function EditReviewScreen({
  reviewId: paramReviewId,
  restaurantId: paramRestaurantId,
}: {
  reviewId: string;
  restaurantId?: string;
}) {
  const addReview = useAppStore((s) => s.addReview);
  const updateReview = useAppStore((s) => s.updateReview);
  const reviews = useAppStore((s) => s.reviews);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const getRestaurant = useAppStore((s) => s.getRestaurant);
  const getReview = useAppStore((s) => s.getReview);
  const ensureRestaurantFromPlace = useAppStore((s) => s.ensureRestaurantFromPlace);

  const editingReview = paramReviewId ? getReview(paramReviewId) : undefined;
  const isEditMode = Boolean(editingReview);

  const [step, setStep] = useState(1);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(
    editingReview?.restaurantId ?? paramRestaurantId ?? null,
  );
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [coords, setCoords] = useState<Awaited<ReturnType<typeof getCurrentCoordinates>>>(null);
  const [ratingState, setRatingState] = useState<StructuredRatingState>(() =>
    createStructuredRatingState(
      editingReview
        ? {
            categoryScores: editingReview.categoryScores,
            rating: editingReview.rating,
            ratingManualOverride: editingReview.ratingManualOverride,
            waitTime: editingReview.waitTime,
            wouldReturn: editingReview.wouldReturn,
            wouldRecommend: editingReview.wouldRecommend,
          }
        : undefined,
    ),
  );
  const [text, setText] = useState(editingReview?.text ?? "");
  const [visitDate, setVisitDate] = useState(editingReview?.visitDate ?? new Date().toISOString().split("T")[0]);
  const [tags, setTags] = useState<ReviewTag[]>(editingReview?.tags ?? []);
  const [photos, setPhotos] = useState<string[]>([]);
  const [dishes, setDishes] = useState<DishForm[]>([{ name: "", rating: 8, notes: "", isBestDish: true }]);
  const [loading, setLoading] = useState(false);

  const selectedRestaurant = selectedRestaurantId ? getRestaurant(selectedRestaurantId) : null;
  const hasSelection = Boolean(selectedRestaurant || selectedPlace);

  useEffect(() => {
    getCurrentCoordinates().then(setCoords);
  }, []);

  useEffect(() => {
    if (paramRestaurantId && !isEditMode) setStep(2);
  }, [paramRestaurantId, isEditMode]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled) setPhotos((p) => [...p, result.assets[0].uri]);
  };

  const handleSelectPlace = async (place: PlaceResult) => {
    setSelectedPlace(place);
    setSelectedRestaurantId(null);
    const result = await ensureRestaurantFromPlace(place);
    if (!("error" in result)) {
      setSelectedRestaurantId(result.id);
      setStep(2);
    }
  };

  const submit = async () => {
    if (!hasSelection && !isEditMode) {
      Alert.alert("Pick a restaurant", "Search and select a restaurant before publishing.");
      return;
    }
    setLoading(true);

    if (isEditMode && editingReview) {
      const result = await updateReview(editingReview.id, {
        rating: ratingState.rating,
        categoryScores: ratingState.categoryScores,
        ratingManualOverride: ratingState.ratingManualOverride,
        waitTime: ratingState.waitTime,
        wouldReturn: ratingState.wouldReturn,
        wouldRecommend: ratingState.wouldRecommend,
        text,
        visitDate,
        tags,
      });
      setLoading(false);
      if ("error" in result) {
        Alert.alert("Could not save", result.error);
        return;
      }
      router.replace(`/restaurant/${editingReview.restaurantId}`);
      return;
    }

    const wasFirstReview = reviews.filter((r) => r.userId === currentUserId).length === 0;
    const validation = validateReviewSubmit({
      restaurantId: selectedRestaurantId ?? undefined,
      placeName: selectedPlace?.name,
      restaurantName: selectedRestaurant?.name,
      rating: ratingState.rating,
      categoryScores: ratingState.categoryScores,
      ratingManualOverride: ratingState.ratingManualOverride,
      waitTime: ratingState.waitTime,
      wouldReturn: ratingState.wouldReturn,
      wouldRecommend: ratingState.wouldRecommend,
      text,
      visitDate,
      cuisine: selectedRestaurant?.cuisine ?? selectedPlace?.cuisine,
      city: selectedRestaurant?.city ?? selectedPlace?.city,
      priceLevel: selectedRestaurant?.priceLevel ?? selectedPlace?.priceLevel,
      tags,
      dishes: dishes.filter((d) => d.name.trim()).map((d) => ({
        name: d.name,
        rating: d.rating,
        notes: d.notes,
        isBestDish: d.isBestDish,
      })),
    });
    if (!validation.ok) {
      setLoading(false);
      Alert.alert("Review incomplete", validation.error);
      return;
    }

    const favoriteDish = dishes.find((d) => d.name.trim());
    const result = await addReview({
      restaurantId: selectedRestaurantId ?? undefined,
      place: selectedPlace ?? undefined,
      rating: ratingState.rating,
      categoryScores: ratingState.categoryScores,
      ratingManualOverride: ratingState.ratingManualOverride,
      waitTime: ratingState.waitTime,
      wouldReturn: ratingState.wouldReturn,
      wouldRecommend: ratingState.wouldRecommend,
      text,
      visitDate,
      tags,
      photoUris: photos,
      dishes: favoriteDish
        ? [{
            name: favoriteDish.name.trim(),
            rating: favoriteDish.rating,
            notes: favoriteDish.notes,
            photoUrl: null,
            isBestDish: true,
          }]
        : [],
    });
    setLoading(false);
    if ("error" in result) {
      Alert.alert("Could not publish", result.error);
      return;
    }
    if (wasFirstReview) {
      router.replace({ pathname: "/taste-unlocked", params: { restaurantId: result.restaurantId } });
      return;
    }
    router.replace(`/restaurant/${result.restaurantId}`);
  };

  const next = () => setStep((s) => Math.min(STEPS.length, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const exitReview = () => goBackOr("/(tabs)/discover");

  if (isEditMode) {
    return (
      <ScrollView className={`flex-1 ${ui.screen}`} contentContainerClassName="px-4 pb-8 gap-4" keyboardShouldPersistTaps="handled">
        <Text className={`text-lg font-semibold ${ui.text.primary}`}>Edit your review</Text>
        <Card className="gap-2">
          <Text className={`font-semibold text-lg ${ui.text.primary}`}>{selectedRestaurant?.name}</Text>
        </Card>
        <StructuredRatingForm value={ratingState} onChange={setRatingState} />
        <Input label="Review" value={text} onChangeText={setText} multiline numberOfLines={4} placeholder="What did you think?" />
        <VisitDatePicker value={visitDate} onChange={setVisitDate} />
        <View className="flex-row flex-wrap gap-2">
          {REVIEW_TAGS.map((t) => (
            <Tag key={t} label={t} active={tags.includes(t)} onPress={() => setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])} />
          ))}
        </View>
        <Button label="Save Changes" onPress={submit} loading={loading} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className={`flex-1 ${ui.screen}`} contentContainerClassName="px-4 pb-8 gap-5" keyboardShouldPersistTaps="handled">
      <StepProgress step={step} total={STEPS.length} labels={STEPS} />

      {step === 1 && (
        <View className="gap-4">
          <Text className={`text-2xl font-bold ${ui.text.primary}`}>Where did you eat?</Text>
          {!hasSelection ? (
            <PlaceSearch coords={coords} onSelect={handleSelectPlace} placeholder="Search restaurants..." autoFocus />
          ) : (
            <Card className="gap-2">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className={`font-semibold text-lg ${ui.text.primary}`}>
                    {selectedRestaurant?.name ?? selectedPlace?.name}
                  </Text>
                  <Text className={`text-sm ${ui.text.muted}`}>
                    {selectedRestaurant?.cuisine ?? selectedPlace?.cuisine} · {selectedRestaurant?.city ?? selectedPlace?.city}
                  </Text>
                </View>
                <Pressable onPress={() => { setSelectedPlace(null); setSelectedRestaurantId(null); }} className="p-2">
                  <Ionicons name="close-circle" size={24} color="#9D9692" />
                </Pressable>
              </View>
            </Card>
          )}
          <Button label="Continue" onPress={() => (hasSelection ? next() : Alert.alert("Pick a restaurant", "Search and select a spot first."))} />
          <Button label="Skip for now" variant="ghost" onPress={exitReview} />
        </View>
      )}

      {step === 2 && (
        <View className="gap-5">
          <StructuredRatingForm value={ratingState} onChange={setRatingState} />
          <View className="flex-row gap-3">
            <Button label="Back" variant="secondary" onPress={back} className="flex-1" />
            <Button label="Continue" onPress={next} className="flex-1" />
          </View>
        </View>
      )}

      {step === 3 && (
        <View className="gap-4">
          <Text className={`text-2xl font-bold ${ui.text.primary}`}>Favorite dish</Text>
          <Text className={`text-sm ${ui.text.secondary}`}>Optional — skip if you are rating the restaurant only.</Text>
          <Input
            value={dishes[0].name}
            onChangeText={(v) => setDishes([{ ...dishes[0], name: v }])}
            placeholder="e.g. Jerk chicken, omakase, margherita..."
          />
          <Input
            value={dishes[0].notes}
            onChangeText={(v) => setDishes([{ ...dishes[0], notes: v }])}
            placeholder="Quick note (optional)"
          />
          <View className="flex-row gap-3">
            <Button label="Back" variant="secondary" onPress={back} className="flex-1" />
            <Button label={dishes[0].name.trim() ? "Continue" : "Skip"} onPress={next} className="flex-1" />
          </View>
        </View>
      )}

      {step === 4 && (
        <View className="gap-4">
          <Text className={`text-2xl font-bold ${ui.text.primary}`}>Add photos</Text>
          <Pressable onPress={pickPhoto} className="border border-dashed border-savr-300 dark:border-savr-600 rounded-2xl p-8 items-center">
            <Ionicons name="camera" size={32} color="#FF8559" />
            <Text className={`mt-2 ${ui.text.secondary}`}>Tap to add photos</Text>
          </Pressable>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} className="w-full h-48 rounded-2xl" resizeMode="cover" />
          ))}
          <View className="flex-row gap-3">
            <Button label="Back" variant="secondary" onPress={back} className="flex-1" />
            <Button label={photos.length ? "Continue" : "Skip"} onPress={next} className="flex-1" />
          </View>
        </View>
      )}

      {step === 5 && (
        <View className="gap-4">
          <Text className={`text-2xl font-bold ${ui.text.primary}`}>Tags</Text>
          <Text className={`text-sm ${ui.text.secondary}`}>What stood out about this visit?</Text>
          <View className="flex-row flex-wrap gap-2">
            {REVIEW_TAGS.map((t) => (
              <Tag key={t} label={t} active={tags.includes(t)} onPress={() => setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])} />
            ))}
          </View>
          <View className="flex-row gap-3">
            <Button label="Back" variant="secondary" onPress={back} className="flex-1" />
            <Button label="Continue" onPress={next} className="flex-1" />
          </View>
        </View>
      )}

      {step === 6 && (
        <View className="gap-4">
          <Text className={`text-2xl font-bold ${ui.text.primary}`}>Short review</Text>
          <Input label="Your thoughts" value={text} onChangeText={setText} multiline numberOfLines={4} placeholder="What made this visit memorable?" maxLength={MAX_REVIEW_TEXT} />
          <VisitDatePicker value={visitDate} onChange={setVisitDate} />
          <View className="flex-row gap-3">
            <Button label="Back" variant="secondary" onPress={back} className="flex-1" />
            <Button label="Publish Review" onPress={submit} loading={loading} className="flex-1" />
          </View>
        </View>
      )}
    </ScrollView>
  );
}
