import {
  buildGoogleCalendarUrl,
  formatPlanDate,
  formatPlanWhen,
  isValidIsoDate,
  nextCalendarDayStamp,
  plannedAtFromIsoDate,
  plannedAtFromLocalDateTime,
  planVisitPresets,
  toCalendarDayStamp,
} from "@/lib/plan-visit";

describe("plan-visit", () => {
  it("builds presets with ISO dates", () => {
    const presets = planVisitPresets(new Date("2026-07-23T15:00:00"));
    expect(presets.map((p) => p.id)).toEqual(["tonight", "tomorrow"]);
    expect(presets[0]?.date).toBe("2026-07-23");
    expect(presets[1]?.date).toBe("2026-07-24");
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

  it("builds a timed Google Calendar URL when time is set", () => {
    const url = buildGoogleCalendarUrl({
      title: "Dinner at Nori House",
      dateIso: "2026-07-26",
      timeHhmm: "19:00",
    });
    expect(url).toContain("dates=20260726T190000%2F20260726T210000");
  });

  it("combines local date and time for plannedAt", () => {
    const iso = plannedAtFromLocalDateTime("2026-07-26", "19:00");
    const d = new Date(iso);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(26);
    expect(d.getHours()).toBe(19);
    expect(d.getMinutes()).toBe(0);
  });

  it("formats plan when with date and time", () => {
    const label = formatPlanWhen("2026-07-26", "19:00");
    expect(label).toMatch(/Jul/);
    expect(label).toMatch(/26/);
  });

  it("formats planned dates for display", () => {
    expect(formatPlanDate("2026-07-26T12:00:00.000Z")).toMatch(/Jul/);
    expect(formatPlanDate(null)).toBeNull();
  });
});
