import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Restaurant } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import { formatDate, formatPrice, cn } from "@/lib/utils";
import { ui } from "@/constants/ui";

const PODIUM = ["#D4A017", "#9CA3AF", "#CD7F32"] as const;

export function RankingCard({
  rank,
  restaurant,
  rating,
  visitDate,
  subtitle,
  onPress,
}: {
  rank: number;
  restaurant: Restaurant;
  rating: number;
  visitDate?: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const isPodium = rank <= 3;
  const accent = isPodium ? PODIUM[rank - 1] : undefined;

  return (
    <Pressable onPress={onPress}>
      <Card
        className={cn(
          "p-0 overflow-hidden",
          isPodium && "border-2",
        )}
        style={isPodium ? { borderColor: `${accent}55` } : undefined}
      >
        <View className="flex-row">
          {restaurant.imageUrl ? (
            <Image source={{ uri: restaurant.imageUrl }} style={{ width: 112, height: 112 }} contentFit="cover" />
          ) : (
            <View className={cn("w-28 h-28 items-center justify-center", ui.surface.muted)}>
              <Ionicons name="restaurant" size={28} color="#FF8559" />
            </View>
          )}
          <View className="flex-1 p-4 justify-center gap-1.5">
            <View className="flex-row items-center gap-2">
              <Text className="text-3xl font-black" style={{ color: accent ?? "#FF8559" }}>
                #{rank}
              </Text>
              {isPodium ? <Ionicons name="trophy" size={18} color={accent} /> : null}
            </View>
            <Text className={`text-base font-semibold ${ui.text.primary}`} numberOfLines={1}>
              {restaurant.name}
            </Text>
            <Text className={`text-xs ${ui.text.muted}`}>
              {restaurant.cuisine} · {formatPrice(restaurant.priceLevel)}
            </Text>
            {visitDate ? (
              <Text className={`text-xs ${ui.text.faint}`}>Visited {formatDate(visitDate)}</Text>
            ) : null}
            {subtitle ? <Text className={`text-xs ${ui.text.secondary}`} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
          <View className="justify-center pr-4">
            <Rating value={rating} size="lg" />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function DishRankingCard({
  rank,
  dishName,
  restaurantName,
  rating,
  isBestDish,
  photoUrl,
  visitDate,
  cuisine,
  onPress,
}: {
  rank: number;
  dishName: string;
  restaurantName: string;
  rating: number;
  isBestDish?: boolean;
  photoUrl?: string | null;
  visitDate?: string;
  cuisine?: string;
  onPress: () => void;
}) {
  const isPodium = rank <= 3;
  const accent = isPodium ? PODIUM[rank - 1] : undefined;

  return (
    <Pressable onPress={onPress}>
      <Card className={cn("p-0 overflow-hidden", isPodium && "border-2")} style={isPodium ? { borderColor: `${accent}55` } : undefined}>
        <View className="flex-row">
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: 112, height: 112 }} contentFit="cover" />
          ) : (
            <View className={cn("w-28 h-28 items-center justify-center", ui.surface.muted)}>
              <Ionicons name="fast-food" size={28} color="#FF8559" />
            </View>
          )}
          <View className="flex-1 p-4 justify-center gap-1.5">
            <View className="flex-row items-center gap-2">
              <Text className="text-3xl font-black" style={{ color: accent ?? "#FF8559" }}>
                #{rank}
              </Text>
              {isBestDish ? <Ionicons name="star" size={16} color="#FF8559" /> : null}
            </View>
            <Text className={`text-base font-semibold ${ui.text.primary}`} numberOfLines={1}>
              {dishName}
            </Text>
            <Text className={`text-xs ${ui.text.muted}`} numberOfLines={1}>
              {restaurantName}
              {cuisine ? ` · ${cuisine}` : ""}
            </Text>
            {visitDate ? (
              <Text className={`text-xs ${ui.text.faint}`}>Visited {formatDate(visitDate)}</Text>
            ) : null}
          </View>
          <View className="justify-center pr-4">
            <Rating value={rating} size="lg" />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
