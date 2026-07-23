import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { APP_NAME } from "@/constants/branding";
import { iconColors } from "@/constants/ui";
import type { MapPinType } from "@/lib/maps/pins";

export function MapPinSheet({
  title,
  subtitle,
  type,
  isBookmarked,
  onClose,
  onView,
  onRate,
  onBookmark,
  onAddToList,
}: {
  title: string;
  subtitle?: string;
  type: MapPinType;
  isBookmarked?: boolean;
  onClose: () => void;
  onView: () => void;
  onRate: () => void;
  onBookmark?: () => void;
  onAddToList?: () => void;
}) {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white dark:bg-savr-900 rounded-t-3xl px-5 pt-3 pb-6 gap-3"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 12,
      }}
    >
      <View className="items-center mb-1">
        <View className="w-10 h-1 rounded-full bg-savr-200 dark:bg-savr-700" />
      </View>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: type === "rated" ? iconColors.brand : iconColors.muted }}
            />
            <Text className="text-xs text-savr-500 dark:text-savr-400 uppercase">
              {type === "rated" ? `Rated on ${APP_NAME}` : "Nearby"}
            </Text>
          </View>
          <Text className="text-xl font-bold text-savr-900 dark:text-savr-100 mt-1">{title}</Text>
          {subtitle ? <Text className="text-sm text-savr-500 dark:text-savr-400 mt-0.5">{subtitle}</Text> : null}
        </View>
        <Pressable onPress={onClose} className="p-2">
          <Ionicons name="close" size={22} color="#9D9692" />
        </Pressable>
      </View>

      <View className="flex-row gap-2">
        <Button label={type === "rated" ? "View" : "Rate"} onPress={onRate} className="flex-1" />
        {onBookmark && (
          <Pressable
            onPress={onBookmark}
            className="w-12 h-12 rounded-xl bg-savr-100 dark:bg-savr-800 items-center justify-center"
          >
            <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={22} color={iconColors.brand} />
          </Pressable>
        )}
        {onAddToList && (
          <Pressable
            onPress={onAddToList}
            className="w-12 h-12 rounded-xl bg-savr-100 dark:bg-savr-800 items-center justify-center"
          >
            <Ionicons name="list-outline" size={22} color={iconColors.brand} />
          </Pressable>
        )}
      </View>
      {type === "rated" && (
        <Pressable onPress={onView}>
          <Text className="text-sm text-savr-350 dark:text-savr-300 text-center">Open restaurant page →</Text>
        </Pressable>
      )}
    </View>
  );
}
