import { View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Recommendation } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";
import { useThemedColors } from "@/lib/useThemedColors";
import { ui } from "@/constants/ui";

const CARD_WIDTH = Dimensions.get("window").width * 0.72;

export function ForYouCarousel({ recommendations }: { recommendations: Recommendation[] }) {
  const colors = useThemedColors();
  if (!recommendations.length) return null;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2 px-4">
        <Ionicons name="sparkles" size={18} color={colors.brand} />
        <Text className={`text-lg font-semibold ${ui.text.primary}`}>Best Matches For You</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 12}
        contentContainerClassName="px-4 gap-3"
      >
        {recommendations.map((rec) => (
          <Pressable
            key={rec.restaurant.id}
            style={{ width: CARD_WIDTH }}
            onPress={() => {
              hapticLight();
              router.push(`/restaurant/${rec.restaurant.id}`);
            }}
          >
            <Card className="p-0 overflow-hidden">
              {rec.restaurant.imageUrl ? (
                <Image
                  source={{ uri: rec.restaurant.imageUrl }}
                  style={{ width: "100%", height: 140 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View className={cn("h-[140px] items-center justify-center", ui.surface.muted)}>
                  <Ionicons name="restaurant" size={32} color={colors.brand} />
                </View>
              )}
              <View className="p-4 gap-2">
                <View className="flex-row justify-between items-start gap-2">
                  <Text className="font-semibold text-base text-savr-900 dark:text-savr-100 flex-1" numberOfLines={1}>
                    {rec.restaurant.name}
                  </Text>
                  <View className={cn("px-2.5 py-1 rounded-full", ui.surface.muted)}>
                    <Text className={`text-xs font-bold ${ui.text.secondary}`}>{rec.confidence}%</Text>
                  </View>
                </View>
                <Text className="text-xs text-savr-500 dark:text-savr-400">
                  {rec.restaurant.cuisine} · {rec.restaurant.city}
                </Text>
                <Text className="text-sm text-savr-350 dark:text-savr-300 leading-5" numberOfLines={2}>
                  {rec.reason}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

