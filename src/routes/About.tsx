import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useLatestApodDate } from "@/features/apod/hooks/useLatestApodDate";
import { plateNumber } from "@/features/apod/lib/apodDates";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

// A component (not a value baked into SECTIONS at module load) so it stays current past midnight ET.
function TodayPlateNumber() {
  return <span className="font-mono text-signal">{plateNumber(useLatestApodDate()).toLocaleString("en-US")}</span>;
}

const SECTIONS: Array<{ id: string; label: string; body: ReactNode }> = [
  {
    id: "what",
    label: "What this is",
    body: (
      <p>
        SpaceHub is a quiet reading room for NASA’s open imagery. Every day NASA’s{" "}
        <a className="link" href="https://apod.nasa.gov/apod/">Astronomy Picture of the Day</a> publishes one image or video
        with an explanation written by a professional astronomer. SpaceHub presents each one as a numbered plate, the way
        observatories once catalogued glass photographic plates, and lets you walk the entire archive day by day.
      </p>
    ),
  },
  {
    id: "plates",
    label: "Plate numbers",
    body: (
      <p>
        Plate № 1 is 16 June 1995, the first APOD. Each day since adds one, so today is plate №{" "}
        <TodayPlateNumber />. A handful of
        early days were never published, so a few plate numbers point at empty shelves.
      </p>
    ),
  },
  {
    id: "data",
    label: "Where the data comes from",
    body: (
      <ul className="grid gap-3">
        <li>
          <a className="link" href="https://github.com/nasa/apod-api">APOD API</a> on api.nasa.gov: the daily plates.
        </li>
        <li>
          <a className="link" href="https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf">NASA Image and Video Library API</a>: the
          searchable library.
        </li>
        <li>Most NASA imagery is public domain; APOD entries marked © belong to their credited photographers.</li>
      </ul>
    ),
  },
  {
    id: "privacy",
    label: "Privacy",
    body: (
      <p>
        No accounts, no analytics, no cookies. Saved plates and a small cache of fetched data live in your browser’s local
        storage under the <code className="font-mono text-sm text-bone">spacehub:</code> prefix and never leave your device.
      </p>
    ),
  },
  {
    id: "built",
    label: "Built with",
    body: (
      <p className="font-mono text-sm leading-7 text-dust">
        React · TypeScript · Vite · Tailwind CSS · Motion · TanStack Query · React Router · components adapted from Aceternity UI
      </p>
    ),
  },
];

export default function About() {
  useDocumentTitle("About");
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-32 sm:px-6">
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl font-display text-6xl leading-[0.95] sm:text-8xl">
        A window, <em className="text-dust">not a feed.</em>
      </motion.h1>
      <div className="mt-20 grid gap-16 md:grid-cols-[14rem_1fr]">
        <nav aria-label="On this page" className="hidden md:block">
          <ul className="sticky top-28 grid gap-2">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView(); }} className="catalog hover:text-bone">
                  {String(i + 1).padStart(2, "0")} {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid gap-16">
          {SECTIONS.map((s, i) => (
            <motion.article
              key={s.id}
              id={s.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="scroll-mt-28 border-t border-bone/10 pt-6"
            >
              <p className="catalog text-signal">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="mt-2 font-display text-4xl">{s.label}</h2>
              <div className="mt-4 max-w-prose text-lg leading-relaxed text-bone/80">{s.body}</div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
