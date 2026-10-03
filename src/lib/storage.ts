/**
 * Namespaced localStorage. Everything SpaceHub stores lives under "spacehub:*" so we never
 * touch keys owned by other apps on the same origin (the old site wiped them all).
 * Every access is wrapped: storage can throw in private mode or when quota is exceeded.
 */
const PREFIX = "spacehub:";

export const storageKey = (key: string): string => PREFIX + key;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(key));
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/** Best-effort write; callers keep their own in-memory state as the source of truth. */
export function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // Quota or privacy mode: the session keeps working in memory.
  }
}

/** Notifies when *another tab* changes the key (the browser never fires this for our own writes). */
export function subscribe(key: string, fn: () => void): () => void {
  const onStorage = (e: StorageEvent): void => {
    if (e.key === storageKey(key) || e.key === null) fn(); // null = storage cleared
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}
