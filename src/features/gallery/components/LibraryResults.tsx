import { useMemo, useState } from "react";
import { FocusCards, type FocusCardData } from "@/components/ui/focus-cards";
import { Lightbox, type LightboxItem } from "@/components/Lightbox";
import { imagesApi } from "../api/imagesApi";
import { useLibrarySearch } from "../hooks/useLibrarySearch";

export function LibraryResults({ query }: { query: string }) {
  const { items, total, hasNextPage, isFetchingNextPage, fetchNextPage } = useLibrarySearch(query);
  const [open, setOpen] = useState<number | null>(null);

  const cards = useMemo<FocusCardData[]>(
    () => items.map((i) => ({ id: i.id, title: i.title, src: i.thumb, caption: [i.date.slice(0, 4), i.center].filter(Boolean).join(" · ") })),
    [items],
  );
  const viewerItems = useMemo<LightboxItem[]>(
    () =>
      items.map((i) => {
        const credit = [i.credit, i.center].filter(Boolean).join(" · ") || undefined;
        return {
          id: `nasa:${i.id}`,
          title: i.title,
          date: i.date,
          src: i.thumb,
          resolveFullSrc: (signal: AbortSignal) => imagesApi.largestImage(i.id, signal),
          description: i.description,
          credit,
          favorite: { id: `nasa:${i.id}`, source: "library" as const, title: i.title, thumb: i.thumb, full: i.thumb, date: i.date, description: i.description, credit },
        };
      }),
    [items],
  );

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-4xl">No plates match “{query}”.</p>
        <p className="mt-3 text-dust">Try a broader term like “nebula”, “Apollo” or “Mars”.</p>
      </div>
    );
  }

  return (
    <>
      <p className="catalog mb-6" aria-live="polite">
        {total.toLocaleString("en-US")} results for “{query}” · showing {items.length}
      </p>
      <FocusCards cards={cards} onSelect={setOpen} />
      {hasNextPage && (
        <div className="mt-12 flex justify-center">
          <button type="button" className="btn-ghost px-6 py-3" onClick={fetchNextPage} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Developing more plates…" : "Load more"}
          </button>
        </div>
      )}
      <Lightbox items={viewerItems} index={open} onIndexChange={setOpen} />
    </>
  );
}
