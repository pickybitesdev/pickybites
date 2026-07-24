const mockStore = new Map<string, string>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  removeItem: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));

import {
  getPendingShare,
  listPendingShares,
  markShareConsumed,
  setShareStatus,
  shouldSkipShare,
  upsertPendingShare,
} from "@/lib/share-intake/pending-queue";

describe("share-intake pending queue", () => {
  beforeEach(() => {
    mockStore.clear();
  });

  it("upserts pending shares and merges by canonical url", async () => {
    const a = await upsertPendingShare({
      url: "https://www.yelp.com/biz/nori?utm_source=x",
      receivedAt: "2026-07-23T10:00:00.000Z",
    });
    const b = await upsertPendingShare({
      url: "https://www.yelp.com/biz/nori",
      rawText: "extra caption",
      receivedAt: "2026-07-23T11:00:00.000Z",
    });
    expect(a.id).toBe(b.id);
    expect(b.rawText).toContain("extra");
    const pending = await listPendingShares();
    expect(pending).toHaveLength(1);
  });

  it("consume-once: confirmed shares are skipped", async () => {
    const rec = await upsertPendingShare({
      url: "https://www.instagram.com/reel/abc",
    });
    expect(await shouldSkipShare(rec.id)).toBe(false);
    await markShareConsumed(rec.id, "confirmed");
    expect(await shouldSkipShare(rec.id)).toBe(true);
    const still = await getPendingShare(rec.id);
    expect(still?.status).toBe("confirmed");
    expect(still?.consumedAt).toBeTruthy();
  });

  it("transitions pending → processing → cancelled", async () => {
    const rec = await upsertPendingShare({ url: "https://youtu.be/xyz" });
    await setShareStatus(rec.id, "processing");
    const mid = await getPendingShare(rec.id);
    expect(mid?.status).toBe("processing");
    await markShareConsumed(rec.id, "cancelled");
    expect(await shouldSkipShare(rec.id)).toBe(true);
  });
});
