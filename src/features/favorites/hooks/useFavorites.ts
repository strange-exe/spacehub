import { useCallback, useSyncExternalStore } from "react";
import { readJSON, subscribe, writeJSON } from "@/lib/storage";
import type { FavoriteItem } from "../types";

const KEY = "favorites";

// The in-memory array is the source of truth; localStorage is best-effort persistence.
// (If storage is blocked or full, saving still works for the session.) useSyncExternalStore
// needs a referentially stable snapshot, which this module-level array provides.
let snapshot: FavoriteItem[] = readJSON<FavoriteItem[]>(KEY, []);
const listeners = new Set<() => void>();

function commit(next: FavoriteItem[]): void {
  snapshot = next;
  writeJSON(KEY, next);
  listeners.forEach((fn) => fn());
}

function subscribeStore(onChange: () => void): () => void {
  listeners.add(onChange);
  // Other tabs: re-read what they persisted.
  const off = subscribe(KEY, () => {
    snapshot = readJSON<FavoriteItem[]>(KEY, []);
    onChange();
  });
  return () => {
    listeners.delete(onChange);
    off();
  };
}
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
    commit(snapshot.filter((f) => f.id !== id));
  }, []);

  const toggle = useCallback((item: Omit<FavoriteItem, "savedAt">) => {
    const exists = snapshot.some((f) => f.id === item.id);
    commit(exists ? snapshot.filter((f) => f.id !== item.id) : [{ ...item, savedAt: Date.now() }, ...snapshot]);
  }, []);

  return { items, isFavorite, toggle, remove };
}
