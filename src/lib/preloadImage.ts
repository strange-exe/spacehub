export interface ImageSource {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * Download an image off-DOM. Passing the same srcset/sizes as the real <img> makes the browser
 * pick the same candidate, so the later render is a cache hit.
 * Resolves on load, deliberately NOT on decode(): Chromium treats decoding a detached image as
 * low priority (measured: load at 128 ms, decode() resolving at 2,556 ms), while decoding during
 * the real first paint takes milliseconds.
 * Always resolves (load, error or hard cap): a failed preload must never block rendering.
 */
export function preloadImage({ src, srcSet, sizes }: ImageSource, capMs = 20_000): Promise<true> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = (): void => resolve(true);
    const timer = window.setTimeout(done, capMs);
    img.onload = () => {
      window.clearTimeout(timer);
      done();
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      done();
    };
    if (sizes) img.sizes = sizes;
    if (srcSet) img.srcset = srcSet;
    img.src = src;
  });
}

/** Respect Data Saver and very slow connections when deciding to prefetch speculatively. */
export function canPrefetchMedia(): boolean {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !conn?.saveData && !/(^|-)2g$/.test(conn?.effectiveType ?? "");
}
