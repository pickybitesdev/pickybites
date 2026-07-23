import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { goBackOr } from "@/lib/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Ionicons } from "@expo/vector-icons";
import { ui } from "@/constants/ui";

export default function AddDishScreen() {
  const { currentUserId, reviews, getRestaurant, addDish } = useAppStore();
  const myReviews = reviews
    .filter((r) => r.userId === currentUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [reviewId, setReviewId] = useState<string | null>(myReviews[0]?.id ?? null);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(8);
  const [notes, setNotes] = useState("");
  const [isBestDish, setIsBestDish] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedReview = reviewId ? reviews.find((r) => r.id === reviewId) : null;
  const restaurant = selectedReview ? getRestaurant(selectedReview.restaurantId) : null;

  const submit = async () => {
    if (!reviewId) {
      Alert.alert("Pick a review", "Select which visit this dish belongs to.");
      return;
    }
    setLoading(true);
    const result = await addDish(reviewId, { name, rating, notes, isBestDish });
    setLoading(false);
    if ("error" in result) Alert.alert("Could not add dish", result.error);
    else goBackOr("/(tabs)/add");
  };

  if (myReviews.length === 0) {
    return (
      <View className="flex-1 bg-savr-50 dark:bg-savr-950 items-center justify-center px-6 gap-4">
        <Text className={`text-lg font-semibold text-center ${ui.text.primary}`}>No reviews yet</Text>
        <Text className={`text-sm text-center ${ui.text.muted}`}>Write a restaurant review first, then log dishes quickly.</Text>
        <Button label="Write a Review" onPress={() => router.replace("/add-bite")} />
        <Button label="Not now" variant="ghost" onPress={() => goBackOr("/(tabs)/add")} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-savr-50 dark:bg-savr-950" contentContainerClassName="px-4 pb-8 gap-4" keyboardShouldPersistTaps="handled">
      <Text className="text-lg font-semibold text-savr-900 dark:text-savr-100">Which visit?</Text>
      {myReviews.map((r) => {
        const rest = getRestaurant(r.restaurantId);
        const active = reviewId === r.id;
        return (
          <Pressable key={r.id} onPress={() => setReviewId(r.id)}>
            <Card className={active ? "border-savr-500" : ""}>
              <Text className="font-semibold text-savr-900 dark:text-savr-100">{rest?.name ?? "Restaurant"}</Text>
              <Text className={`text-xs ${ui.text.muted}`}>{r.visitDate} · {r.rating}/10</Text>
            </Card>
          </Pressable>
        );
      })}

      {restaurant && (
        <>
          <Text className="text-lg font-semibold text-savr-900 dark:text-savr-100 mt-2">Dish details</Text>
          <Input label="Dish name" value={name} onChangeText={setName} placeholder="Tonkotsu Ramen" />
          <View className="gap-2">
            <Text className="text-sm font-medium text-savr-700 dark:text-savr-300">Rating: {rating.toFixed(1)}</Text>
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => setRating((v) => Math.max(1, v - 0.5))}>
                <Ionicons name="remove-circle-outline" size={32} color="#FF8559" />
              </Pressable>
              <Pressable onPress={() => setRating((v) => Math.min(10, v + 0.5))}>
                <Ionicons name="add-circle-outline" size={32} color="#FF8559" />
              </Pressable>
            </View>
          </View>
          <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Broth was incredible..." multiline />
          <Pressable onPress={() => setIsBestDish(!isBestDish)} className="flex-row items-center gap-2">
            <Ionicons name={isBestDish ? "star" : "star-outline"} size={22} color="#FF8559" />
            <Text className="text-savr-800 dark:text-savr-200">Mark as best dish</Text>
          </Pressable>
          <Button label="Log Dish" onPress={submit} loading={loading} />
        </>
      )}
    </ScrollView>
  );
}
