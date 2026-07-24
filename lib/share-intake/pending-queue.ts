import AsyncStorage from "@react-native-async-storage/async-storage";
import type { IncomingShareStatus, PendingShareRecord } from "./types";
import { normalizeIncomingShare } from "./url";

const STORAGE_KEY = "@pickybites/pending-shares";
const ACTIVE_KEY = "@pickybites/active-pending-share-id";
const PROCESSED_KEY = "@pickybites/processed-share-ids";

async function readAll(): Promise<PendingShareRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingShareRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(records: PendingShareRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function listPendingShares(): Promise<PendingShareRecord[]> {
  const all = await readAll();
  return all.filter((r) => r.status === "pending" || r.status === "processing");
}

export async function getPendingShare(id: string): Promise<PendingShareRecord | null> {
  const all = await readAll();
  return all.find((r) => r.id === id) ?? null;
}

export async function upsertPendingShare(input: {
  rawText?: string | null;
  url?: string | null;
  receivedAt?: string;
  id?: string;
  androidIntentHash?: string | null;
}): Promise<PendingShareRecord> {
  const normalized = normalizeIncomingShare(input);
  const all = await readAll();

  // Merge duplicate pending by canonical URL
  const existing = all.find(
    (r) =>
      (r.status === "pending" || r.status === "processing") &&
      normalized.canonicalUrl &&
      r.canonicalUrl === normalized.canonicalUrl,
  );

  if (existing) {
    const updated: PendingShareRecord = {
      ...existing,
      rawText: normalized.rawText ?? existing.rawText,
      originalUrl: normalized.originalUrl ?? existing.originalUrl,
      receivedAt: normalized.receivedAt,
      androidIntentHash: input.androidIntentHash ?? existing.androidIntentHash,
    };
    await writeAll(all.map((r) => (r.id === existing.id ? updated : r)));
    return updated;
  }

  const record: PendingShareRecord = {
    ...normalized,
    status: "pending",
    consumedAt: null,
    resumeToken: null,
    androidIntentHash: input.androidIntentHash ?? null,
  };
  await writeAll([record, ...all]);
  return record;
}

export async function setShareStatus(
  id: string,
  status: IncomingShareStatus,
): Promise<PendingShareRecord | null> {
  const all = await readAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const next: PendingShareRecord = {
    ...all[idx],
    status,
    consumedAt:
      status === "confirmed" || status === "cancelled"
        ? new Date().toISOString()
        : all[idx].consumedAt,
  };
  all[idx] = next;
  await writeAll(all);
  if (status === "confirmed" || status === "cancelled") {
    await markShareProcessed(id);
  }
  return next;
}

export async function markShareConsumed(
  id: string,
  status: "confirmed" | "cancelled" | "failed" = "confirmed",
): Promise<void> {
  await setShareStatus(id, status);
}

export async function setActivePendingShareId(id: string | null): Promise<void> {
  if (!id) await AsyncStorage.removeItem(ACTIVE_KEY);
  else await AsyncStorage.setItem(ACTIVE_KEY, id);
}

export async function getActivePendingShareId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_KEY);
}

async function markShareProcessed(id: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PROCESSED_KEY);
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(id)) {
      const next = [id, ...list].slice(0, 100);
      await AsyncStorage.setItem(PROCESSED_KEY, JSON.stringify(next));
    }
  } catch {
    // ignore
  }
}

export async function wasShareProcessed(id: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PROCESSED_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw) as string[];
    return Array.isArray(list) && list.includes(id);
  } catch {
    return false;
  }
}

/** True when we should skip re-handling an Android intent / share. */
export async function shouldSkipShare(id: string): Promise<boolean> {
  if (await wasShareProcessed(id)) return true;
  const record = await getPendingShare(id);
  if (!record) return false;
  return record.status === "confirmed" || record.status === "cancelled";
}
