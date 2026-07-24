import { searchRestaurantsByText, resolvePlaceDetails } from "@/lib/places/google";
import { isYelpPlaceId, yelpPlaceId } from "@/lib/places/yelp-map";
import type { Coordinates } from "@/lib/places/types";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { parseGoogleMapsUrl } from "./providers/google-maps-url";
import type {
  RestaurantCandidate,
  RestaurantResolutionResult,
  SourcePlatform,
} from "./types";

const HIGH_CONFIDENCE = 0.85;
const MULTI_GAP = 0.12;

type MetadataResponse = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  canonicalUrl?: string | null;
  expandedUrl?: string | null;
  restaurantName?: string | null;
  address?: string | null;
  error?: string;
};

function extractNameFromText(text: string | null | undefined): string | undefined {
  if (!text?.trim()) return undefined;
  // Prefer quoted names or lines that look like restaurant titles
  const quoted = text.match(/"([^"]{3,80})"/);
  if (quoted?.[1]) return quoted[1].trim();
  const atName = text.match(/@([A-Za-z0-9_.]{3,40})/);
  if (atName?.[1] && !/instagram|tiktok|youtube/i.test(atName[1])) return atName[1];
  const firstLine = text.split(/\n/)[0]?.trim();
  if (firstLine && firstLine.length >= 3 && firstLine.length <= 80 && !firstLine.startsWith("http")) {
    return firstLine.replace(/[#|].*$/, "").trim();
  }
  return undefined;
}

function extractLocationHint(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  const inCity = text.match(/\bin\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
  if (inCity?.[1]) return inCity[1];
  return undefined;
}

function parseYelpBusinessId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("yelp.")) return null;
    const m = u.pathname.match(/\/biz\/([^/?#]+)/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

async function fetchShareMetadata(url: string): Promise<MetadataResponse | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.functions.invoke<MetadataResponse>("share-resolve", {
      body: { action: "fetchMetadata", url },
    });
    if (error) return null;
    return data ?? null;
  } catch {
    return null;
  }
}

function rankCandidates(
  candidates: RestaurantCandidate[],
  coords?: Coordinates | null,
): RestaurantCandidate[] {
  return [...candidates]
    .map((c) => {
      let score = c.confidence;
      if (coords && c.latitude != null && c.longitude != null) {
        const dLat = c.latitude - coords.latitude;
        const dLng = c.longitude - coords.longitude;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        if (dist < 0.05) score += 0.05;
        else if (dist < 0.2) score += 0.02;
      }
      return { ...c, confidence: Math.min(1, score) };
    })
    .sort((a, b) => b.confidence - a.confidence);
}

function toResult(
  ranked: RestaurantCandidate[],
  extras: Partial<RestaurantResolutionResult> = {},
): RestaurantResolutionResult {
  if (ranked.length === 0) {
    return {
      status: "unresolved",
      confidence: 0,
      candidates: [],
      ...extras,
    };
  }
  const top = ranked[0];
  const second = ranked[1];
  if (
    ranked.length === 1 &&
    top.confidence >= HIGH_CONFIDENCE
  ) {
    return {
      status: "resolved",
      confidence: top.confidence,
      candidates: ranked.slice(0, 5),
      ...extras,
    };
  }
  if (
    top.confidence >= HIGH_CONFIDENCE &&
    (!second || top.confidence - second.confidence >= MULTI_GAP)
  ) {
    return {
      status: "resolved",
      confidence: top.confidence,
      candidates: ranked.slice(0, 5),
      ...extras,
    };
  }
  if (ranked.length > 1) {
    return {
      status: "multiple",
      confidence: top.confidence,
      candidates: ranked.slice(0, 8),
      ...extras,
    };
  }
  return {
    status: "unresolved",
    confidence: top.confidence,
    candidates: ranked.slice(0, 5),
    ...extras,
  };
}

export async function resolveRestaurantFromShare(opts: {
  originalUrl: string | null;
  canonicalUrl: string | null;
  rawText: string | null;
  sourcePlatform: SourcePlatform;
  coords?: Coordinates | null;
}): Promise<RestaurantResolutionResult> {
  const url = opts.canonicalUrl ?? opts.originalUrl;
  const candidates: RestaurantCandidate[] = [];
  let extractedName = extractNameFromText(opts.rawText);
  let extractedLocation = extractLocationHint(opts.rawText);
  let sourceTitle: string | null = null;
  let sourceThumbnailUrl: string | null = null;

  // 1. Direct Google Maps
  if (url && (opts.sourcePlatform === "google_maps" || parseGoogleMapsUrl(url))) {
    const hints = parseGoogleMapsUrl(url);
    if (hints?.name) extractedName = hints.name;
    if (hints?.query && !extractedName) extractedName = hints.query;

    if (hints?.placeId && !hints.placeId.startsWith("0x")) {
      try {
        const resolved = await resolvePlaceDetails(hints.placeId);
        if (resolved) {
          candidates.push({
            googlePlaceId: resolved.placeId,
            name: resolved.name,
            address: resolved.address,
            city: resolved.city,
            cuisine: "American",
            latitude: resolved.latitude,
            longitude: resolved.longitude,
            photoUrl: resolved.imageUrl,
            provider: "google",
            confidence: 0.95,
            confidenceReason: "Google Maps place id",
          });
        }
      } catch {
        // fall through
      }
    }

    if (hints?.name || hints?.query) {
      const q = [hints.name ?? hints.query, extractedLocation].filter(Boolean).join(" ");
      try {
        const places = await searchRestaurantsByText(q, opts.coords ?? undefined);
        for (const p of places.slice(0, 5)) {
          candidates.push({
            googlePlaceId: p.googlePlaceId,
            name: p.name,
            address: p.address,
            city: p.city,
            cuisine: p.cuisine,
            latitude: p.latitude,
            longitude: p.longitude,
            photoUrl: p.imageUrl,
            provider: "google",
            confidence: 0.88,
            confidenceReason: "Google Maps search",
          });
        }
      } catch {
        // ignore
      }
    }
  }

  // 1b. Yelp direct
  if (url && opts.sourcePlatform === "yelp") {
    const biz = parseYelpBusinessId(url);
    if (biz) {
      const placeId = yelpPlaceId(biz);
      if (isYelpPlaceId(placeId)) {
        candidates.push({
          googlePlaceId: placeId,
          yelpBusinessId: biz,
          name: extractedName ?? biz.replace(/-/g, " "),
          address: "",
          city: extractedLocation ?? "",
          cuisine: "American",
          latitude: null,
          longitude: null,
          photoUrl: null,
          provider: "yelp",
          confidence: 0.9,
          confidenceReason: "Yelp business URL",
        });
      }
      try {
        const places = await searchRestaurantsByText(
          [extractedName ?? biz.replace(/-/g, " "), extractedLocation].filter(Boolean).join(" "),
          opts.coords ?? undefined,
        );
        for (const p of places.slice(0, 5)) {
          candidates.push({
            googlePlaceId: p.googlePlaceId,
            name: p.name,
            address: p.address,
            city: p.city,
            cuisine: p.cuisine,
            latitude: p.latitude,
            longitude: p.longitude,
            photoUrl: p.imageUrl,
            provider: "google",
            confidence: 0.8,
            confidenceReason: "Yelp URL → Places search",
          });
        }
      } catch {
        // ignore
      }
    }
  }

  // 3. Server metadata
  if (url) {
    const meta = await fetchShareMetadata(url);
    if (meta) {
      sourceTitle = meta.title ?? null;
      sourceThumbnailUrl = meta.image ?? null;
      if (meta.restaurantName) extractedName = meta.restaurantName;
      if (meta.address && !extractedLocation) extractedLocation = meta.address;
    }
  }

  // 4. Places text search from caption / title
  const searchQuery = [extractedName ?? sourceTitle, extractedLocation]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (searchQuery.length >= 2 && candidates.length < 3) {
    try {
      const places = await searchRestaurantsByText(searchQuery, opts.coords ?? undefined);
      for (const p of places.slice(0, 6)) {
        if (candidates.some((c) => c.googlePlaceId === p.googlePlaceId)) continue;
        candidates.push({
          googlePlaceId: p.googlePlaceId,
          name: p.name,
          address: p.address,
          city: p.city,
          cuisine: p.cuisine,
          latitude: p.latitude,
          longitude: p.longitude,
          photoUrl: p.imageUrl,
          provider: "google",
          confidence: extractedName ? 0.72 : 0.55,
          confidenceReason: "Places text search",
        });
      }
    } catch {
      // ignore
    }
  }

  const ranked = rankCandidates(candidates, opts.coords);
  return toResult(ranked, {
    extractedName,
    extractedLocation,
    sourceTitle,
    sourceThumbnailUrl,
  });
}
