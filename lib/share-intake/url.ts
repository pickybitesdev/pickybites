import type { SourcePlatform } from "./types";

const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"')\]]+/gi;

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "si",
  "feature",
  "ref",
  "ref_src",
]);

const UNSAFE_SCHEMES = new Set(["javascript", "file", "data", "blob", "vbscript"]);

export function extractUrls(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const matches = text.match(URL_IN_TEXT_RE) ?? [];
  const cleaned = matches.map((u) => u.replace(/[),.]+$/, ""));
  return [...new Set(cleaned)];
}

export function assertSafeHttpsUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error("INVALID_URL");
  }
  const scheme = parsed.protocol.replace(":", "").toLowerCase();
  if (UNSAFE_SCHEMES.has(scheme)) throw new Error("UNSAFE_SCHEME");
  if (scheme !== "https") throw new Error("HTTPS_REQUIRED");
  if (!parsed.hostname) throw new Error("INVALID_URL");
  return parsed.toString();
}

export function pickPrimaryUrl(urls: string[]): string | null {
  for (const raw of urls) {
    try {
      return assertSafeHttpsUrl(raw);
    } catch {
      // try next
    }
  }
  return null;
}

export function detectSourcePlatform(hostnameOrUrl: string | null | undefined): SourcePlatform {
  if (!hostnameOrUrl) return "unknown";
  let host = hostnameOrUrl.toLowerCase();
  try {
    if (host.includes("://")) host = new URL(host).hostname.toLowerCase();
  } catch {
    // keep as-is
  }
  host = host.replace(/^www\./, "");

  if (host.includes("instagram.com") || host === "instagr.am") return "instagram";
  if (host.includes("tiktok.com") || host === "vm.tiktok.com") return "tiktok";
  if (
    host.includes("youtube.com") ||
    host === "youtu.be" ||
    host.includes("youtube-nocookie.com")
  ) {
    return "youtube";
  }
  if (host.includes("facebook.com") || host === "fb.watch" || host === "fb.com") return "facebook";
  if (
    host.includes("google.com") &&
    (hostnameOrUrl.includes("/maps") || hostnameOrUrl.includes("maps.google"))
  ) {
    return "google_maps";
  }
  if (host === "maps.google.com" || host === "maps.app.goo.gl" || host === "goo.gl") {
    if (host === "maps.app.goo.gl" || host === "maps.google.com") return "google_maps";
  }
  if (host.includes("yelp.com") || host.includes("yelp.ca")) return "yelp";
  if (host.endsWith(".restaurant") || host.includes("opentable.com") || host.includes("resy.com")) {
    return "restaurant_website";
  }
  return "web";
}

export function canonicalizeUrl(raw: string): string {
  const safe = assertSafeHttpsUrl(raw);
  const url = new URL(safe);
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  const keys = [...url.searchParams.keys()];
  for (const key of keys) {
    if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith("utm_")) {
      url.searchParams.delete(key);
    }
  }
  // Stable ordering of remaining params
  const remaining = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  url.search = "";
  for (const [k, v] of remaining) url.searchParams.append(k, v);

  let path = url.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  url.pathname = path || "/";

  return url.toString();
}

export function domainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Build a stable id for deduping pending shares / intents. */
export function shareContentId(canonicalUrl: string | null, rawText: string | null, receivedAt: string): string {
  const day = receivedAt.slice(0, 10);
  const key = `${canonicalUrl ?? ""}|${(rawText ?? "").slice(0, 120)}|${day}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return `share-${hash.toString(16)}-${day.replace(/-/g, "")}`;
}

export function normalizeIncomingShare(input: {
  rawText?: string | null;
  url?: string | null;
  receivedAt?: string;
  id?: string;
}): {
  id: string;
  rawText: string | null;
  originalUrl: string | null;
  canonicalUrl: string | null;
  sourcePlatform: SourcePlatform;
  receivedAt: string;
} {
  const receivedAt = input.receivedAt ?? new Date().toISOString();
  const rawText = input.rawText?.trim() || null;
  const fromText = extractUrls(rawText);
  const candidates = [
    ...(input.url ? [input.url] : []),
    ...fromText,
  ];
  const originalUrl = pickPrimaryUrl(candidates);
  let canonicalUrl: string | null = null;
  if (originalUrl) {
    try {
      canonicalUrl = canonicalizeUrl(originalUrl);
    } catch {
      canonicalUrl = originalUrl;
    }
  }
  const sourcePlatform = detectSourcePlatform(canonicalUrl ?? originalUrl);
  const id = input.id ?? shareContentId(canonicalUrl, rawText, receivedAt);
  return { id, rawText, originalUrl, canonicalUrl, sourcePlatform, receivedAt };
}
