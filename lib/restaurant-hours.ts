import { formatVisitTimeLabel, isValidVisitTime, type VisitTimeHhmm } from "@/lib/plan-visit";

export type HoursPoint = { day: number; hour: number; minute: number };

export type OpeningPeriod = {
  open: HoursPoint;
  close?: HoursPoint;
};

export type VisitTimeSlot = { label: string; value: VisitTimeHhmm };

/** Minutes between plan-a-visit time options. */
export const VISIT_TIME_SLOT_MINUTES = 30;

/** When Google hours are missing — typical lunch–dinner window. */
const FALLBACK_OPEN_MIN = 11 * 60;
const FALLBACK_CLOSE_MIN = 22 * 60;

function localTodayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(isoDate: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function hhmmFromDayMinutes(totalMin: number): VisitTimeHhmm {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function roundUpToSlot(minutes: number): number {
  return Math.ceil(minutes / VISIT_TIME_SLOT_MINUTES) * VISIT_TIME_SLOT_MINUTES;
}

function isFutureVisitSlot(dateIso: string, timeHhmm: string, now: Date): boolean {
  const parts = parseLocalDate(dateIso);
  const tm = /^(\d{1,2}):(\d{2})$/.exec(timeHhmm.trim());
  if (!parts || !tm) return false;
  const h = Number(tm[1]);
  const min = Number(tm[2]);
  const slotAt = new Date(parts.year, parts.month - 1, parts.day, h, min, 0, 0);
  return slotAt.getTime() >= now.getTime();
}

function pointMinutes(p: HoursPoint): number {
  return p.hour * 60 + p.minute;
}

/** Google Places periods → normalized list (empty = closed; null input = unknown). */
export function normalizeOpeningPeriods(
  raw: { open?: HoursPoint; close?: HoursPoint }[] | null | undefined,
): OpeningPeriod[] | null {
  if (raw == null) return null;
  const periods: OpeningPeriod[] = [];
  for (const p of raw) {
    if (!p.open || typeof p.open.day !== "number") continue;
    periods.push({
      open: {
        day: p.open.day,
        hour: p.open.hour ?? 0,
        minute: p.open.minute ?? 0,
      },
      close: p.close
        ? {
            day: p.close.day,
            hour: p.close.hour ?? 0,
            minute: p.close.minute ?? 0,
          }
        : undefined,
    });
  }
  return periods;
}

/** 24/7 when Google omits close and open is Sun 00:00. */
function isAlwaysOpen(periods: OpeningPeriod[]): boolean {
  return periods.some(
    (p) =>
      !p.close &&
      p.open.day === 0 &&
      p.open.hour === 0 &&
      p.open.minute === 0,
  );
}

function isOpenAtDayMinute(visitDay: number, visitMin: number, period: OpeningPeriod): boolean {
  if (!period.close) return true;

  const oDay = period.open.day;
  const oMin = pointMinutes(period.open);
  const cDay = period.close.day;
  const cMin = pointMinutes(period.close);

  if (oDay === cDay) {
    return visitDay === oDay && visitMin >= oMin && visitMin < cMin;
  }

  if (visitDay === oDay && visitMin >= oMin) return true;
  if (visitDay === cDay && visitMin < cMin) return true;

  if (oDay < cDay && visitDay > oDay && visitDay < cDay) return true;
  if (oDay > cDay && (visitDay > oDay || visitDay < cDay)) return true;

  return false;
}

/** Whether the restaurant is open at a local date + HH:mm. */
export function isRestaurantOpenAt(
  dateIso: string,
  timeHhmm: string,
  periods: OpeningPeriod[] | null,
): boolean {
  if (periods === null) return true;
  if (periods.length === 0) return false;
  if (isAlwaysOpen(periods)) return true;

  const parts = parseLocalDate(dateIso);
  const tm = /^(\d{1,2}):(\d{2})$/.exec(timeHhmm.trim());
  if (!parts || !tm) return false;

  const visitDay = new Date(parts.year, parts.month - 1, parts.day).getDay();
  const visitMin = Number(tm[1]) * 60 + Number(tm[2]);

  return periods.some((p) => isOpenAtDayMinute(visitDay, visitMin, p));
}

function slotAllowedWithoutHours(dateIso: string, dayMinute: number, now: Date): boolean {
  const isToday = dateIso === localTodayIso(now);
  if (isToday) {
    const start = roundUpToSlot(now.getHours() * 60 + now.getMinutes());
    return dayMinute >= start && dayMinute < FALLBACK_CLOSE_MIN;
  }
  return dayMinute >= FALLBACK_OPEN_MIN && dayMinute < FALLBACK_CLOSE_MIN;
}

function slotRangeStart(dateIso: string, periods: OpeningPeriod[] | null, now: Date): number {
  const isToday = dateIso === localTodayIso(now);
  if (isToday) {
    return roundUpToSlot(now.getHours() * 60 + now.getMinutes());
  }
  if (periods === null) return FALLBACK_OPEN_MIN;
  if (periods.length === 0) return 24 * 60;
  if (isAlwaysOpen(periods)) return 0;
  return 0;
}

/** Times every 30 min from now (today) or open → close for the chosen date. */
export function visitTimesOpenOnDate(
  dateIso: string,
  periods: OpeningPeriod[] | null,
  now = new Date(),
): VisitTimeSlot[] {
  if (!parseLocalDate(dateIso)) return [];

  const startMin = slotRangeStart(dateIso, periods, now);
  const slots: VisitTimeSlot[] = [];

  for (let min = startMin; min < 24 * 60; min += VISIT_TIME_SLOT_MINUTES) {
    const hhmm = hhmmFromDayMinutes(min);
    if (!isValidVisitTime(hhmm)) continue;

    if (periods === null) {
      if (!slotAllowedWithoutHours(dateIso, min, now)) continue;
    } else if (!isRestaurantOpenAt(dateIso, hhmm, periods)) {
      continue;
    }

    if (!isFutureVisitSlot(dateIso, hhmm, now)) continue;

    slots.push({
      value: hhmm,
      label: formatVisitTimeLabel(hhmm),
    });
  }

  return slots;
}

/** True when at least one plan-a-visit time is available on this date. */
export function isVisitDateOpen(
  dateIso: string,
  periods: OpeningPeriod[] | null,
  now = new Date(),
): boolean {
  return visitTimesOpenOnDate(dateIso, periods, now).length > 0;
}

export function pickDefaultVisitTime(
  dateIso: string,
  periods: OpeningPeriod[] | null,
  preferred?: VisitTimeHhmm,
  now = new Date(),
): VisitTimeHhmm | null {
  const open = visitTimesOpenOnDate(dateIso, periods, now);
  if (open.length === 0) return null;
  if (preferred && open.some((s) => s.value === preferred)) return preferred;
  return open[0]?.value ?? null;
}

/** Snap stored plannedAt to nearest listed slot, or raw local HH:mm. */
export function visitTimeFromPlannedAt(
  iso: string | null | undefined,
  dateIso: string,
  periods: OpeningPeriod[] | null,
  now = new Date(),
): VisitTimeHhmm | null {
  if (!iso) return pickDefaultVisitTime(dateIso, periods, undefined, now);
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return pickDefaultVisitTime(dateIso, periods, undefined, now);
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const hhmm = `${h}:${min}`;
  const slots = visitTimesOpenOnDate(dateIso, periods, now);
  const exact = slots.find((s) => s.value === hhmm);
  if (exact) return exact.value;
  const rounded = hhmmFromDayMinutes(roundUpToSlot(d.getHours() * 60 + d.getMinutes()));
  if (slots.some((s) => s.value === rounded)) return rounded;
  return pickDefaultVisitTime(dateIso, periods, undefined, now);
}
