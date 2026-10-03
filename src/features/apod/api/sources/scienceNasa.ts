import { ApiError, getJSON } from "@/lib/http";
import type { IsoDate } from "@/lib/dates";
import { toPlainText } from "@/lib/text";
import type { Apod } from "../../types";

/**
 * science.nasa.gov (WordPress) REST API. apod.nasa.gov now 301-redirects here, so this is
 * where APOD content actually lives. Undocumented as a public API: keep all knowledge of
 * its shape inside this file.
 */
const BASE = "https://science.nasa.gov/wp-json/wp/v2/image-article";

interface RawMedia {
  source_url?: string;
  alt_text?: string;
  caption?: { rendered?: string };
}
export interface RawArticle {
  date: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  _embedded?: { "wp:featuredmedia"?: RawMedia[] };
}

const between = (text: string, start: RegExp, end: RegExp): string | undefined => {
  const from = text.search(start);
  if (from < 0) return undefined;
  const rest = text.slice(from).replace(start, "");
  const to = rest.search(end);
  return to < 0 ? undefined : rest.slice(0, to).trim() || undefined;
};

/** assets.science.nasa.gov/dynamicimage resizes on the fly via ?w= (it does not convert formats). */
export function resized(url: string, width: number): string {
  if (!url.includes("/dynamicimage/")) return url;
  const u = new URL(url);
  u.searchParams.set("w", String(width));
  u.searchParams.set("fit", "clip");
  return u.toString();
}

export function mapScienceArticle(raw: RawArticle): Apod {
  const media = raw._embedded?.["wp:featuredmedia"]?.[0];
  const html = raw.content.rendered;
  const text = toPlainText(html).replace(/\s+/g, " ");
  const iframe = html.match(/<iframe[^>]+src="([^"]+)"/i)?.[1];

  // The article body holds the full text; the media caption is only an excerpt ending in "[…]".
  const explanation =
    between(text, /Explanation:\s*/i, /Tomorrow.s picture/i) ??
    between(text, /Explanation:\s*/i, /Credit:/i) ??
    toPlainText(media?.caption?.rendered).replace(/^Explanation:\s*/i, "");
  const credit = between(text, /Credit:\s*(?:(?:Image|Video|Illustration)[^:]*Credit[^:]*:\s*)?/i, /Authors? & editors|A service of/i)
    ?.replace(/\s+,/g, ",")
    .replace(/\s+–\s+/g, " – ");
  // Originals can be huge (2026-10-02 is a 37.7 MB PNG), so display uses width-bounded CDN
  // renditions; WordPress's own "large" size also caps height, which crushes portraits.
  const full = media?.source_url;
  const image = full && !iframe ? full : undefined;

  return {
    date: raw.date.slice(0, 10),
    title: toPlainText(raw.title.rendered).replace(/^APOD:\s*\d{4}\s+\w+\s+\d{1,2}\s*[–-]\s*/, ""),
    explanation,
    media_type: iframe ? "video" : full ? "image" : "other",
    url: iframe ?? (image && resized(image, 1400)),
    srcset: image && `${resized(image, 800)} 800w, ${resized(image, 1400)} 1400w`,
    viewerUrl: image && resized(image, 2560),
    hdurl: image,
    thumbnail_url: iframe && full ? resized(full, 800) : undefined,
    credit,
    alt: media?.alt_text || undefined,
    source: "science.nasa.gov",
  };
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/**
 * Lookup by title search + slug prefix. The WordPress date filter (after/before) silently
 * misses some migrated posts (e.g. 2020-12-22), while every APOD title follows
 * "APOD: 2020 December 22 – …" and every slug starts with "apod-2020-december-22-".
 * Measured on 16 random days: title search 15/16 (the miss was a real gap day), date filter 13/16.
 */
export async function fetchFromScienceNasa(date: IsoDate, signal?: AbortSignal): Promise<Apod> {
  const [y = "", m = "", d = ""] = date.split("-");
  const month = MONTHS[Number(m) - 1] ?? "";
  const params = new URLSearchParams({
    search: `APOD: ${y} ${month} ${Number(d)}`,
    _embed: "wp:featuredmedia",
    _fields: "date,slug,title,content,_links,_embedded",
    per_page: "10",
  });
  const prefix = `apod-${y}-${month}-${Number(d)}-`;
  const list = await getJSON<RawArticle[]>(`${BASE}?${params}`, signal);
  const article = list.find((a) => a.slug.startsWith(prefix));
  if (!article) throw new ApiError(404, `No plate was published on ${date}.`);
  return mapScienceArticle(article);
}
