import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ListPreviewCard } from "@/components/lists/ListPreviewCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ui } from "@/constants/ui";
import { iconColors } from "@/constants/ui";
import { useThemeStore } from "@/store/useThemeStore";

export default function ListsScreen() {
  const isDark = useThemeStore((s) => s.resolved) === "dark";
  const { getMyLists, listItems, getRestaurant } = useAppStore();
  const userLists = getMyLists();

  const stats = useMemo(() => {
    const spotCount = userLists.reduce(
      (sum, list) => sum + listItems.filter((li) => li.listId === list.id).length,
      0,
    );
    return { listCount: userLists.length, spotCount };
  }, [userLists, listItems]);

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["top"]}>
      <ScrollView contentContainerClassName="px-4 pb-28 gap-5" showsVerticalScrollIndicator={false}>
        <View className="pt-2 gap-1">
          <Text className={`text-2xl font-bold ${ui.text.primary}`}>Lists</Text>
          <Text className={`text-sm ${ui.text.muted}`}>
            {stats.listCount} list{stats.listCount === 1 ? "" : "s"} · {stats.spotCount} spot
            {stats.spotCount === 1 ? "" : "s"}
          </Text>
        </View>

        <Button label="Create New List" onPress={() => router.push("/create-list")} />

        {userLists.length === 0 ? (
          <EmptyState
            icon="list-outline"
            title="No lists yet"
            description="Group date-night picks, must-try spots, or trip plans into shareable lists."
            actionLabel="Create a List"
            onAction={() => router.push("/create-list")}
          />
        ) : (
          <View className="gap-3">
            <Text className={`text-xs font-semibold uppercase tracking-wide ${ui.text.muted}`}>
              Your lists
            </Text>
            {userLists.map((list) => {
              const items = listItems
                .filter((li) => li.listId === list.id)
                .sort((a, b) => a.position - b.position);
              const previewNames = items
                .map((item) => getRestaurant(item.restaurantId)?.name)
                .filter(Boolean) as string[];

              return (
                <ListPreviewCard
                  key={list.id}
                  name={list.name}
                  description={list.description}
                  spotCount={items.length}
                  previewNames={previewNames}
                  onPress={() => router.push({ pathname: "/list/[id]", params: { id: list.id } })}
                />
              );
            })}
          </View>
        )}

        <Pressable
          onPress={() => router.push({ pathname: "/(tabs)/bites", params: { segment: "lists" } })}
          className={`flex-row items-center gap-3 rounded-2xl p-4 ${ui.surface.card}`}
        >
          <View className={`w-11 h-11 rounded-2xl items-center justify-center ${ui.surface.muted}`}>
            <Ionicons name="bookmark" size={22} color={isDark ? iconColors.brandDark : iconColors.brand} />
          </View>
          <View className="flex-1">
            <Text className={`font-semibold ${ui.text.primary}`}>Bites</Text>
            <Text className={`text-sm ${ui.text.muted}`}>Try Next and Lists in Bites</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={isDark ? iconColors.mutedDark : iconColors.muted} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
