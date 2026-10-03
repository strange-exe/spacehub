/**
 * Namespaced localStorage. Everything SpaceHub stores lives under "spacehub:*" so we never
 * touch keys owned by other apps on the same origin (the old site wiped them all).
 * Every access is wrapped: storage can throw in private mode or when quota is exceeded.
 */
const PREFIX = "spacehub:";
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

export const storageKey = (key: string): string => PREFIX + key;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(key));
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // Quota or privacy mode: keep working in-memory for this session.
  }
  listeners.get(key)?.forEach((fn) => fn());
}

/** Subscribe to changes from this tab (writeJSON) and other tabs (storage event). */
export function subscribe(key: string, fn: Listener): () => void {
  const set = listeners.get(key) ?? new Set<Listener>();
  set.add(fn);
  listeners.set(key, set);
  const onStorage = (e: StorageEvent): void => {
    if (e.key === storageKey(key)) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    set.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}
