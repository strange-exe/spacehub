import { ApiError, getJSON } from "@/lib/http";
import { addDays, type IsoDate } from "@/lib/dates";
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
  // Page layouts vary by era ("Tomorrow's picture:" vs "Tomorrow's Image", "Credit:" vs
  // "Credit Video Credit & Copyright:"), so the explanation ends at the EARLIEST of several
  // markers; the "Date July 10, 2018" line follows it in every layout seen so far.
  const explanation =
    between(text, /Explanation:\s*/i, /Tomorrow.s (?:picture|image)|\bDate [A-Z][a-z]+ \d{1,2}, \d{4}|\bCredit(?::|\s+(?:Image|Video|Illustration)\b)/) ??
    toPlainText(media?.caption?.rendered).replace(/^Explanation:\s*/i, "");
  const title = toPlainText(raw.title.rendered).replace(/^APOD:\s*\d{4}\s+\w+\s+\d{1,2}\s*[–-]\s*/, "");
  const credit = between(text, /\bCredit:?\s*(?:(?:Image|Video|Illustration)[^:]*Credit[^:]*:\s*)?/i, /Authors? & editors|A service of/i)
    // 1990s–2000s templates repeat the label and/or print the title first:
    // "Credit Credit: X" and "Credit The Trail of the Intruder Credit: X".
    ?.replace(/^(?:Credit:\s*)+/i, "")
    .replace(title ? new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+Credit:\\s*`) : /$^/, "")
    .replace(/\s+,/g, ",")
    .replace(/\s+–\s+/g, " – ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/[;,\s]+$/, "");
  // Originals can be huge (2026-10-02 is a 37.7 MB PNG), so display uses width-bounded CDN
  // renditions; WordPress's own "large" size also caps height, which crushes portraits.
  const full = media?.source_url;
  const image = full && !iframe ? full : undefined;

  return {
    date: raw.date.slice(0, 10),
    title,
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

const FULL_FIELDS = { _embed: "wp:featuredmedia", _fields: "date,slug,title,content,_links,_embedded" };
const SEARCH_PAGE = 100;

/**
 * Every APOD slug starts with "apod-2020-december-22-", which identifies the day exactly.
 *
 * 1. Date-range query with the full payload: one request, finds most days, but the
 *    WordPress date filter silently misses some migrated posts (e.g. 2020-12-22).
 * 2. Fallback: title search returning slugs only (cheap even at 100 results; the right post
 *    can rank 10th+ for day "1" because "APOD: 2024 May 1" also matches May 10–19), then
 *    fetch the matching post by id.
 *
 * A 404 ("not published") is only claimed when the search was exhaustive.
 */
export async function fetchFromScienceNasa(date: IsoDate, signal?: AbortSignal): Promise<Apod> {
  const [y = "", m = "", d = ""] = date.split("-");
  const month = MONTHS[Number(m) - 1] ?? "";
  const prefix = `apod-${y}-${month}-${Number(d)}-`;

  const byDate = new URLSearchParams({ ...FULL_FIELDS, after: `${addDays(date, -1)}T23:59:59`, before: `${addDays(date, 1)}T00:00:00`, per_page: "10" });
  const dated = await getJSON<RawArticle[]>(`${BASE}?${byDate}`, signal);
  const direct = dated.find((a) => a.slug.startsWith(prefix));
  if (direct) return mapScienceArticle(direct);

  const search = new URLSearchParams({ search: `APOD: ${y} ${month} ${Number(d)}`, _fields: "id,slug", per_page: String(SEARCH_PAGE) });
  const hits = await getJSON<Array<{ id: number; slug: string }>>(`${BASE}?${search}`, signal);
  const hit = hits.find((a) => a.slug.startsWith(prefix));
  if (!hit) {
    if (hits.length < SEARCH_PAGE) throw new ApiError(404, `No plate was published on ${date}.`);
    throw new ApiError(502, `Couldn't locate the plate for ${date} on science.nasa.gov.`);
  }
  return mapScienceArticle(await getJSON<RawArticle>(`${BASE}/${hit.id}?${new URLSearchParams(FULL_FIELDS)}`, signal));
}
