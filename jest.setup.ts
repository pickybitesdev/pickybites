import "@testing-library/react-native/matchers";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@/lib/haptics", () => ({
  hapticLight: jest.fn(),
  hapticMedium: jest.fn(),
  hapticSuccess: jest.fn(),
  hapticSelection: jest.fn(),
}));

jest.mock("@/lib/location", () => {
  const actual = jest.requireActual<typeof import("@/lib/location")>("@/lib/location");
  return {
    ...actual,
    getCurrentCoordinates: jest.fn(async () => null),
    distanceMeters: jest.fn(() => 0),
  };
});
