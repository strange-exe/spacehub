import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { FocusCards, type FocusCardData } from "@/components/ui/focus-cards";
import { Lightbox, type LightboxItem } from "@/components/Lightbox";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";
import { imagesApi } from "@/features/gallery/api/imagesApi";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

// Routes are the composition layer: this is the one place favorites meet the gallery API.
export default function Favorites() {
  const { items } = useFavorites();
  const navigate = useNavigate();
  const [open, setOpen] = useState<number | null>(null);
  useDocumentTitle("Saved");

  const cards = useMemo<FocusCardData[]>(
    () => items.map((f) => ({ id: f.id, title: f.title, src: f.thumb, caption: `${f.source === "apod" ? "APOD" : "Library"} · ${f.date}` })),
    [items],
  );
  const viewerItems = useMemo<LightboxItem[]>(
    () =>
      items.map((f) => ({
        id: f.id,
        title: f.title,
        date: f.date,
        src: f.thumb,
        fullSrc: f.source === "apod" ? f.full : undefined,
        resolveFullSrc: f.source === "library" ? (signal: AbortSignal) => imagesApi.largestImage(f.id.replace(/^nasa:/, ""), signal) : undefined,
        description: f.description ?? "",
        credit: f.credit,
        favorite: f,
      })),
    [items],
  );

  const select = (i: number): void => {
    const fav = items[i];
    if (fav?.route) void navigate(fav.route);
    else setOpen(i);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-bone/10 pb-6">
        <div>
          <p className="catalog text-signal">Your collection</p>
          <h1 className="mt-2 font-display text-5xl sm:text-7xl">Saved plates</h1>
        </div>
        <p className="catalog">{items.length} saved · stored only in this browser</p>
      </header>

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-display text-4xl">Nothing saved yet.</p>
          <p className="mx-auto mt-3 max-w-md text-dust">Tap “Save” on any plate or library image and it will wait for you here.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/" className="btn-solid">Today’s plate</Link>
            <Link to="/gallery" className="btn-ghost">Browse the library</Link>
          </div>
        </div>
      ) : (
        <FocusCards cards={cards} onSelect={select} />
      )}
      <Lightbox items={viewerItems} index={open} onIndexChange={setOpen} />
    </section>
  );
}
