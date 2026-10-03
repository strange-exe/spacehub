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
  // The "large" size is a bounded (w=1600,h=800) re-render that upscales small originals and
  // shrinks portraits, so the original source_url is used for display too.
  const full = media?.source_url;

  return {
    date: raw.date.slice(0, 10),
    title: toPlainText(raw.title.rendered).replace(/^APOD:\s*\d{4}\s+\w+\s+\d{1,2}\s*[–-]\s*/, ""),
    explanation,
    media_type: iframe ? "video" : full ? "image" : "other",
    url: iframe ?? full,
    hdurl: iframe ? undefined : full,
    thumbnail_url: iframe ? full : undefined,
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
