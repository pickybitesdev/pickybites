import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ui } from "@/constants/ui";
import { useThemedColors } from "@/lib/useThemedColors";
import { cn } from "@/lib/utils";

export function FriendsSearchBar({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  const colors = useThemedColors();

  return (
    <View className="gap-2">
      <Text className={`text-base font-bold ${ui.text.primary}`}>Find friends</Text>
      <View
        className={cn(
          "flex-row items-center gap-3 rounded-2xl px-3 py-2 min-h-[56px]",
          "bg-white dark:bg-savr-875",
          "border-2 border-savr-400 dark:border-savr-500",
        )}
        accessibilityRole="search"
      >
        <View className="w-10 h-10 rounded-full bg-savr-100 dark:bg-savr-800 items-center justify-center">
          <Ionicons name="search" size={22} color={colors.primary} />
        </View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Name, @username, or city"
          placeholderTextColor={colors.placeholder}
          className={`flex-1 text-base py-2 ${ui.text.primary}`}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Find friends search"
          testID="friends-search-input"
        />
        {value ? (
          <Pressable onPress={() => onChangeText("")} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={22} color={colors.iconMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
