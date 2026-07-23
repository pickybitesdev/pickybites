import { View, Text, Alert } from "react-native";
import { router } from "expo-router";
import { BucketListCard } from "@/components/bookmarks/BucketListCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Bookmark } from "@/lib/types";
import type { Coordinates } from "@/lib/places/types";
import { TRY_NEXT_LABEL } from "@/lib/bites";
import { ui } from "@/constants/ui";

export function BitesWantToTrySection({
  items,
  visitedItems,
  isEmpty,
  isFilterEmpty,
  hasSearch,
  coords,
  onOpen,
  onMarkPlanned,
  onMarkVisited,
  onLeaveReview,
  onMoveToWantToTry,
  onRemove,
}: {
  items: Bookmark[];
  visitedItems: Bookmark[];
  isEmpty: boolean;
  isFilterEmpty: boolean;
  hasSearch: boolean;
  coords: Coordinates | null;
  onOpen: (bookmark: Bookmark) => void;
  onMarkPlanned: (bookmark: Bookmark) => void;
  onMarkVisited: (bookmark: Bookmark) => void;
  onLeaveReview: (bookmark: Bookmark) => void;
  onMoveToWantToTry: (bookmark: Bookmark) => void;
  onRemove: (bookmarkId: string) => void;
}) {
  if (isEmpty) {
    return (
      <EmptyState
        icon="bookmark-outline"
        title={`Nothing on ${TRY_NEXT_LABEL} yet`}
        description="Tap the bookmark on Discover, Feed, or a restaurant to save it to Try Next."
        actionLabel="Explore Discover"
        onAction={() => router.push("/(tabs)/discover")}
      />
    );
  }

  if (isFilterEmpty) {
    return (
      <EmptyState
        icon={hasSearch ? "search-outline" : "filter-outline"}
        title={hasSearch ? "No matches" : "No spots match these filters"}
        description={
          hasSearch ? "Try a different search term." : "Clear filters to see your full list."
        }
      />
    );
  }

  return (
    <View className="gap-5" testID="bites-want-to-try-section">
      {items.length > 0 ? (
        <View className="gap-3">
          {items.map((bookmark) => (
            <BucketListCard
              key={bookmark.id}
              bookmark={bookmark}
              coords={coords}
              onPress={() => onOpen(bookmark)}
              onMarkPlanned={() => onMarkPlanned(bookmark)}
              onMarkVisited={() => onMarkVisited(bookmark)}
              onRemove={() => onRemove(bookmark.id)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="bookmark-outline"
          title={`No active ${TRY_NEXT_LABEL} spots`}
          description="Planned and saved spots show here. Visited places are listed below."
        />
      )}

      <View className="gap-3" testID="bites-visited-section">
        <View className="gap-1">
          <Text className={`text-sm font-semibold ${ui.text.secondary}`}>
            Visited — not yet reviewed
          </Text>
          <Text className={`text-xs ${ui.text.muted}`}>
            Places you’ve been. Add a Bite to grow Taste DNA — or move one back to{" "}
            {TRY_NEXT_LABEL}.
          </Text>
        </View>

        {visitedItems.length === 0 ? (
          <Text className={`text-xs ${ui.text.faint}`} testID="bites-visited-empty">
            No visited spots waiting for a Bite yet.
          </Text>
        ) : (
          visitedItems.map((bookmark) => (
            <BucketListCard
              key={bookmark.id}
              bookmark={bookmark}
              coords={coords}
              onPress={() => onOpen(bookmark)}
              onLeaveReview={() => onLeaveReview(bookmark)}
              onMoveToWantToTry={() => onMoveToWantToTry(bookmark)}
              onRemove={() => onRemove(bookmark.id)}
            />
          ))
        )}
      </View>
    </View>
  );
}

export function promptStartReview(restaurantId: string | null, placeName: string) {
  // Kept for callers that still use Alert; Bites screen uses VisitedFollowUpSheet.
  if (!restaurantId) {
    Alert.alert(
      "Marked as visited",
      `${placeName} is under Try Next → Visited. Open it from Discover when you're ready to add a Bite.`,
    );
    return;
  }
  Alert.alert("Ready to add a Bite?", `Capture the experience at ${placeName}.`, [
    { text: "Later", style: "cancel" },
    {
      text: "Add a Bite",
      onPress: () => router.push(`/add-bite?restaurantId=${restaurantId}`),
    },
  ]);
}
