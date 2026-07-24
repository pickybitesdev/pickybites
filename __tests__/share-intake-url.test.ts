import {
  assertSafeHttpsUrl,
  canonicalizeUrl,
  detectSourcePlatform,
  extractUrls,
  normalizeIncomingShare,
  pickPrimaryUrl,
  shareContentId,
} from "@/lib/share-intake/url";
import { parseGoogleMapsUrl } from "@/lib/share-intake/providers/google-maps-url";

describe("share-intake url utils", () => {
  it("extracts urls from plain text", () => {
    expect(extractUrls("Check https://www.instagram.com/reel/abc123/ wow")).toEqual([
      "https://www.instagram.com/reel/abc123/",
    ]);
    expect(extractUrls("no links here")).toEqual([]);
  });

  it("picks the first safe https url", () => {
    expect(
      pickPrimaryUrl(["javascript:alert(1)", "https://yelp.com/biz/nori"]),
    ).toBe("https://yelp.com/biz/nori");
  });

  it("rejects unsafe schemes", () => {
    expect(() => assertSafeHttpsUrl("javascript:alert(1)")).toThrow("UNSAFE_SCHEME");
    expect(() => assertSafeHttpsUrl("file:///tmp/x")).toThrow("UNSAFE_SCHEME");
    expect(() => assertSafeHttpsUrl("http://example.com")).toThrow("HTTPS_REQUIRED");
  });

  it("detects source platforms", () => {
    expect(detectSourcePlatform("https://www.instagram.com/reel/x")).toBe("instagram");
    expect(detectSourcePlatform("https://www.tiktok.com/@x/video/1")).toBe("tiktok");
    expect(detectSourcePlatform("https://youtu.be/abc")).toBe("youtube");
    expect(detectSourcePlatform("https://www.yelp.com/biz/nori")).toBe("yelp");
    expect(detectSourcePlatform("https://maps.google.com/?q=Nori")).toBe("google_maps");
    expect(detectSourcePlatform("https://example.com/menu")).toBe("web");
  });

  it("canonicalizes and strips tracking params", () => {
    const out = canonicalizeUrl(
      "https://www.Instagram.com/reel/abc/?utm_source=ig&fbclid=123&igshid=x#frag",
    );
    expect(out).toBe("https://www.instagram.com/reel/abc");
    expect(out).not.toMatch(/utm_|fbclid|igshid|#/);
  });

  it("builds stable share ids for duplicate detection", () => {
    const a = shareContentId("https://yelp.com/biz/a", null, "2026-07-23T12:00:00.000Z");
    const b = shareContentId("https://yelp.com/biz/a", null, "2026-07-23T18:00:00.000Z");
    expect(a).toBe(b);
  });

  it("normalizes incoming share from text", () => {
    const n = normalizeIncomingShare({
      rawText: "Try this https://www.tiktok.com/@food/video/99",
      receivedAt: "2026-07-23T12:00:00.000Z",
    });
    expect(n.sourcePlatform).toBe("tiktok");
    expect(n.originalUrl).toContain("tiktok.com");
    expect(n.canonicalUrl).toBeTruthy();
    expect(n.id).toMatch(/^share-/);
  });

  it("parses Google Maps place hints", () => {
    const hints = parseGoogleMapsUrl(
      "https://www.google.com/maps/place/Nori+House/@29.76,-95.37,17z",
    );
    expect(hints?.name).toMatch(/Nori/i);
    expect(hints?.latitude).toBeCloseTo(29.76);
    expect(hints?.longitude).toBeCloseTo(-95.37);
  });
});
