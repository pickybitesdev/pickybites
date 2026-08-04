import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { hapticSuccess } from "@/lib/haptics";
import { resolveAuthReturnTo } from "@/lib/navigation";

export default function Login() {
  const params = useLocalSearchParams<{ returnTo?: string; pendingId?: string }>();
  const login = useAppStore((s) => s.login);
  const resendConfirmation = useAppStore((s) => s.resendConfirmation);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const goHome = (userId: string) => {
    const resume = resolveAuthReturnTo(params.returnTo, params.pendingId);
    if (resume) {
      router.replace(resume);
      return;
    }
    const user = useAppStore.getState().users.find((u) => u.id === userId);
    if (user && !user.hasCompletedTasteQuiz) router.replace("/taste-quiz");
    else router.replace("/(tabs)/discover");
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setNeedsConfirmation(false);
    setResent(false);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      if (result.error === "UNCONFIRMED_EMAIL") setNeedsConfirmation(true);
      else setError(result.error);
      return;
    }
    hapticSuccess();
    const uid = useAppStore.getState().currentUserId;
    if (uid) goHome(uid);
    else router.replace("/(tabs)/discover");
  };

  const handleResend = async () => {
    setLoading(true);
    const result = await resendConfirmation(email);
    setLoading(false);
    if (result.ok) setResent(true);
    else setError(result.error);
  };

  return (
    <SafeAreaView className="flex-1 bg-savr-50 dark:bg-savr-950">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="px-6 py-8 gap-4" keyboardShouldPersistTaps="handled">
          <View className="items-center mb-4 mt-4">
            <Logo size="lg" showName showTagline />
            <Text className="text-3xl font-bold text-savr-900 dark:text-savr-100 mt-3">Welcome back</Text>
            <Text className="text-savr-350 dark:text-savr-400 text-center mt-1">Log in to continue your taste journey.</Text>
          </View>

          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
          <Button label="Forgot password?" variant="ghost" onPress={() => router.push("/forgot-password")} className="min-h-[40px] py-2" />

          {needsConfirmation ? (
            <View className="bg-savr-100 dark:bg-savr-800 rounded-xl p-4 gap-2">
              <Text className="text-savr-800 dark:text-savr-200">
                Confirm your email before logging in. Check your inbox for the link we sent to {email.trim().toLowerCase()}.
              </Text>
              {resent ? (
                <Text className="text-savr-600 dark:text-savr-300 text-sm">New link sent.</Text>
              ) : (
                <Button label="Resend confirmation email" variant="secondary" onPress={handleResend} loading={loading} />
              )}
            </View>
          ) : null}

          {error ? <Text className="text-red-500 text-sm">{error}</Text> : null}
          <Button label="Log In" onPress={handleLogin} loading={loading} />
          <Button label="Create account" variant="ghost" onPress={() => router.push("/signup")} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
