import { useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { calculateTasteDNA } from "@/lib/taste-dna";
import { getRestaurantRankings } from "@/lib/rankings";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FadeInView } from "@/components/ui/FadeInView";
import { Rating } from "@/components/ui/Rating";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";

export default function TasteUnlockedScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId?: string }>();
  const { currentUserId, users, reviews, dishes, restaurants } = useAppStore();
  const user = users.find((u) => u.id === currentUserId);

  const dna = useMemo(
    () => (currentUserId ? calculateTasteDNA(currentUserId, reviews, dishes, restaurants) : null),
    [currentUserId, reviews, dishes, restaurants],
  );

  const reviewCount = reviews.filter((r) => r.userId === currentUserId).length;
  const personality = dna?.personality ?? {
    label: "New Explorer" as const,
    headline: "You are a New Explorer",
    explanation: "Write a few more reviews and your food personality will take shape automatically.",
  };
  const topCuisine = dna?.topCuisine ?? user?.favoriteCuisines[0] ?? "—";
  const firstRank = currentUserId
    ? getRestaurantRankings(currentUserId, reviews, restaurants, {}, 1)[0]
    : undefined;
  const restaurant = restaurantId ? restaurants.find((r) => r.id === restaurantId) : null;

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`}>
      <ScrollView contentContainerClassName="px-6 py-10 gap-6 items-center">
        <FadeInView className="items-center gap-3">
          <View className="w-20 h-20 rounded-full bg-savr-500 items-center justify-center">
            <Ionicons name="sparkles" size={40} color="#fff" />
          </View>
          <Text className={`text-3xl font-black text-center ${ui.text.primary}`}>Taste Profile Updated</Text>
          <Text className={`text-base text-center leading-6 ${ui.text.secondary}`}>
            {restaurant
              ? `Your review of ${restaurant.name} unlocked your personal taste map.`
              : "Your first review unlocked your personal taste map."}
          </Text>
        </FadeInView>

        <FadeInView delay={120} className="w-full gap-4">
          <Card className={cn("p-5 gap-2 items-center", ui.accentCard)}>
            <Text className={`text-xs uppercase tracking-widest font-semibold ${ui.text.muted}`}>Food personality</Text>
            <Text className={`text-2xl font-black text-center ${ui.text.primary}`}>{personality.headline}</Text>
            <Text className={`text-sm text-center leading-5 ${ui.text.secondary}`}>{personality.explanation}</Text>
          </Card>

          <Card className="p-5 gap-2">
            <Text className={`text-xs uppercase tracking-widest font-semibold ${ui.text.muted}`}>Top cuisine</Text>
            <Text className={`text-xl font-bold ${ui.text.primary}`}>{topCuisine}</Text>
          </Card>

          {firstRank && (
            <Card className="p-5 gap-3">
              <Text className={`text-xs uppercase tracking-widest font-semibold ${ui.text.muted}`}>First ranking</Text>
              <Text className={`text-lg font-bold ${ui.text.primary}`}>#1 {firstRank.restaurant.name}</Text>
              <Rating value={firstRank.rating} size="md" />
            </Card>
          )}
        </FadeInView>

        <FadeInView delay={220} className="w-full gap-3">
          <Button
            label="Explore Your Profile"
            onPress={() => router.replace("/(tabs)/profile")}
          />
          {restaurantId && (
            <Button
              label="View Restaurant"
              variant="secondary"
              onPress={() => router.replace(`/restaurant/${restaurantId}`)}
            />
          )}
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}
