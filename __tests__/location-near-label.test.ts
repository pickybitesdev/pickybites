jest.mock("@/lib/location", () => jest.requireActual("@/lib/location"));

import { formatNearLocationLabel } from "@/lib/location";

describe("formatNearLocationLabel", () => {
  it("formats city and short region as Near City, ST", () => {
    expect(formatNearLocationLabel({ city: "Houston", region: "TX" })).toBe("Near Houston, TX");
  });

  it("formats neighborhood and city", () => {
    expect(
      formatNearLocationLabel({ district: "Memorial", city: "Houston", region: "TX" }),
    ).toBe("Near Memorial, Houston");
  });

  it("falls back to city only", () => {
    expect(formatNearLocationLabel({ city: "Austin" })).toBe("Near Austin");
  });

  it("returns null when fields are empty", () => {
    expect(formatNearLocationLabel(null)).toBeNull();
    expect(formatNearLocationLabel({})).toBeNull();
    expect(formatNearLocationLabel({ city: "  " })).toBeNull();
  });

  it("uses subregion when city is missing", () => {
    expect(formatNearLocationLabel({ subregion: "Harris County", region: "Texas" })).toBe(
      "Near Harris County, Texas",
    );
  });
});
