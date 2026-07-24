import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FriendsTab } from "@/components/profile/FriendsTab";
import { ui } from "@/constants/ui";

/** Standalone friends screen — same experience as Profile → Friends tab. */
export default function FriendsScreen() {
  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["bottom"]}>
      <ScrollView contentContainerClassName="px-4 pb-8 gap-4" keyboardShouldPersistTaps="handled">
        <View className="pt-2 gap-1">
          <Text className={`text-2xl font-bold ${ui.text.primary}`}>Friends</Text>
          <Text className={`text-sm ${ui.text.muted}`}>
            Search above to find people, or browse taste matches below
          </Text>
        </View>
        <FriendsTab from="friends" />
      </ScrollView>
    </SafeAreaView>
  );
}
