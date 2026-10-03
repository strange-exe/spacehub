import { addDays, daysBetween, isIsoDate, type IsoDate } from "@/lib/dates";

/** First APOD ever published. */
export const APOD_EPOCH: IsoDate = "1995-06-16";

// APOD rolls over at midnight US Eastern. Letting Intl apply the IANA zone rules handles
// EDT (UTC-4) vs EST (UTC-5) automatically; a hard-coded offset is wrong half the year.
const EASTERN = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The most recent date NASA has published an APOD for (the calendar date in US Eastern). */
export function latestApodDate(now: Date = new Date()): IsoDate {
  // formatToParts rather than format(): locale output order/separators aren't guaranteed.
  const parts = Object.fromEntries(EASTERN.formatToParts(now).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Plate number = 1-based index of the day in the APOD archive. */
export function plateNumber(date: IsoDate): number {
  return daysBetween(APOD_EPOCH, date) + 1;
}

export type DateCheck =
  | { kind: "ok"; date: IsoDate }
  | { kind: "invalid" }
  | { kind: "too-early"; date: IsoDate }
  | { kind: "future"; date: IsoDate };

export function checkApodDate(value: string | undefined, latest: IsoDate = latestApodDate()): DateCheck {
  if (!isIsoDate(value)) return { kind: "invalid" };
  if (value < APOD_EPOCH) return { kind: "too-early", date: APOD_EPOCH };
  if (value > latest) return { kind: "future", date: latest };
  return { kind: "ok", date: value };
}

export function randomApodDate(latest: IsoDate = latestApodDate(), rand: () => number = Math.random): IsoDate {
  return addDays(APOD_EPOCH, Math.floor(rand() * (daysBetween(APOD_EPOCH, latest) + 1)));
}
