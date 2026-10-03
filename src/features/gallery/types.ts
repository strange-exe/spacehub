/** Normalised item from https://images-api.nasa.gov/search */
export interface LibraryImage {
  id: string; // nasa_id
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  center?: string;
  credit?: string;
  thumb: string;
}

export interface LibraryPage {
  items: LibraryImage[];
  total: number;
  nextPage?: number;
}

/** Raw API shapes (only the fields we use). */
export interface RawSearchResponse {
  collection: {
    items: Array<{
      data?: Array<{
        nasa_id?: string;
        title?: string;
        description?: string;
        date_created?: string;
        center?: string;
        photographer?: string;
        secondary_creator?: string;
      }>;
      links?: Array<{ href?: string; rel?: string; render?: string }>;
    }>;
    links?: Array<{ rel?: string; href?: string }>;
    metadata?: { total_hits?: number };
  };
}

export interface RawAssetResponse {
  collection: { items: Array<{ href?: string }> };
}
