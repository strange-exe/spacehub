import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { Lightbox, type LightboxItem } from "@/components/Lightbox";
import { RegMarks } from "@/components/RegMarks";
import { ShareButton } from "@/components/ShareButton";
import { Spotlight } from "@/components/ui/spotlight";
import { FavoriteButton } from "@/features/favorites/components/FavoriteButton";
import { addDays, formatLong, isIsoDate, type IsoDate } from "@/lib/dates";
import { toPlainText } from "@/lib/text";
import { apodQuery, useApod } from "../hooks/useApod";
import { useLatestApodDate } from "../hooks/useLatestApodDate";
import { APOD_EPOCH, plateNumber, randomApodDate } from "../lib/apodDates";
import { apodPageUrl } from "../lib/media";
import { ApodMedia } from "./ApodMedia";
import { DayScrubber } from "./DayScrubber";

const isTypingTarget = (el: EventTarget | null): boolean =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.getAttribute("role") === "slider");

export function ApodPlate({ date }: { date: IsoDate }) {
  const { data: apod } = useApod(date);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const latest = useLatestApodDate();
  const [viewerOpen, setViewerOpen] = useState(false);
  // React Router navigations are transitions: while the next day suspends, React keeps this
  // plate on screen. isPending lets us *show* that something is happening.
  const [isPending, startTransition] = useTransition();
  // `date` lags behind during a pending transition, so steps (→ → →, PageUp) are counted from
  // the day the user is heading to, which updates immediately.
  const [target, setTarget] = useState<IsoDate | null>(null);
  const current = isPending && target ? target : date;

  const goTo = (d: IsoDate): void => {
    const clamped = d < APOD_EPOCH ? APOD_EPOCH : d > latest ? latest : d;
    setTarget(clamped);
    startTransition(() => void navigate(clamped === latest ? "/" : `/apod/${clamped}`));
  };
  const prev = current > APOD_EPOCH ? addDays(current, -1) : null;
  const next = current < latest ? addDays(current, 1) : null;

  // Warm the cache for the neighbouring days so prev/next feel instant.
  useEffect(() => {
    for (const d of [addDays(date, -1), addDays(date, 1)]) {
      if (d >= APOD_EPOCH && d <= latest) void queryClient.prefetchQuery(apodQuery(d));
    }
  }, [date, latest, queryClient]);

  // ← / → step through the archive from anywhere on the page.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || isTypingTarget(e.target) || document.querySelector("dialog[open]")) return;
    if (e.key === "ArrowLeft" && prev) goTo(prev);
    if (e.key === "ArrowRight" && next) goTo(next);
  });
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const explanation = toPlainText(apod.explanation);
  const credit = apod.credit ?? (apod.copyright ? `© ${toPlainText(apod.copyright).replace(/\s+/g, " ")}` : "NASA");
  const thumb = apod.media_type === "image" ? (apod.url ?? "") : (apod.thumbnail_url ?? "");
  const favorite = {
    id: `apod:${apod.date}`,
    source: "apod" as const,
    title: apod.title,
    thumb,
    full: apod.hdurl ?? apod.url ?? thumb,
    date: apod.date,
    route: `/apod/${apod.date}`,
    credit,
  };
  const viewerItems: LightboxItem[] = [
    {
      id: favorite.id,
      title: apod.title,
      date: formatLong(apod.date),
      src: apod.url ?? "",
      fullSrc: apod.viewerUrl ?? apod.hdurl,
      originalHref: apod.hdurl,
      description: explanation,
      credit,
      favorite,
    },
  ];

  return (
    <article className="relative overflow-hidden" aria-busy={isPending}>
      <Spotlight className="-top-40 left-0 md:-top-24 md:left-40" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:pt-32">
        {/* Catalog strip: the plate's identity. */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-bone/10 pb-3"
        >
          <span className="catalog text-signal">Plate № {plateNumber(apod.date).toLocaleString("en-US")}</span>
          <time className="catalog" dateTime={apod.date}>{formatLong(apod.date)}</time>
          <span className={cn("catalog", isPending && "animate-pulse text-signal")} role="status">
            {isPending ? "Developing next plate…" : apod.media_type}
          </span>
          <span className="catalog ml-auto hidden sm:inline">Astronomy Picture of the Day</span>
        </motion.div>

        <div className={cn("grid grid-cols-1 gap-10 transition-[opacity,filter] duration-300 lg:grid-cols-12 lg:gap-8", isPending && "opacity-40 grayscale")}>
          <motion.figure
            key={apod.date}
            initial={{ clipPath: "inset(0 0 100% 0)", opacity: 0.4 }}
            animate={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-w-0 lg:col-span-8"
          >
            <RegMarks />
            <ApodMedia apod={apod} onOpen={() => setViewerOpen(true)} />
            <figcaption className="catalog mt-3 flex justify-between gap-4">
              <span className="truncate">{credit}</span>
              <a className="link shrink-0 normal-case tracking-normal" href={apodPageUrl(apod.date)} target="_blank" rel="noreferrer">
                via {apod.source} ↗
              </a>
            </figcaption>
          </motion.figure>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex min-w-0 flex-col lg:col-span-4"
          >
            {/* Title deliberately overhangs the plate on large screens. */}
            <h1 className="relative z-10 font-display text-5xl leading-[0.95] text-bone [text-shadow:0_2px_30px_rgba(7,8,11,0.9)] sm:text-6xl lg:-ml-28 lg:text-7xl">
              {apod.title}
            </h1>
            {explanation ? (
              <p className="mt-6 max-w-prose text-[1.02rem] leading-relaxed text-bone/80">{explanation}</p>
            ) : (
              <p className="mt-6 max-w-prose text-dust">
                The explanation for this plate couldn’t be loaded.{" "}
                <a className="link" href={apodPageUrl(apod.date)} target="_blank" rel="noreferrer">
                  Read it on NASA ↗
                </a>
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-2">
              <FavoriteButton item={favorite} />
              {/* Always share the dated permalink, even from the "Today" page. */}
              <ShareButton title={apod.title} url={`${window.location.href.split("#")[0]}#/apod/${apod.date}`} />
              {apod.hdurl && (
                <a className="btn-ghost" href={apod.hdurl} target="_blank" rel="noreferrer">
                  HD original ↗
                </a>
              )}
              <button type="button" className="btn-ghost" onClick={() => goTo(randomApodDate(latest))}>
                Random plate
              </button>
            </div>
          </motion.div>
        </div>

        {/* Archive navigation */}
        <nav aria-label="Archive" className="mt-16 grid gap-4 rounded-2xl border border-bone/10 bg-ink-2/60 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="btn-ghost" disabled={!prev} onClick={() => prev && goTo(prev)}>
              ← Previous day
            </button>
            <label className="flex items-center gap-3">
              <span className="catalog">Jump to</span>
              {/* Uncontrolled + range-guarded: typing a year fires change per digit ("0002-…",
                  "0020-…"), which must neither navigate nor reset the field mid-typing. */}
              <input
                key={current}
                type="date"
                className="field w-auto py-2 font-mono text-sm [color-scheme:dark]"
                min={APOD_EPOCH}
                max={latest}
                defaultValue={current}
                onChange={(e) => {
                  const v = e.target.value;
                  if (isIsoDate(v) && v >= APOD_EPOCH && v <= latest && v !== current) goTo(v);
                }}
              />
            </label>
            <button type="button" className="btn-ghost" disabled={!next} onClick={() => next && goTo(next)}>
              Next day →
            </button>
          </div>
          <DayScrubber date={current} latest={latest} onChange={goTo} />
          <p className="catalog text-center">
            {plateNumber(latest).toLocaleString("en-US")} plates since {formatLong(APOD_EPOCH)} · ← → keys to browse
          </p>
        </nav>
      </div>

      <Lightbox items={viewerItems} index={viewerOpen ? 0 : null} onIndexChange={(i) => setViewerOpen(i !== null)} />
    </article>
  );
}
