import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const YELP_BASE = "https://api.yelp.com/v3";
const YELP_RADIUS_MAX = 40000;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  action: "match" | "details" | "search";
  name?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  yelpId?: string;
  radiusMeters?: number;
  term?: string;
  limit?: number;
};

type YelpCategory = { alias?: string; title?: string };

type YelpBusiness = {
  id?: string;
  name?: string;
  rating?: number;
  review_count?: number;
  url?: string;
  image_url?: string;
  price?: string;
  is_closed?: boolean;
  categories?: YelpCategory[];
  coordinates?: { latitude?: number; longitude?: number };
  location?: {
    address1?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    display_address?: string[];
  };
};

const CUISINES = [
  "Italian", "Japanese", "Mexican", "Thai", "Indian", "French", "American",
  "Korean", "Chinese", "Mediterranean", "Vietnamese", "Caribbean", "Spanish", "Greek",
] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function mapEnrichment(b: YelpBusiness | null | undefined) {
  if (!b?.id) return null;
  return {
    yelpId: b.id,
    rating: typeof b.rating === "number" ? b.rating : null,
    reviewCount: typeof b.review_count === "number" ? b.review_count : null,
    url: b.url ?? null,
    imageUrl: b.image_url ?? null,
    name: b.name ?? null,
  };
}

function priceLevelFromYelp(price?: string) {
  if (!price) return { level: 2, known: false };
  const n = price.length;
  if (n <= 1) return { level: 1, known: true };
  if (n === 2) return { level: 2, known: true };
  if (n === 3) return { level: 3, known: true };
  return { level: 4, known: true };
}

function cuisineFromCategories(categories?: YelpCategory[]) {
  const titles = (categories ?? []).map((c) => (c.title ?? c.alias ?? "").toLowerCase());
  for (const cuisine of CUISINES) {
    if (titles.some((t) => t.includes(cuisine.toLowerCase()))) return cuisine;
  }
  return "American";
}

function formatAddress(b: YelpBusiness) {
  const display = b.location?.display_address?.filter(Boolean);
  if (display?.length) return display.join(", ");
  return [b.location?.address1, b.location?.city, b.location?.state].filter(Boolean).join(", ");
}

function mapPlace(b: YelpBusiness) {
  if (!b.id || !b.name) return null;
  const lat = b.coordinates?.latitude;
  const lng = b.coordinates?.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const { level, known } = priceLevelFromYelp(b.price);
  const enrichment = mapEnrichment(b);
  return {
    googlePlaceId: `yelp:${b.id}`,
    name: b.name,
    address: formatAddress(b),
    city: b.location?.city ?? "",
    cuisine: cuisineFromCategories(b.categories),
    priceLevel: level,
    priceLevelKnown: known,
    imageUrl: b.image_url ?? null,
    latitude: lat,
    longitude: lng,
    openNow: typeof b.is_closed === "boolean" ? !b.is_closed : null,
    yelpId: b.id,
    yelpRating: enrichment?.rating ?? null,
    yelpReviewCount: enrichment?.reviewCount ?? null,
    yelpUrl: enrichment?.url ?? null,
  };
}

async function yelpGet(path: string, apiKey: string, query?: Record<string, string>) {
  const url = new URL(`${YELP_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v) url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Yelp error ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const apiKey = Deno.env.get("YELP_API_KEY")?.trim();
  if (!apiKey) {
    return json({ error: "YELP_API_KEY secret is not set on Supabase." }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Missing authorization header." }, 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return json({ error: "Sign in required to search restaurants." }, 401);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  try {
    if (body.action === "search") {
      if (body.latitude == null || body.longitude == null) {
        return json({ error: "latitude and longitude are required." }, 400);
      }
      const lat = Number(body.latitude);
      const lng = Number(body.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return json({ error: "Invalid coordinates." }, 400);
      }
      const radius = Math.min(
        Math.max(Math.round(Number(body.radiusMeters) || 1500), 100),
        YELP_RADIUS_MAX,
      );
      const limit = Math.min(Math.max(Math.round(Number(body.limit) || 20), 1), 50);
      const term = (body.term ?? "restaurants").trim().slice(0, 64) || "restaurants";

      const searchData = await yelpGet("/businesses/search", apiKey, {
        term,
        latitude: String(lat),
        longitude: String(lng),
        radius: String(radius),
        limit: String(limit),
        categories: "restaurants,food",
        sort_by: "best_match",
      });

      const businesses = (searchData.businesses as YelpBusiness[] | undefined) ?? [];
      const places = businesses.map(mapPlace).filter(Boolean);
      return json({ places, businesses });
    }

    if (body.action === "match") {
      if (!body.name || body.latitude == null || body.longitude == null) {
        return json({ error: "name, latitude, and longitude are required." }, 400);
      }
      const lat = Number(body.latitude);
      const lng = Number(body.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return json({ error: "Invalid coordinates." }, 400);
      }

      let business: YelpBusiness | null = null;
      try {
        const matchQuery: Record<string, string> = {
          name: body.name.slice(0, 64),
          latitude: String(lat),
          longitude: String(lng),
          limit: "1",
        };
        if (body.address) matchQuery.address1 = body.address.slice(0, 64);
        if (body.city) matchQuery.city = body.city.slice(0, 64);

        const matchData = await yelpGet("/businesses/matches", apiKey, matchQuery);
        const first = (matchData.businesses as YelpBusiness[] | undefined)?.[0];
        if (first?.id) {
          const details = await yelpGet(`/businesses/${encodeURIComponent(first.id)}`, apiKey);
          business = details as YelpBusiness;
        }
      } catch {
        // fall through to search
      }

      if (!business) {
        const searchData = await yelpGet("/businesses/search", apiKey, {
          term: body.name.slice(0, 64),
          latitude: String(lat),
          longitude: String(lng),
          limit: "1",
          categories: "restaurants,food",
        });
        business = (searchData.businesses as YelpBusiness[] | undefined)?.[0] ?? null;
      }

      const enrichment = mapEnrichment(business);
      if (!enrichment) return json({ enrichment: null });
      return json({ enrichment });
    }

    if (body.action === "details") {
      if (!body.yelpId) return json({ error: "yelpId is required." }, 400);
      const id = body.yelpId.startsWith("yelp:") ? body.yelpId.slice(5) : body.yelpId;
      const details = await yelpGet(`/businesses/${encodeURIComponent(id)}`, apiKey);
      const enrichment = mapEnrichment(details as YelpBusiness);
      const place = mapPlace(details as YelpBusiness);
      if (!enrichment) return json({ enrichment: null, place: null });
      return json({ enrichment, place });
    }

    return json({ error: "Unknown action. Use search, match, or details." }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Yelp request failed." }, 500);
  }
});
