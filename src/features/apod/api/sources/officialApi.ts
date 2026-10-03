import { NASA_API_KEY } from "@/lib/env";
import { getJSON } from "@/lib/http";
import type { IsoDate } from "@/lib/dates";
import type { Apod } from "../../types";

const BASE = "https://api.nasa.gov/planetary/apod";

/** Official APOD API (fallback source). */
export async function fetchFromOfficialApi(date: IsoDate, signal?: AbortSignal): Promise<Apod> {
  const params = new URLSearchParams({ api_key: NASA_API_KEY, date, thumbs: "true" });
  const raw = await getJSON<Omit<Apod, "source">>(`${BASE}?${params}`, signal);
  return { ...raw, source: "api.nasa.gov" };
}
