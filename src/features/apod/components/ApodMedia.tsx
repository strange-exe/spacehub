import { useState } from "react";
import { cn } from "@/lib/cn";
import { apodPageUrl, toEmbedUrl } from "../lib/media";
import type { Apod } from "../types";

interface ApodMediaProps {
  apod: Apod;
  onOpen: () => void;
}

export function ApodMedia({ apod, onOpen }: ApodMediaProps) {
  const [loaded, setLoaded] = useState(false);

  if (apod.media_type === "image" && apod.url) {
    return (
      <button type="button" onClick={onOpen} className="group relative block w-full cursor-zoom-in bg-ink-2" aria-label={`View “${apod.title}” larger`}>
        <img
          src={apod.url}
          alt={apod.alt ?? apod.title}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={cn(
            "mx-auto max-h-[78dvh] w-full object-contain transition-[opacity,filter] duration-700",
            loaded ? "opacity-100 blur-0" : "min-h-[50dvh] opacity-0 blur-md",
          )}
        />
        <span className="catalog absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Enlarge ⤢
        </span>
      </button>
    );
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
    <a href={apod.url ?? apodPageUrl(apod.date)} target="_blank" rel="noreferrer" className="group relative block aspect-video w-full overflow-hidden bg-ink-2">
      {apod.thumbnail_url && <img src={apod.thumbnail_url} alt="" className="size-full object-cover opacity-60 transition-opacity group-hover:opacity-80" />}
      <span className="absolute inset-0 grid place-items-center">
        <span className="btn-solid">Open today’s interactive plate ↗</span>
      </span>
    </a>
  );
}
