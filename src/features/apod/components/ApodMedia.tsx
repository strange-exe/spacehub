import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ImageSource } from "@/lib/preloadImage";
import { PLATE_SIZES, plateImageSource, usePlateImageReady } from "../hooks/usePlateImage";
import { apodPageUrl, toEmbedUrl } from "../lib/media";
import type { Apod } from "../types";

interface ApodMediaProps {
  apod: Apod;
  onOpen: () => void;
}

interface PlateImageProps {
  apod: Apod;
  source: ImageSource;
  onOpen: () => void;
  onError: () => void;
}

/** Suspends until the image is decoded (bounded), so it usually mounts already painted. */
function PlateImage({ apod, source, onOpen, onError }: PlateImageProps) {
  usePlateImageReady(source);
  const [loaded, setLoaded] = useState(false);

  return (
    <button type="button" onClick={onOpen} className="group relative block w-full cursor-zoom-in bg-ink-2" aria-label={`View “${apod.title}” larger`}>
      <img
        src={source.src}
        srcSet={source.srcSet}
        sizes={PLATE_SIZES}
        alt={apod.alt ?? apod.title}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={onError}
        className={cn(
          // Short fade: when preloading worked the image is already decoded; the long blur-in
          // only matters on the slow path (preload hit its time cap).
          "mx-auto max-h-[78dvh] w-full object-contain transition-[opacity,filter] duration-300",
          loaded ? "opacity-100 blur-0" : "min-h-[50dvh] opacity-0 blur-md",
        )}
      />
      <span className="catalog absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Enlarge ⤢
      </span>
    </button>
  );
}

export function ApodMedia({ apod, onOpen }: ApodMediaProps) {
  const [failed, setFailed] = useState(false);
  const source = plateImageSource(apod);

  if (source && !failed) {
    // onError falls through to the outbound-link fallback below.
    return <PlateImage apod={apod} source={source} onOpen={onOpen} onError={() => setFailed(true)} />;
  }

  const embed = apod.media_type === "video" ? toEmbedUrl(apod.url) : null;
  if (embed) {
    return (
      <div className="aspect-video w-full bg-ink-2">
        <iframe
          src={embed}
          title={apod.title}
          className="size-full"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>
    );
  }

  // Direct video files, unknown hosts, or interactive "other" entries.
  const isFile = apod.url && /\.(mp4|webm)$/i.test(apod.url);
  if (isFile) {
    return <video src={apod.url} poster={apod.thumbnail_url} controls className="w-full bg-ink-2" />;
  }
  return (
    <a href={failed ? apodPageUrl(apod.date) : (apod.url ?? apodPageUrl(apod.date))} target="_blank" rel="noreferrer" className="group relative block aspect-video w-full overflow-hidden bg-ink-2">
      {apod.thumbnail_url && <img src={apod.thumbnail_url} alt="" className="size-full object-cover opacity-60 transition-opacity group-hover:opacity-80" />}
      <span className="absolute inset-0 grid place-items-center">
        <span className="btn-solid">{failed ? "Image unavailable · view on NASA ↗" : "Open this interactive plate ↗"}</span>
      </span>
    </a>
  );
}
