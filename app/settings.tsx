import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { router } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { shareInvite } from "@/lib/share";
import { APP_NAME } from "@/constants/branding";
import { useThemedColors } from "@/lib/useThemedColors";

export default function SettingsScreen() {
  const logout = useAppStore((s) => s.logout);
  const deleteAccount = useAppStore((s) => s.deleteAccount);
  const user = useAppStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const colors = useThemedColors();

  const handleLogout = () => {
    Alert.alert("Log out?", "You'll need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  };

  // Required by App Store Review Guideline 5.1.1(v) and Play's data-deletion
  // policy. Two confirmations because it is irreversible.
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "This permanently deletes your account, reviews, photos, lists, and saved spots. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Are you sure?", "This is permanent. There is no way to recover your data.", [
              { text: "Keep my account", style: "cancel" },
              {
                text: "Delete forever",
                style: "destructive",
                onPress: async () => {
                  const result = await deleteAccount();
                  if (!result.ok) {
                    Alert.alert("Couldn't delete account", result.error);
                    return;
                  }
                  router.replace("/login");
                },
              },
            ]);
          },
        },
      ],
    );
  };

  return (
    <ScrollView className="flex-1 bg-savr-50 dark:bg-savr-950" contentContainerClassName="px-4 pb-6 gap-4">
      <Card className="gap-2">
        <Text className="font-semibold text-savr-900 dark:text-savr-100">Account</Text>
        <Text className="text-sm text-savr-350 dark:text-savr-300">{user?.email}</Text>
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

      <Card className="gap-2">
        <Text className="font-semibold text-savr-900 dark:text-savr-100">Danger zone</Text>
        <Text className="text-sm text-savr-350 dark:text-savr-300">
          Permanently delete your account and everything in it.
        </Text>
        <Pressable onPress={handleDeleteAccount} className="py-3" testID="delete-account">
          <Text className="font-semibold" style={{ color: colors.danger }}>Delete Account</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

