import { useCallback, useEffect, useEffectEvent, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { FavoriteButton } from "@/features/favorites/components/FavoriteButton";
import type { FavoriteItem } from "@/features/favorites/types";

export interface LightboxItem {
  id: string;
  title: string;
  date: string;
  /** Shown immediately (usually the thumbnail / standard-res image). */
  src: string;
  /** Larger rendition, either known up front or resolved lazily (cached by react-query). */
  fullSrc?: string;
  resolveFullSrc?: (signal: AbortSignal) => Promise<string | undefined>;
  description: string;
  credit?: string;
  favorite: Omit<FavoriteItem, "savedAt">;
}

interface LightboxProps {
  items: LightboxItem[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

/**
 * Built on native <dialog>.showModal(): the browser gives us a focus trap, inert background,
 * Esc-to-close and a ::backdrop for free, all things the old hand-rolled modal lacked.
 */
export function Lightbox({ items, index, onIndexChange }: LightboxProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const item = index === null ? undefined : items[index];
  const open = item !== undefined;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      // showModal() focuses the first focusable element (the ← button); React's autoFocus
      // prop is applied before that, so it gets overridden. Focus Close explicitly instead.
      dialog.querySelector<HTMLElement>("[data-initial-focus]")?.focus();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Esc, the Close button and backdrop clicks all end in the native (asynchronous) "close"
  // event, so that single listener is the one place state is reset.
  const handleClose = useEffectEvent(() => {
    document.documentElement.style.overflow = "";
    onIndexChange(null);
    returnFocus.current?.focus();
  });
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onNativeClose = (): void => handleClose();
    dialog.addEventListener("close", onNativeClose);
    return () => {
      dialog.removeEventListener("close", onNativeClose);
      document.documentElement.style.overflow = ""; // never leave the page scroll-locked on unmount
    };
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (index === null || items.length < 2) return;
      onIndexChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndexChange],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>): void => {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  };

  // Clicks that land on the <dialog> itself (not its content) are backdrop clicks.
  const onClick = (e: MouseEvent<HTMLDialogElement>): void => {
    if (e.target === e.currentTarget) ref.current?.close();
  };

  return (
    <dialog
      ref={ref}
      aria-label={item?.title ?? "Image viewer"}
      onKeyDown={onKeyDown}
      onClick={onClick}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-ink/90 p-3 text-bone backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:p-6"
    >
      {item && index !== null && (
        // Deliberately NOT keyed by item: remounting would destroy the focused button and drop
        // focus to <body>, after which ←/→ no longer reach the dialog.
        <LightboxContent
          item={item}
          position={`${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`}
          canStep={items.length > 1}
          onStep={step}
          onClose={() => ref.current?.close()}
        />
      )}
    </dialog>
  );
}

interface ContentProps {
  item: LightboxItem;
  position: string;
  canStep: boolean;
  onStep: (delta: number) => void;
  onClose: () => void;
}

function LightboxContent({ item, position, canStep, onStep, onClose }: ContentProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  // Progressive: show the preview instantly, swap to the large rendition once resolved.
  const { data: resolved } = useQuery({
    queryKey: ["asset", item.id],
    queryFn: ({ signal }) => item.resolveFullSrc?.(signal) ?? Promise.resolve(undefined),
    enabled: !!item.resolveFullSrc && !item.fullSrc,
    staleTime: Infinity,
  });
  const fullSrc = item.fullSrc ?? resolved;
  const displaySrc = fullSrc ?? item.src;
  const loaded = loadedSrc === displaySrc;

  return (
    <div className="mx-auto grid min-h-full max-w-[96rem] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="relative flex min-h-[50dvh] items-center justify-center">
        <motion.img
          key={item.id}
          src={displaySrc}
          alt={item.title}
          onLoad={() => setLoadedSrc(displaySrc)}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: loaded ? 1 : 0.4, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="max-h-[82dvh] w-auto max-w-full rounded-sm object-contain"
        />
        {canStep && (
          <>
            <button type="button" aria-label="Previous image" onClick={() => onStep(-1)} className="btn-ghost absolute left-2 top-1/2 -translate-y-1/2 bg-ink/70">
              ←
            </button>
            <button type="button" aria-label="Next image" onClick={() => onStep(1)} className="btn-ghost absolute right-2 top-1/2 -translate-y-1/2 bg-ink/70">
              →
            </button>
          </>
        )}
      </div>

      <aside className="flex flex-col gap-4 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className="catalog">{position}</span>
          <button type="button" onClick={onClose} className="btn-ghost" data-initial-focus>
            Close <kbd className="font-mono text-xs text-dust">Esc</kbd>
          </button>
        </div>
        <h2 className="font-display text-4xl leading-tight">{item.title}</h2>
        <p className="catalog">
          {item.date}
          {item.credit && <> · {item.credit}</>}
        </p>
        <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-bone/80">{item.description}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <FavoriteButton item={item.favorite} />
          <a className="btn-ghost" href={fullSrc ?? item.src} target="_blank" rel="noreferrer">
            Full resolution ↗
          </a>
        </div>
        <p className="catalog hidden lg:block">← → to browse</p>
      </aside>
    </div>
  );
}
