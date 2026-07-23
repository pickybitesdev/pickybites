jest.mock("@/lib/location", () => jest.requireActual("@/lib/location"));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

import * as Location from "expo-location";
import { getCurrentCoordinates } from "@/lib/location";

describe("discover location handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when location permission is denied", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });

    const coords = await getCurrentCoordinates();
    expect(coords).toBeNull();
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it("returns coordinates when permission is granted", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 34.05, longitude: -118.25 },
    });

    const coords = await getCurrentCoordinates();
    expect(coords).toEqual({ latitude: 34.05, longitude: -118.25 });
  });
});
