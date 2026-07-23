import { View, Text } from "react-native";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ui } from "@/constants/ui";

export function FeedEmptyState({
  kind,
  onFindFriends,
  onDiscover,
  onResetFeed,
  onAdjustPreferences,
  onRetry,
}: {
  kind: "empty" | "filtered" | "error" | "friends";
  onFindFriends: () => void;
  onDiscover: () => void;
  onResetFeed: () => void;
  onAdjustPreferences: () => void;
  onRetry: () => void;
}) {
  if (kind === "error") {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="We couldn’t refresh your Feed."
        description="Check your connection and try again."
        actionLabel="Try Again"
        onAction={onRetry}
      />
    );
  }

  if (kind === "friends" || kind === "empty") {
    return (
      <View className="px-4 py-6 gap-4" testID="feed-friends-empty">
        <EmptyState
          icon="people-outline"
          title="No friend activity yet"
          description="Follow friends to see their reviews here. Discover nearby spots on the Discover tab."
          actionLabel="Find Friends"
          onAction={onFindFriends}
        />
        <Button label="Open Discover" variant="secondary" onPress={onDiscover} />
      </View>
    );
  }

  if (kind === "filtered") {
    return (
      <View className="px-4 py-8 gap-4 items-center" testID="feed-filtered-empty">
        <Text className={`text-lg font-semibold text-center ${ui.text.primary}`}>
          Nothing matches your Feed settings
        </Text>
        <Text className={`text-sm text-center ${ui.text.secondary}`}>
          Try resetting your Feed or adjusting preferences.
        </Text>
        <View className="flex-row gap-2 w-full mt-2">
          <Button label="Reset Feed" variant="secondary" onPress={onResetFeed} className="flex-1" />
          <Button label="Adjust Preferences" onPress={onAdjustPreferences} className="flex-1" />
        </View>
      </View>
    );
  }

  return null;
}
