import { Suspense, useDeferredValue } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router";
import { VanishInput } from "@/components/ui/vanish-input";
import { LibraryResults } from "@/features/gallery/components/LibraryResults";
import { cn } from "@/lib/cn";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const TOPICS = ["Galaxy", "Nebula", "Mars", "Earth", "Saturn", "Jupiter", "Apollo", "Hubble", "Webb", "Aurora", "Eclipse"];
const PLACEHOLDERS = ["Search “pillars of creation”", "Search “Apollo 11”", "Search “Saturn rings”", "Search “aurora from ISS”"];
const DEFAULT_QUERY = "galaxy";

export default function Gallery() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q")?.trim() || DEFAULT_QUERY;
  // Keep showing the previous results (dimmed) while the next query suspends,
  // instead of flashing the whole grid back to a skeleton.
  const deferredQuery = useDeferredValue(query);
  const stale = query !== deferredQuery;
  useDocumentTitle(`Library · ${query}`);

  const search = (q: string): void => setParams({ q });

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <p className="catalog text-signal">NASA Image and Video Library</p>
        <h1 className="mt-3 font-display text-5xl leading-none sm:text-7xl">
          NASA’s archive, <em className="text-dust">one search away.</em>
        </h1>
      </motion.header>

      <VanishInput label="Search NASA's image library" placeholders={PLACEHOLDERS} onSubmit={search} />

      <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2" aria-label="Topics">
        {TOPICS.map((t) => {
          const active = t.toLowerCase() === query.toLowerCase();
          return (
            <li key={t}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => search(t.toLowerCase())}
                className={cn("rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors", active ? "border-signal bg-signal text-ink" : "border-bone/15 text-dust hover:border-bone/40 hover:text-bone")}
              >
                {t}
              </button>
            </li>
          );
        })}
      </ul>

      <div className={cn("mt-14 transition-opacity duration-300", stale && "pointer-events-none opacity-40")} aria-busy={stale}>
        <Suspense fallback={<GridSkeleton />}>
          <LibraryResults query={deferredQuery} />
        </Suspense>
      </div>
    </section>
  );
}

function GridSkeleton() {
  return (
    <div role="status" aria-label="Loading results" className="grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className={cn("animate-pulse rounded-sm bg-ink-2", i % 7 === 0 && "col-span-2 row-span-2")} />
      ))}
    </div>
  );
}
