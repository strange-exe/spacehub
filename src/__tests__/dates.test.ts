import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isIsoDate } from "@/lib/dates";
import { APOD_EPOCH, checkApodDate, latestApodDate, plateNumber, randomApodDate } from "@/features/apod/lib/apodDates";

describe("date helpers", () => {
  it("validates real calendar dates only", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2023-02-29")).toBe(false);
    expect(isIsoDate("2024-2-1")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });
  it("adds days across month/year and DST boundaries", () => {
    expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
    expect(addDays("2025-03-09", 1)).toBe("2025-03-10"); // US DST start
    expect(daysBetween("2025-03-08", "2025-03-10")).toBe(2);
  });
});

describe("APOD dates", () => {
  it("numbers plates from the first APOD", () => {
    expect(plateNumber(APOD_EPOCH)).toBe(1);
    expect(plateNumber("1995-06-17")).toBe(2);
  });
  it("classifies requested dates", () => {
    const latest = "2026-10-02";
    expect(checkApodDate("2020-01-01", latest)).toEqual({ kind: "ok", date: "2020-01-01" });
    expect(checkApodDate("1990-01-01", latest)).toEqual({ kind: "too-early", date: APOD_EPOCH });
    expect(checkApodDate("2026-10-03", latest)).toEqual({ kind: "future", date: latest });
    expect(checkApodDate("banana", latest)).toEqual({ kind: "invalid" });
  });
  it("random dates stay inside the archive", () => {
    expect(randomApodDate("2026-10-02", () => 0)).toBe(APOD_EPOCH);
    expect(randomApodDate("2026-10-02", () => 0.999999)).toBe("2026-10-02");
  });
});

// Spec for the human-implemented function: APOD rolls over at midnight US Eastern time.
describe("latestApodDate (US Eastern rollover)", () => {
  it("is still yesterday for an IST morning (ET late evening, EDT)", () => {
    expect(latestApodDate(new Date("2026-10-03T03:30:00Z"))).toBe("2026-10-02");
  });
  it("rolls over just after midnight Eastern (EDT, UTC-4)", () => {
    expect(latestApodDate(new Date("2026-10-03T04:30:00Z"))).toBe("2026-10-03");
  });
  it("respects standard time in winter (EST, UTC-5)", () => {
    expect(latestApodDate(new Date("2026-01-15T04:30:00Z"))).toBe("2026-01-14");
    expect(latestApodDate(new Date("2026-01-15T05:30:00Z"))).toBe("2026-01-15");
  });
});
