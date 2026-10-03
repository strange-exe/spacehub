export interface FavoriteItem {
  /** "apod:YYYY-MM-DD" or "nasa:<nasa_id>" — globally unique across sources. */
  id: string;
  source: "apod" | "library";
  title: string;
  thumb: string;
  full: string;
  date: string;
  description?: string;
  credit?: string;
  /** In-app route to re-open the item (APOD only). */
  route?: string;
  savedAt: number;
}
