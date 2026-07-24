import { router, type Href } from "expo-router";
import type { User } from "@/lib/types";
import { AUTHENTICATED_HOME } from "@/lib/tabs";

type BackNavigation = {
  canGoBack: () => boolean;
  goBack: () => void;
};

type AuthRoute = "/taste-quiz" | typeof AUTHENTICATED_HOME;

export type EntryRoute = "/onboarding" | "/login" | "/taste-quiz" | typeof AUTHENTICATED_HOME;

export function routeAfterAuth(user: User | null | undefined): AuthRoute {
  if (user && !user.hasCompletedTasteQuiz) return "/taste-quiz";
  return AUTHENTICATED_HOME;
}

/** Safe post-login resume (share import, deep links). Rejects open redirects. */
export function resolveAuthReturnTo(
  returnTo: string | string[] | undefined,
  pendingId?: string | string[] | undefined,
): Href | null {
  const path = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  const allowed = ["/share-import", "/(tabs)/discover", "/(tabs)/bites", "/(tabs)/profile", "/friends"];
  if (!allowed.some((a) => path === a || path.startsWith(`${a}?`))) {
    if (path !== "/share-import") return null;
  }
  if (path.startsWith("/share-import")) {
    const id = Array.isArray(pendingId) ? pendingId[0] : pendingId;
    if (id) {
      return { pathname: "/share-import", params: { pendingId: id } } as const;
    }
  }
  return path as Href;
}

/** Cold-start / index redirect after onboarding + auth state is known. */
export function resolveEntryRoute(
  hasSeenOnboarding: boolean,
  isAuthenticated: boolean,
  hasCompletedTasteQuiz: boolean,
): EntryRoute {
  if (!hasSeenOnboarding) return "/onboarding";
  if (!isAuthenticated) return "/login";
  if (!hasCompletedTasteQuiz) return "/taste-quiz";
  return AUTHENTICATED_HOME;
}

/** Pop the stack, or navigate to a sensible fallback when there is no history. */
export function goBackOr(
  fallback: Href = "/(tabs)/profile",
  navigation?: BackNavigation,
) {
  if (navigation?.canGoBack()) {
    navigation.goBack();
    return;
  }
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}

export function userProfileHref(userId: string, from?: string) {
  return from
    ? ({ pathname: "/user/[id]", params: { id: userId, from } } as const)
    : ({ pathname: "/user/[id]", params: { id: userId } } as const);
}

export function userProfileFallback(from?: string): Href {
  if (from === "friends") return "/friends";
  return "/(tabs)/profile";
}
