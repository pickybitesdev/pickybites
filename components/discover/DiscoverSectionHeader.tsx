import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { ui } from "@/constants/ui";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function DiscoverSectionHeader({
  icon,
  iconColor = "#FF8559",
  title,
  subtitle,
  onAction,
  actionIcon = "refresh",
  trailing,
}: {
  icon: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionIcon?: IconName;
  trailing?: ReactNode;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 flex-row items-start gap-2.5">
        <View className={`w-9 h-9 rounded-xl items-center justify-center ${ui.surface.muted}`}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className={`font-semibold text-base ${ui.text.primary}`}>{title}</Text>
          {subtitle ? <Text className={`text-xs mt-0.5 ${ui.text.muted}`}>{subtitle}</Text> : null}
        </View>
      </View>
      {trailing}
      {onAction && !trailing && (
        <Pressable onPress={onAction} hitSlop={8} className={`p-2 rounded-xl ${ui.surface.muted}`}>
          <Ionicons name={actionIcon} size={18} color={iconColor} />
        </Pressable>
      )}
    </View>
  );
}

