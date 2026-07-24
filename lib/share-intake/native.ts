import type { ShareIntent } from "expo-share-intent";
import type { PendingShareRecord } from "./types";
import { upsertPendingShare } from "./pending-queue";
import { shouldSkipShare } from "./pending-queue";

/** Map expo-share-intent payload into our pending-share queue. */
export async function ingestNativeShareIntent(
  shareIntent: ShareIntent | null | undefined,
): Promise<PendingShareRecord | null> {
  if (!shareIntent) return null;

  const text = shareIntent.text?.trim() || null;
  const webUrl = shareIntent.webUrl?.trim() || null;
  if (!text && !webUrl) return null;

  const record = await upsertPendingShare({
    rawText: text,
    url: webUrl,
    receivedAt: new Date().toISOString(),
  });

  if (await shouldSkipShare(record.id)) return null;
  return record;
}
