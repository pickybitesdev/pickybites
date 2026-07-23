import { View } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";

export function FeedSkeleton() {
  return (
    <View className="px-4 gap-4" testID="feed-skeleton">
      {[0, 1, 2].map((i) => (
        <View key={i} className="rounded-2xl overflow-hidden border border-savr-100 dark:border-savr-800">
          <Skeleton style={{ width: "100%", height: 160 }} className="rounded-none" />
          <View className="p-3 gap-2">
            <Skeleton style={{ width: "66%", height: 16 }} />
            <Skeleton style={{ width: "50%", height: 12 }} />
            <Skeleton style={{ width: "100%", height: 12 }} />
          </View>
        </View>
      ))}
    </View>
  );
}
