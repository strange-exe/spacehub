export interface ImageSource {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * Download *and decode* an image off-DOM. Passing the same srcset/sizes as the real <img>
 * makes the browser pick the same candidate, so the later render is a cache hit.
 * Always resolves (load, error or hard cap): a failed preload must never block rendering.
 */
export function preloadImage({ src, srcSet, sizes }: ImageSource, capMs = 20_000): Promise<true> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = (): void => resolve(true);
    const timer = window.setTimeout(done, capMs);
    img.onload = () => {
      window.clearTimeout(timer);
      // decode() avoids a paint hitch when the <img> first appears; ignore decode failures.
      img.decode().then(done, done);
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
