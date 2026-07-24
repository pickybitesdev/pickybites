import {
  isRestaurantOpenAt,
  isVisitDateOpen,
  normalizeOpeningPeriods,
  visitTimesOpenOnDate,
  type OpeningPeriod,
} from "@/lib/restaurant-hours";

describe("restaurant-hours", () => {
  const weekdayLunchDinner: OpeningPeriod[] = [
    {
      open: { day: 1, hour: 11, minute: 0 },
      close: { day: 1, hour: 22, minute: 0 },
    },
    {
      open: { day: 2, hour: 11, minute: 0 },
      close: { day: 2, hour: 22, minute: 0 },
    },
    {
      open: { day: 3, hour: 11, minute: 0 },
      close: { day: 3, hour: 22, minute: 0 },
    },
    {
      open: { day: 4, hour: 11, minute: 0 },
      close: { day: 4, hour: 22, minute: 0 },
    },
    {
      open: { day: 5, hour: 11, minute: 0 },
      close: { day: 5, hour: 22, minute: 0 },
    },
    {
      open: { day: 6, hour: 11, minute: 0 },
      close: { day: 6, hour: 22, minute: 0 },
    },
  ];

  it("normalizes API periods", () => {
    expect(normalizeOpeningPeriods(null)).toBeNull();
    expect(normalizeOpeningPeriods([])).toEqual([]);
    expect(
      normalizeOpeningPeriods([{ open: { day: 0, hour: 18, minute: 0 }, close: { day: 0, hour: 21, minute: 0 } }]),
    ).toHaveLength(1);
  });

  it("lists 30-min slots from noon until close on a weekday", () => {
    const noon = new Date(2026, 6, 23, 12, 0, 0);
    const open = visitTimesOpenOnDate("2026-07-23", weekdayLunchDinner, noon);
    expect(open[0]?.value).toBe("12:00");
    expect(open[open.length - 1]?.value).toBe("21:30");
    expect(open.length).toBe(20);
    expect(isRestaurantOpenAt("2026-07-23", "20:00", weekdayLunchDinner)).toBe(true);
  });

  it("returns no slots when closed all day", () => {
    expect(visitTimesOpenOnDate("2026-07-23", [], new Date(2026, 6, 23, 12, 0, 0))).toEqual([]);
  });

  it("uses fallback window when hours are unknown at noon", () => {
    const noon = new Date(2026, 6, 23, 12, 0, 0);
    const open = visitTimesOpenOnDate("2026-07-23", null, noon);
    expect(open[0]?.value).toBe("12:00");
    expect(open[open.length - 1]?.value).toBe("21:30");
  });

  it("drops past slots tonight after 9:30 PM", () => {
    const now = new Date(2026, 6, 23, 21, 34, 0);
    const open = visitTimesOpenOnDate("2026-07-23", weekdayLunchDinner, now);
    expect(open).toEqual([]);
    expect(isVisitDateOpen("2026-07-23", weekdayLunchDinner, now)).toBe(false);
  });

  it("marks tonight closed when past last slot", () => {
    const now = new Date(2026, 6, 23, 22, 5, 0);
    expect(visitTimesOpenOnDate("2026-07-23", weekdayLunchDinner, now)).toEqual([]);
    expect(isVisitDateOpen("2026-07-23", weekdayLunchDinner, now)).toBe(false);
  });
});
