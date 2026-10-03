import { getJSON } from "@/lib/http";
import { toPlainText } from "@/lib/text";
import type { LibraryImage, LibraryPage, RawAssetResponse, RawSearchResponse } from "../types";

const BASE = "https://images-api.nasa.gov";
export const PAGE_SIZE = 24;

/** Some hrefs come back as http:// or with unescaped spaces. */
const normaliseUrl = (href: string): string => encodeURI(decodeURI(href)).replace(/^http:\/\//, "https://");

export function mapSearchResponse(raw: RawSearchResponse, page: number): LibraryPage {
  const items: LibraryImage[] = [];
  for (const entry of raw.collection.items) {
    const data = entry.data?.[0];
    const preview = entry.links?.find((l) => l.render === "image" || l.rel === "preview")?.href;
    if (!data?.nasa_id || !preview) continue;
    items.push({
      id: data.nasa_id,
      title: toPlainText(data.title) || "Untitled",
      description: toPlainText(data.description) || "No description provided.",
      date: data.date_created?.slice(0, 10) ?? "",
      center: data.center,
      credit: data.photographer ?? data.secondary_creator,
      thumb: normaliseUrl(preview),
    });
  }
  const hasNext = raw.collection.links?.some((l) => l.rel === "next") ?? false;
  return { items, total: raw.collection.metadata?.total_hits ?? items.length, nextPage: hasNext ? page + 1 : undefined };
}

/** Prefer a web-friendly large JPEG over the (sometimes 50 MB TIFF) original. */
export function pickLargest(raw: RawAssetResponse): string | null {
  const hrefs = raw.collection.items.map((i) => i.href ?? "").filter((h) => /\.(jpe?g|png)$/i.test(h));
  const pick = ["~large.", "~medium.", "~orig."].map((tag) => hrefs.find((h) => h.includes(tag))).find(Boolean);
  return pick ? normaliseUrl(pick) : null;
}

export const imagesApi = {
  async search(query: string, page: number, signal?: AbortSignal): Promise<LibraryPage> {
    const params = new URLSearchParams({ q: query, media_type: "image", page: String(page), page_size: String(PAGE_SIZE) });
    return mapSearchResponse(await getJSON<RawSearchResponse>(`${BASE}/search?${params}`, signal), page);
  },
  async largestImage(nasaId: string, signal?: AbortSignal): Promise<string | null> {
    return pickLargest(await getJSON<RawAssetResponse>(`${BASE}/asset/${encodeURIComponent(nasaId)}`, signal));
  },
};
