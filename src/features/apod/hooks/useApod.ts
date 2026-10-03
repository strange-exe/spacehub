import { queryOptions, useSuspenseQuery, type UseSuspenseQueryResult } from "@tanstack/react-query";
import type { IsoDate } from "@/lib/dates";
import { apodApi } from "../api/apodApi";
import { latestApodDate } from "../lib/apodDates";
import type { Apod } from "../types";

const HOUR = 3_600_000;

/** Shared by useApod and neighbour prefetching so both hit the same cache entry. */
export const apodQuery = (date: IsoDate) =>
  queryOptions({
    queryKey: ["apod", date],
    queryFn: ({ signal }) => apodApi.getByDate(date, signal),
    // A past day's APOD never changes; only "today" can still be corrected by NASA.
    staleTime: date === latestApodDate() ? HOUR : Infinity,
  });

export function useApod(date: IsoDate): UseSuspenseQueryResult<Apod> {
  return useSuspenseQuery(apodQuery(date));
}
