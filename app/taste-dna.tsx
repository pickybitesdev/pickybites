import { View, Text, ScrollView } from "react-native";
import { router } from "expo-router";
import { Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "@/store/useAppStore";
import { calculateTasteDNA } from "@/lib/taste-dna";
import { Card } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import { ScoreMeter } from "@/components/taste/ScoreMeter";
import { CATEGORY_LABELS } from "@/lib/review-scores";
import { FadeInView } from "@/components/ui/FadeInView";
import { DishCard } from "@/components/dishes/DishCard";
import { TastePersonalityCard, TasteDNAStatsGrid } from "@/components/taste/TastePersonalityCard";
import { formatPrice } from "@/lib/utils";
import { ui } from "@/constants/ui";

export default function TasteDNAScreen() {
  const { currentUserId, reviews, dishes, restaurants, getRestaurant } = useAppStore();
  const dna = currentUserId ? calculateTasteDNA(currentUserId, reviews, dishes, restaurants) : null;
  if (!dna) return null;

  const reviewCount = reviews.filter((r) => r.userId === currentUserId).length;
  const topCuisine = dna.topCuisine ?? "—";
  const budgetStyle = dna.preferredPriceLevel ? formatPrice(dna.preferredPriceLevel) : "$$";

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["bottom"]}>
      <ScrollView contentContainerClassName="pb-8 gap-5">
        <FadeInView className="mx-4 rounded-3xl overflow-hidden bg-savr-700 dark:bg-savr-800">
          <View className="px-6 py-8 gap-3">
            <Text className="text-white/80 text-sm font-semibold uppercase tracking-widest">Taste DNA</Text>
            <Text className="text-white text-3xl font-black">Your flavor profile</Text>
            <Text className="text-white text-2xl font-black">{dna.personality.headline}</Text>
            <Text className="text-white/90 text-sm leading-6">{dna.personality.explanation}</Text>
          </View>
        </FadeInView>

        <View className="px-4 gap-4">
          <TastePersonalityCard personality={dna.personality} />

          <Card className="gap-3 p-5">
            <Text className={`text-lg font-semibold ${ui.text.primary}`}>Your taste snapshot</Text>
            <TasteDNAStatsGrid
              topCuisine={topCuisine}
              top3Cuisines={dna.top3Cuisines}
              budgetStyle={budgetStyle}
              adventureScore={dna.adventureScore}
              mostVisitedCity={dna.mostVisitedCity}
              averageRating={dna.averageRating}
              favoriteRestaurantType={dna.favoriteRestaurantType}
              reviewCount={reviewCount}
            />
          </Card>

          {reviewCount > 0 && (
            <Card className="gap-3 p-5">
              <Text className={`text-lg font-semibold ${ui.text.primary}`}>What you value most</Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORY_LABELS.map(({ key, label }) => (
                  <View key={key} className="rounded-lg px-2.5 py-1.5 bg-savr-100 dark:bg-savr-800">
                    <Text className={`text-[10px] uppercase ${ui.text.muted}`}>{label}</Text>
                    <Text className={`text-sm font-semibold ${ui.text.primary}`}>
                      {dna.categoryAverages[key].toFixed(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          <Card className="gap-5 p-5">
            <ScoreMeter label="Adventure Score" score={dna.adventureScore} reviewCount={reviewCount} kind="adventure" />
            <ScoreMeter label="Luxury Score" score={dna.luxuryScore} reviewCount={reviewCount} accent="#8B5CF6" />
            <ScoreMeter
              label="Hidden Gem Hunter"
              score={dna.hiddenGemScore}
              reviewCount={reviewCount}
              kind="hidden-gem"
              accent="#059669"
            />
            <ScoreMeter label="Date Night Score" score={dna.dateNightScore} reviewCount={reviewCount} accent="#DB2777" />
            <ScoreMeter label="Vegan Score" score={dna.veganFriendlyScore} reviewCount={reviewCount} accent="#16A34A" />
          </Card>

          {dna.favoriteCuisines.length > 0 && (
            <View className="gap-3">
              <Text className={`text-lg font-semibold ${ui.text.primary}`}>Cuisines you visit most</Text>
              {dna.favoriteCuisines.slice(0, 5).map((c) => (
                <Card key={c.cuisine} className="flex-row justify-between items-center py-4 px-4">
                  <View>
                    <Text className={`font-medium text-base ${ui.text.primary}`}>{c.cuisine}</Text>
                    <Text className={`text-xs ${ui.text.muted}`}>{c.count} visit{c.count === 1 ? "" : "s"}</Text>
                  </View>
                  <Rating value={c.avgRating} size="md" />
                </Card>
              ))}
            </View>
          )}

          {dna.topRestaurants.length > 0 && (
            <View className="gap-3">
              <Text className={`text-lg font-semibold ${ui.text.primary}`}>Top Restaurants</Text>
              {dna.topRestaurants.map((item, i) => (
                <Pressable key={item.restaurant.id} onPress={() => router.push(`/restaurant/${item.restaurant.id}`)}>
                  <Card className="flex-row items-center gap-3 py-4 px-4">
                    <Text className="text-2xl font-black text-savr-350 dark:text-savr-400 w-8">{i + 1}</Text>
                    <Text className={`flex-1 font-medium ${ui.text.primary}`}>{item.restaurant.name}</Text>
                    <Rating value={item.rating} size="md" />
                  </Card>
                </Pressable>
              ))}
            </View>
          )}

          {dna.topDishes.length > 0 && (
            <View className="gap-3">
              <Text className={`text-lg font-semibold ${ui.text.primary}`}>Top Dishes</Text>
              {dna.topDishes.map((d) => {
                const r = getRestaurant(d.restaurantId);
                return r ? <DishCard key={d.id} dish={d} restaurant={r} /> : null;
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
