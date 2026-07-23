import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "./Button";
import { useThemedColors } from "@/lib/useThemedColors";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";

type IconName = keyof typeof Ionicons.glyphMap;

export function EmptyState({
  icon = "restaurant-outline",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}) {
  const colors = useThemedColors();
  const hasPrimary = Boolean(actionLabel && onAction);
  const hasSecondary = Boolean(secondaryActionLabel && onSecondaryAction);

  return (
    <View className="items-center justify-center py-12 px-6">
      <View className={cn("w-20 h-20 rounded-full items-center justify-center mb-4", ui.surface.muted)}>
        <Ionicons name={icon} size={36} color={colors.brand} />
      </View>
      <Text className={`text-lg font-semibold text-center ${ui.text.primary}`}>{title}</Text>
      {description && (
        <Text className={`text-sm text-center mt-2 leading-5 max-w-[280px] ${ui.text.muted}`}>
          {description}
        </Text>
      )}
      {(hasPrimary || hasSecondary) && (
        <View className="mt-6 w-full gap-3">
          {hasPrimary ? <Button label={actionLabel!} onPress={onAction!} /> : null}
          {hasSecondary ? (
            <Button label={secondaryActionLabel!} variant="secondary" onPress={onSecondaryAction!} />
          ) : null}
        </View>
      )}
    </View>
  );
}
