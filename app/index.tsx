import { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { brandColors } from "@/constants/branding";
import { useAppStore } from "@/store/useAppStore";
import { resolveEntryRoute } from "@/lib/navigation";
import {
  getActivePendingShareId,
  listPendingShares,
} from "@/lib/share-intake/pending-queue";

export default function Index() {
  const router = useRouter();
  const pathname = usePathname();
  const isOnEntryScreen = pathname === "/" || pathname === "/index";
  const isInitializing = useAppStore((s) => s.isInitializing);
  const isDataLoaded = useAppStore((s) => s.isDataLoaded);
  const hasSeenOnboarding = useAppStore((s) => s.hasSeenOnboarding);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const hasCompletedTasteQuiz = useAppStore(
    (s) => s.users.find((u) => u.id === s.currentUserId)?.hasCompletedTasteQuiz ?? false,
  );
  const lastRoute = useRef<string | null>(null);

  useEffect(() => {
    if (isInitializing || !isOnEntryScreen) return;
    // Wait for profile data before deciding taste quiz vs home (avoids false "quiz incomplete").
    if (isAuthenticated && !isDataLoaded) return;

    void (async () => {
      const activeId = await getActivePendingShareId();
      const pending = activeId ?? (await listPendingShares())[0]?.id;
      if (pending && isAuthenticated) {
        const target = `/share-import?pendingId=${pending}`;
        if (lastRoute.current === target) return;
        lastRoute.current = target;
        router.replace({ pathname: "/share-import", params: { pendingId: pending } });
        return;
      }

      const target = resolveEntryRoute(hasSeenOnboarding, isAuthenticated, hasCompletedTasteQuiz);
      if (lastRoute.current === target) return;
      lastRoute.current = target;
      router.replace(target);
    })();
  }, [
    isInitializing,
    isOnEntryScreen,
    isDataLoaded,
    hasSeenOnboarding,
    isAuthenticated,
    hasCompletedTasteQuiz,
    router,
  ]);

  return (
    <View className="flex-1 items-center justify-center bg-savr-50 dark:bg-savr-950">
      <ActivityIndicator size="large" color={brandColors.primary} />
    </View>
  );
}
