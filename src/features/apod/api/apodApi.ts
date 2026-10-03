import { ApiError } from "@/lib/http";
import type { IsoDate } from "@/lib/dates";
import type { Apod } from "../types";
import { fetchFromOfficialApi } from "./sources/officialApi";
import { fetchFromScienceNasa } from "./sources/scienceNasa";

/**
 * Since apod.nasa.gov started redirecting to science.nasa.gov, the official API answers
 * 200 OK with a generic page scrape ("NASA Science" + the NASA logo). HTTP status alone
 * can't catch that, so every source's output is validated semantically.
 */
export function isPlaceholderApod(apod: Apod): boolean {
  return apod.title.trim() === "NASA Science" || /nasa-logo/i.test(apod.url ?? "") || !apod.explanation.trim();
}

const SOURCES = [fetchFromScienceNasa, fetchFromOfficialApi] as const;

export const apodApi = {
  /**
   * Try each source in order and return the first entry that passes validation.
   * If all fail, the *primary* source's error wins: "no plate on this day" from a healthy
   * source is more useful than the fallback's "placeholder data" complaint.
   */
  async getByDate(date: IsoDate, signal?: AbortSignal): Promise<Apod> {
    let firstError: unknown = null;
    for (const source of SOURCES) {
      try {
        const apod = await source(date, signal);
        if (!isPlaceholderApod(apod)) return apod;
        firstError ??= new ApiError(502, "NASA's APOD feed returned placeholder data for this day.");
      } catch (err) {
        if ((err as Error).name === "AbortError") throw err;
        firstError ??= err;
      }
    }
    throw firstError;
  },
};
