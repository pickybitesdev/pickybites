import { View, Text, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { Bookmark } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import { BucketListProgress } from "@/components/bookmarks/BucketListProgress";
import { getBucketListStats, getStatusLabel } from "@/lib/bucket-list";
import { cn } from "@/lib/utils";
import { hapticLight } from "@/lib/haptics";
import { useThemedColors } from "@/lib/useThemedColors";
import { ui } from "@/constants/ui";

const CARD_WIDTH = 240;

export function WantToTrySection({
  bookmarks,
  onOpen,
}: {
  bookmarks: Bookmark[];
  onOpen: (bookmark: Bookmark) => void;
}) {
  const colors = useThemedColors();
  const stats = getBucketListStats(bookmarks);
  const active = bookmarks.filter((b) => b.status !== "visited");

  if (!bookmarks.length) {
    return (
      <View className="gap-2 px-4">
        <HomeSectionHeader title="Try Next" subtitle="Spots you’ve saved to try" icon="bookmark" />
        <Pressable onPress={() => router.push("/(tabs)/discover")}>
          <Text className={`text-sm leading-5 ${ui.text.secondary}`}>
            Tap the bookmark on Discover or Feed to save restaurants to Try Next.
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="px-4">
        <BucketListProgress stats={stats} />
      </View>
      <View className="px-4 flex-row items-end justify-between">
        <HomeSectionHeader title="Try Next" subtitle="Recently saved" icon="bookmark" />
        <Pressable
          onPress={() =>
            router.push({ pathname: "/(tabs)/bites", params: { segment: "want_to_try" } })
          }
          hitSlop={8}
        >
          <Text className="text-sm font-semibold text-savr-350 dark:text-savr-400">See all</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-4 gap-3">
        {(active.length ? active : bookmarks).slice(0, 8).map((bookmark) => (
          <Pressable
            key={bookmark.id}
            style={{ width: CARD_WIDTH }}
            onPress={() => {
              hapticLight();
              onOpen(bookmark);
            }}
          >
            <Card className="p-0 overflow-hidden">
              {bookmark.placeImageUrl ? (
                <Image source={{ uri: bookmark.placeImageUrl }} style={{ width: "100%", height: 120 }} contentFit="cover" />
              ) : (
                <View className={cn("h-[120px] items-center justify-center", ui.surface.muted)}>
                  <Ionicons name="restaurant" size={32} color={colors.brand} />
                </View>
              )}
              <View className="p-4 gap-1">
                <Text className={`font-semibold ${ui.text.primary}`} numberOfLines={1}>
                  {bookmark.placeName}
                </Text>
                <Text className={`text-xs ${ui.text.muted}`} numberOfLines={1}>
                  {getStatusLabel(bookmark.status)} · {bookmark.placeCuisine ?? "Restaurant"}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
