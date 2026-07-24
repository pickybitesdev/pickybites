import { Platform } from "react-native";
import {
  buildPlannedVisitShareMessage,
  buildRestaurantDirectionsUrl,
  DIRECTIONS_UNAVAILABLE_MESSAGE,
  hasValidCoordinates,
  restaurantDeepLink,
} from "@/lib/share";

describe("share directions helpers", () => {
  it("validates coordinates", () => {
    expect(hasValidCoordinates(29.76, -95.37)).toBe(true);
    expect(hasValidCoordinates(null, -95.37)).toBe(false);
    expect(hasValidCoordinates(91, 0)).toBe(false);
    expect(hasValidCoordinates(NaN, 0)).toBe(false);
  });

  it("builds maps URL from coordinates", () => {
    const url = buildRestaurantDirectionsUrl({
      name: "Coral Kitchen",
      latitude: 29.76,
      longitude: -95.37,
    });
    expect(url).toBeTruthy();
    if (Platform.OS === "ios") {
      expect(url).toContain("maps:0,0?q=");
      expect(url).toContain("@29.76,-95.37");
      expect(url).toContain(encodeURIComponent("Coral Kitchen"));
    } else if (Platform.OS === "android") {
      expect(url).toContain("geo:29.76,-95.37");
    } else {
      expect(url).toContain("google.com/maps");
      expect(url).toContain("29.76");
    }
  });

  it("falls back to address query when coords missing", () => {
    const url = buildRestaurantDirectionsUrl({
      name: "Coral Kitchen",
      address: "123 Main St, Houston",
    });
    expect(url).toBeTruthy();
    expect(url).toContain(encodeURIComponent("Coral Kitchen, 123 Main St, Houston"));
  });

  it("returns null when nothing usable", () => {
    expect(buildRestaurantDirectionsUrl({})).toBeNull();
    expect(buildRestaurantDirectionsUrl({ name: "   " })).toBeNull();
  });

  it("exports unavailable copy", () => {
    expect(DIRECTIONS_UNAVAILABLE_MESSAGE).toBe(
      "Directions are unavailable for this restaurant.",
    );
  });

  it("builds restaurant deep links without leaking secrets", () => {
    expect(restaurantDeepLink("rest-1")).toBe("pickybites://restaurant/rest-1");
    expect(restaurantDeepLink("rest-1")).not.toMatch(/api[_-]?key/i);
  });

  it("builds planned visit share copy with deep link when restaurant id exists", () => {
    const { message, title, url } = buildPlannedVisitShareMessage({
      placeName: "Nori House",
      dateIso: "2026-07-26",
      timeHhmm: "19:00",
      cuisine: "Japanese",
      city: "Los Angeles",
      address: "123 Main St",
      restaurantId: "rest-nori",
    });
    expect(title).toBe("Plan: Nori House");
    expect(message).toContain("Nori House (Japanese)");
    expect(message).toContain("Los Angeles");
    expect(message).toMatch(/7:00|19:00|PM/i);
    expect(message).toContain("pickybites://restaurant/rest-nori");
    expect(url).toBe("pickybites://restaurant/rest-nori");
  });
});
