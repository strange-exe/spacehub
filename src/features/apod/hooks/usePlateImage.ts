import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { preloadImage, type ImageSource } from "@/lib/preloadImage";
import type { Apod } from "../types";

/** Must match the <img sizes> in ApodMedia so preloads pick the same srcset candidate. */
export const PLATE_SIZES = "(min-width: 1024px) 66vw, 100vw";
/** Longest we hold the previous plate on screen waiting for the next image. */
const MAX_WAIT_MS = 2500;

export const plateImageSource = (apod: Apod): ImageSource | null =>
  apod.media_type === "image" && apod.url ? { src: apod.url, srcSet: apod.srcset, sizes: PLATE_SIZES } : null;

/** The actual download+decode. Shared by neighbour prefetching and rendering (deduplicated). */
export const plateImageQuery = (source: ImageSource) =>
  queryOptions({
    queryKey: ["plate-image", source.src],
    queryFn: () => preloadImage(source),
    staleTime: Infinity,
    gcTime: 15 * 60_000,
  });

/**
 * Suspends until the plate image is decoded, or MAX_WAIT_MS passes, whichever is first.
 * Inside a navigation transition this keeps the previous plate visible ("Developing next
 * plate…") instead of revealing an empty frame. The bounded wait is its own query so the
 * underlying download (above) is never marked "done" early.
 */
export function usePlateImageReady(source: ImageSource): void {
  const queryClient = useQueryClient();
  useSuspenseQuery({
    queryKey: ["plate-ready", source.src],
    queryFn: () =>
      Promise.race([
        queryClient.fetchQuery(plateImageQuery(source)),
        new Promise<true>((r) => window.setTimeout(() => r(true), MAX_WAIT_MS)),
      ]),
    staleTime: Infinity,
    gcTime: 15 * 60_000,
  });
}
