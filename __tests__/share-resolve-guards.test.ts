/**
 * Client-side mirrors of share-resolve safety rules (scheme / host checks).
 * Full SSRF suite runs against the Edge Function in Deno / staging.
 */
import { assertSafeHttpsUrl, detectSourcePlatform, pickPrimaryUrl } from "@/lib/share-intake/url";

describe("share-resolve client guards", () => {
  it("blocks unsafe schemes before any network call", () => {
    expect(() => assertSafeHttpsUrl("javascript:alert(1)")).toThrow();
    expect(() => assertSafeHttpsUrl("data:text/html,hi")).toThrow();
    expect(() => assertSafeHttpsUrl("file:///etc/passwd")).toThrow();
    expect(() => assertSafeHttpsUrl("http://example.com")).toThrow("HTTPS_REQUIRED");
  });

  it("ignores unsafe urls when picking primary", () => {
    expect(pickPrimaryUrl(["javascript:x", "https://maps.google.com/?q=Nori"])).toContain(
      "maps.google.com",
    );
  });

  it("classifies social hosts for analytics sanitization", () => {
    expect(detectSourcePlatform("https://www.instagram.com/p/x")).toBe("instagram");
    expect(detectSourcePlatform("https://vm.tiktok.com/x")).toBe("tiktok");
  });
});
