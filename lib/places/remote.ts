import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { PlaceResult, Coordinates } from "./types";
import type { PlaceSuggestion, ResolvedSearchPlace } from "./autocomplete";

type PlacesResponse = {
  places?: PlaceResult[];
  suggestions?: PlaceSuggestion[];
  resolved?: ResolvedSearchPlace | null;
  resolvedPlaces?: ResolvedSearchPlace[];
  photos?: string[];
  openNow?: boolean | null;
  error?: string;
};

async function parseFunctionError(error: unknown, data: PlacesResponse | null): Promise<string> {
  if (data?.error) return data.error;

  if (error && typeof error === "object" && "context" in error) {
    try {
      const ctx = (error as { context: Response }).context;
      const body = await ctx.json() as PlacesResponse;
      if (body?.error) return body.error;
    } catch {
      // ignore parse failure
    }
  }

  if (error instanceof Error) return error.message;
  return "Places search failed. Try signing out and back in.";
}

async function invokePlaces(body: Record<string, unknown>): Promise<PlacesResponse> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Sign in required to search restaurants.");
  }

  const { data, error } = await supabase.functions.invoke<PlacesResponse>("places", { body });
  if (error) {
    throw new Error(await parseFunctionError(error, data));
  }
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

export function usesServerPlaces(): boolean {
  return isSupabaseConfigured();
}

/** True when there is a live Supabase auth session (Edge Functions can be invoked). */
export async function hasPlacesAuthSession(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { data: { session } } = await supabase.auth.getSession();
  return Boolean(session?.access_token);
}

export async function searchNearbyRemote(coords: Coordinates, radiusMeters: number): Promise<PlaceResult[]> {
  const data = await invokePlaces({
    action: "nearby",
    latitude: coords.latitude,
    longitude: coords.longitude,
    radiusMeters,
  });
  return data.places ?? [];
}

export async function searchTextRemote(
  query: string,
  coords?: Coordinates,
  radiusMeters?: number,
): Promise<PlaceResult[]> {
  const data = await invokePlaces({
    action: "search",
    query,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    radiusMeters,
  });
  return data.places ?? [];
}

export async function fetchDetailsRemote(googlePlaceId: string): Promise<{ photos: string[]; openNow: boolean | null }> {
  const data = await invokePlaces({ action: "details", googlePlaceId });
  return { photos: data.photos ?? [], openNow: data.openNow ?? null };
}

export async function autocompleteRemote(
  query: string,
  opts?: {
    coords?: Coordinates | null;
    sessionToken?: string;
    radiusMeters?: number;
  },
): Promise<PlaceSuggestion[]> {
  const data = await invokePlaces({
    action: "autocomplete",
    query,
    sessionToken: opts?.sessionToken,
    latitude: opts?.coords?.latitude,
    longitude: opts?.coords?.longitude,
    radiusMeters: opts?.radiusMeters,
  });
  return data.suggestions ?? [];
}

export async function resolvePlaceRemote(
  googlePlaceId: string,
  sessionToken?: string,
): Promise<ResolvedSearchPlace | null> {
  const data = await invokePlaces({
    action: "resolve",
    googlePlaceId,
    sessionToken,
  });
  return data.resolved ?? null;
}

export async function searchPlacesRemote(
  query: string,
  coords?: Coordinates,
  radiusMeters?: number,
): Promise<ResolvedSearchPlace[]> {
  const data = await invokePlaces({
    action: "searchPlaces",
    query,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    radiusMeters,
  });
  return data.resolvedPlaces ?? [];
}

