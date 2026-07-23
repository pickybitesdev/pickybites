import {
  PLACES_SIGN_IN_REQUIRED_MESSAGE,
  PLACES_UNAVAILABLE_MESSAGE,
  placesMessageLeaksConfig,
} from "@/lib/discover-view";

describe("places-messaging", () => {
  it("exports safe production unavailable copy", () => {
    expect(PLACES_UNAVAILABLE_MESSAGE).not.toMatch(/EXPO_PUBLIC_/);
    expect(PLACES_UNAVAILABLE_MESSAGE).not.toMatch(/\.env/);
    expect(PLACES_UNAVAILABLE_MESSAGE).not.toMatch(/API[_ ]?KEY/i);
    expect(placesMessageLeaksConfig(PLACES_UNAVAILABLE_MESSAGE)).toBe(false);
    expect(placesMessageLeaksConfig(PLACES_SIGN_IN_REQUIRED_MESSAGE)).toBe(false);
  });
});
