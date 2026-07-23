import { View } from "react-native";
import { router } from "expo-router";
import { ListPreviewCard } from "@/components/lists/ListPreviewCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import type { List, ListItem, Restaurant } from "@/lib/types";

export function BitesListsSection({
  lists,
  listItems,
  getRestaurant,
  isFilterEmpty,
  hasSearch,
}: {
  lists: List[];
  listItems: ListItem[];
  getRestaurant: (id: string) => Restaurant | undefined;
  isFilterEmpty: boolean;
  hasSearch: boolean;
}) {
  if (lists.length === 0 && !hasSearch) {
    return (
      <View className="gap-3">
        <Button label="Create New List" onPress={() => router.push("/create-list")} />
        <EmptyState
          icon="list-outline"
          title="No lists yet"
          description="Group date-night picks, must-try spots, or trip plans into shareable lists."
          actionLabel="Create a List"
          onAction={() => router.push("/create-list")}
        />
      </View>
    );
  }

  if (isFilterEmpty || (hasSearch && lists.length === 0)) {
    return (
      <EmptyState
        icon="search-outline"
        title="No matching lists"
        description="Try a different search term."
      />
    );
  }

  return (
    <View className="gap-3">
      <Button label="Create New List" onPress={() => router.push("/create-list")} />
      {lists.map((list) => {
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
  );
}
