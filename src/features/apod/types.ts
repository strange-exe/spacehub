import type { IsoDate } from "@/lib/dates";

/** Normalised APOD entry. Shape follows https://api.nasa.gov/planetary/apod (thumbs=true). */
export interface Apod {
  date: IsoDate;
  title: string;
  explanation: string;
  media_type: "image" | "video" | "other";
  url?: string;
  hdurl?: string;
  thumbnail_url?: string;
  /** Official API: only present for non-public-domain images. */
  copyright?: string;
  /** science.nasa.gov: full credit line as published. */
  credit?: string;
  alt?: string;
  /** Which upstream produced this entry (shown in the UI for transparency). */
  source: "science.nasa.gov" | "api.nasa.gov";
}
