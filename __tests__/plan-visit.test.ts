import {
  buildGoogleCalendarUrl,
  formatPlanDate,
  isValidIsoDate,
  nextCalendarDayStamp,
  plannedAtFromIsoDate,
  planVisitPresets,
  toCalendarDayStamp,
} from "@/lib/plan-visit";

describe("plan-visit", () => {
  it("builds presets with ISO dates", () => {
    const presets = planVisitPresets(new Date("2026-07-23T15:00:00"));
    expect(presets.map((p) => p.id)).toEqual(["tonight", "tomorrow", "weekend", "next_week"]);
    expect(presets[0]?.date).toBe("2026-07-23");
    expect(presets[1]?.date).toBe("2026-07-24");
    expect(presets[2]?.date).toBe("2026-07-25"); // Saturday
    expect(presets[3]?.date).toBe("2026-07-30");
  });

  it("validates and stores plannedAt from local date", () => {
    expect(isValidIsoDate("2026-07-26")).toBe(true);
    expect(isValidIsoDate("07/26/2026")).toBe(false);
    expect(plannedAtFromIsoDate("2026-07-26")).toBe("2026-07-26T12:00:00.000Z");
  });

  it("builds an all-day Google Calendar URL", () => {
    expect(toCalendarDayStamp("2026-07-26")).toBe("20260726");
    expect(nextCalendarDayStamp("20260726")).toBe("20260727");
    const url = buildGoogleCalendarUrl({
      title: "Dinner at Nori House",
      dateIso: "2026-07-26",
      location: "Los Angeles",
    });
    expect(url).toContain("calendar.google.com");
    expect(url).toContain("dates=20260726%2F20260727");
    expect(url).toContain("Dinner");
  });

  it("formats planned dates for display", () => {
    expect(formatPlanDate("2026-07-26T12:00:00.000Z")).toMatch(/Jul/);
    expect(formatPlanDate(null)).toBeNull();
  });
});
