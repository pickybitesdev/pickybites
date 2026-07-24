import { View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { ShareImportScreen } from "@/components/share/ShareImportScreen";
import { ui } from "@/constants/ui";
import { brandColors } from "@/constants/branding";

export default function ShareImportRoute() {
  const params = useLocalSearchParams<{ pendingId?: string }>();
  const pendingId = Array.isArray(params.pendingId) ? params.pendingId[0] : params.pendingId;

  if (!pendingId) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${ui.screen}`}>
        <ActivityIndicator color={brandColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${ui.screen}`} edges={["bottom"]}>
      <View className="flex-1">
        <ShareImportScreen pendingId={pendingId} />
      </View>
    </SafeAreaView>
  );
}
