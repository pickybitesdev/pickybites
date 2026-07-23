import {
  getPlacesSearchStatus,
  hasLocalPlacesApiKey,
  isGooglePlacesConfigured,
  isPlacesSearchReady,
} from "@/lib/places/google";
import { isSupabaseConfigured } from "@/lib/supabase/client";

jest.mock("@/lib/supabase/client", () => ({
  isSupabaseConfigured: jest.fn(() => false),
  getSupabase: jest.fn(() => null),
}));

const mockSupabaseConfigured = isSupabaseConfigured as jest.Mock;

describe("places search readiness", () => {
  const originalKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  afterEach(() => {
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY = originalKey;
    mockSupabaseConfigured.mockReturnValue(false);
  });

  it("treats placeholder local keys as missing", () => {
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY = "your-google-places-key";
    expect(hasLocalPlacesApiKey()).toBe(false);
  });

  it("reports ready in demo mode without Supabase", () => {
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY = "";
    mockSupabaseConfigured.mockReturnValue(false);
    expect(getPlacesSearchStatus({ isAuthenticated: false, useRemotePlaces: false })).toBe("ready");
    expect(isPlacesSearchReady({ isAuthenticated: false, useRemotePlaces: false })).toBe(true);
  });

  it("requires sign-in when remote Yelp/Supabase is used", () => {
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY = "";
    mockSupabaseConfigured.mockReturnValue(true);
    expect(isGooglePlacesConfigured()).toBe(true);
    expect(getPlacesSearchStatus({ isAuthenticated: false, useRemotePlaces: true })).toBe("sign_in");
    expect(getPlacesSearchStatus({ isAuthenticated: true, useRemotePlaces: true })).toBe("ready");
    expect(isPlacesSearchReady({ isAuthenticated: false, useRemotePlaces: true })).toBe(false);
  });

  it("uses demo pins when useRemotePlaces is false even if Supabase URL is set", () => {
    mockSupabaseConfigured.mockReturnValue(true);
    expect(getPlacesSearchStatus({ isAuthenticated: true, useRemotePlaces: false })).toBe("ready");
  });
});
