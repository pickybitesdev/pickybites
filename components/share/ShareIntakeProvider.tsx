import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { router, usePathname } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { ingestNativeShareIntent } from "@/lib/share-intake/native";
import { listPendingShares, setActivePendingShareId } from "@/lib/share-intake/pending-queue";
import { track } from "@/lib/analytics";

/**
 * Watches native share intents + pending queue.
 * Must render under expo-share-intent's ShareIntentProvider.
 * Routes to /share-import without auto-saving.
 */
export function ShareIntakeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const handlingRef = useRef(false);
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  const openPending = async (pendingId: string) => {
    if (handlingRef.current) return;
    if (pathname?.includes("share-import")) return;
    handlingRef.current = true;
    try {
      await setActivePendingShareId(pendingId);
      track("share_target_opened");
      router.push({ pathname: "/share-import", params: { pendingId } });
    } finally {
      setTimeout(() => {
        handlingRef.current = false;
      }, 800);
    }
  };

  useEffect(() => {
    if (!hasShareIntent) return;
    void (async () => {
      const record = await ingestNativeShareIntent(shareIntent);
      resetShareIntent(true);
      if (record) await openPending(record.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShareIntent, shareIntent]);

  useEffect(() => {
    const checkQueue = async () => {
      const pending = await listPendingShares();
      const first = pending[0];
      if (first && !pathname?.includes("share-import") && !pathname?.includes("login")) {
        await openPending(first.id);
      }
    };
    void checkQueue();

    const onChange = (state: AppStateStatus) => {
      if (state === "active") void checkQueue();
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <>{children}</>;
}
