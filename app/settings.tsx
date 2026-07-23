import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { useThemeStore, type ThemeMode } from "@/store/useThemeStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { shareInvite } from "@/lib/share";
import { APP_NAME } from "@/constants/branding";
import { ui } from "@/constants/ui";
import { cn } from "@/lib/utils";
import { useThemedColors } from "@/lib/useThemedColors";
import { hapticSelection } from "@/lib/haptics";

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: "light", label: "Light", icon: "sunny-outline" },
  { mode: "dark", label: "Dark", icon: "moon-outline" },
  { mode: "system", label: "System", icon: "phone-portrait-outline" },
];

export default function SettingsScreen() {
  const logout = useAppStore((s) => s.logout);
  const user = useAppStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const { mode, setMode } = useThemeStore();
  const colors = useThemedColors();

  const handleLogout = () => {
    Alert.alert("Log out?", "You'll need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-savr-50 dark:bg-savr-950" contentContainerClassName="px-4 pb-6 gap-4">
      <Card className="gap-2">
        <Text className="font-semibold text-savr-900 dark:text-savr-100">Account</Text>
        <Text className="text-sm text-savr-350 dark:text-savr-300">{user?.email}</Text>
        <Text className="text-xs text-savr-400 dark:text-savr-500">Avatar upload available when Supabase Storage is configured.</Text>
      </Card>

      <Card className="gap-3">
        <Text className="font-semibold text-savr-900 dark:text-savr-100">Appearance</Text>
        <View className="flex-row gap-2">
          {THEME_OPTIONS.map((opt) => (
            <Pressable
              key={opt.mode}
              onPress={() => { hapticSelection(); setMode(opt.mode); }}
              className={`flex-1 items-center py-3 rounded-xl border ${
                mode === opt.mode
                  ? "bg-savr-100 dark:bg-savr-800 border-savr-500 dark:border-savr-500"
                  : cn(ui.surface.inset, ui.border.subtle, "border")
              }`}
            >
              <Ionicons name={opt.icon} size={22} color={mode === opt.mode ? colors.brand : colors.iconMuted} />
              <Text className={`text-xs font-medium mt-1 ${mode === opt.mode ? "text-savr-500 dark:text-savr-100" : ui.text.muted}`}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card className="gap-2">
        <Text className="font-semibold text-savr-900 dark:text-savr-100">Legal</Text>
        <Pressable onPress={() => router.push("/privacy")} className="py-2">
          <Text className="text-savr-500 dark:text-savr-300">Privacy Policy</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/terms")} className="py-2">
          <Text className="text-savr-500 dark:text-savr-300">Terms of Service</Text>
        </Pressable>
      </Card>

      <Button label={`Invite Friends to ${APP_NAME}`} variant="secondary" onPress={() => shareInvite(user?.displayName)} />
      <Button label="Edit Profile" variant="secondary" onPress={() => router.push("/edit-profile")} />
      <Button label="Log Out" variant="danger" onPress={handleLogout} />
    </ScrollView>
  );
}

