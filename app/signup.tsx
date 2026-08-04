import { useState } from "react";
import { Text, ScrollView, KeyboardAvoidingView, Platform, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { hapticSuccess } from "@/lib/haptics";
import { APP_NAME } from "@/constants/branding";
import { ui } from "@/constants/ui";

/** Must match is_username_available() in migration 011. */
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function Signup() {
  const signup = useAppStore((s) => s.signup);
  const resendConfirmation = useAppStore((s) => s.resendConfirmation);
  const [form, setForm] = useState({ email: "", password: "", username: "", displayName: "", city: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = (): string | null => {
    if (!form.displayName.trim()) return "Add a display name.";
    const username = form.username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(username)) {
      return "Usernames are 3-20 characters: lowercase letters, numbers, underscores.";
    }
    if (!form.email.includes("@")) return "Enter a valid email address.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    return null;
  };

  const handleSignup = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setLoading(true);
    setError("");
    const result = await signup({ ...form, username: form.username.trim().toLowerCase() });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    hapticSuccess();
    // No session yet — the account exists but is unconfirmed. Sending the user
    // into the taste quiz here would fail every RLS-protected write.
    if (result.needsConfirmation) {
      setPendingEmail(result.email ?? form.email.trim().toLowerCase());
      return;
    }
    router.replace("/taste-quiz");
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setLoading(true);
    const result = await resendConfirmation(pendingEmail);
    setLoading(false);
    if (result.ok) setResent(true);
    else setError(result.error);
  };

  if (pendingEmail) {
    return (
      <SafeAreaView className="flex-1 bg-savr-50 dark:bg-savr-950">
        <ScrollView contentContainerClassName="px-6 py-8 gap-4">
          <View className="items-center">
            <Logo size="md" showName />
          </View>
          <Text className="text-3xl font-bold text-savr-900 dark:text-savr-100 mt-2">Check your email</Text>
          <Text className={ui.text.secondary}>
            We sent a confirmation link to {pendingEmail}. Tap it on this device to finish setting up your account.
          </Text>
          {resent ? (
            <Text className="text-savr-600 dark:text-savr-300 text-sm">New link sent.</Text>
          ) : (
            <Button label="Resend email" variant="secondary" onPress={handleResend} loading={loading} />
          )}
          {error ? <Text className="text-red-500 text-sm">{error}</Text> : null}
          <Button label="Back to login" variant="ghost" onPress={() => router.replace("/login")} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-savr-50 dark:bg-savr-950">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-6 py-8 gap-4" keyboardShouldPersistTaps="handled">
          <View className="items-center">
            <Logo size="md" showName showTagline />
          </View>
          <Text className="text-3xl font-bold text-savr-900 dark:text-savr-100 mt-2">Create account</Text>
          <Text className="text-savr-350 dark:text-savr-400">Start building your personal taste map.</Text>

          <Input label="Display Name" value={form.displayName} onChangeText={(v) => set("displayName", v)} placeholder="Alex Rivera" />
          <Input label="Username" value={form.username} onChangeText={(v) => set("username", v)} autoCapitalize="none" placeholder="alextastes" />
          <Input label="Email" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" value={form.password} onChangeText={(v) => set("password", v)} secureTextEntry />
          <Input label="City" value={form.city} onChangeText={(v) => set("city", v)} placeholder="Los Angeles" />
          {error ? <Text className="text-red-500 text-sm">{error}</Text> : null}
          <Button label="Create Account" onPress={handleSignup} loading={loading} />
          <Text className={`text-xs text-center leading-5 ${ui.text.muted}`}>
            By creating an account, you agree to {APP_NAME}&apos;s{" "}
            <Text className="text-savr-700 dark:text-savr-300 underline" onPress={() => router.push("/terms")}>Terms</Text>
            {" "}and{" "}
            <Text className="text-savr-700 dark:text-savr-300 underline" onPress={() => router.push("/privacy")}>Privacy Policy</Text>.
          </Text>
          <Button label="Log in instead" variant="ghost" onPress={() => router.push("/login")} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
