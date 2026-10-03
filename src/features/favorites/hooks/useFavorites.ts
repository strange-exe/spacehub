import { useCallback, useSyncExternalStore } from "react";
import { readJSON, subscribe, writeJSON } from "@/lib/storage";
import type { FavoriteItem } from "../types";

const KEY = "favorites";

// useSyncExternalStore needs a referentially stable snapshot, so we cache the parsed
// array and only re-read storage when a change notification arrives.
let snapshot: FavoriteItem[] = readJSON<FavoriteItem[]>(KEY, []);
const subscribeStore = (onChange: () => void): (() => void) =>
  subscribe(KEY, () => {
    snapshot = readJSON<FavoriteItem[]>(KEY, []);
    onChange();
  });
const getSnapshot = (): FavoriteItem[] => snapshot;

export interface FavoritesApi {
  items: FavoriteItem[];
  isFavorite: (id: string) => boolean;
  toggle: (item: Omit<FavoriteItem, "savedAt">) => void;
  remove: (id: string) => void;
}

export function useFavorites(): FavoritesApi {
  const items = useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot);

  const isFavorite = useCallback((id: string) => items.some((f) => f.id === id), [items]);

  const remove = useCallback((id: string) => {
    writeJSON(KEY, snapshot.filter((f) => f.id !== id));
  }, []);

  const toggle = useCallback((item: Omit<FavoriteItem, "savedAt">) => {
    const exists = snapshot.some((f) => f.id === item.id);
    writeJSON(KEY, exists ? snapshot.filter((f) => f.id !== item.id) : [{ ...item, savedAt: Date.now() }, ...snapshot]);
  }, []);

  return { items, isFavorite, toggle, remove };
}
