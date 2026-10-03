// Adapted from Aceternity UI "Focus Cards" (ui.aceternity.com/components/focus-cards).
// Changes: real <button>s so keyboard focus triggers the same effect as hover, lazy images,
// a bento rhythm (every 7th card is a 2×2 feature) instead of a uniform grid, captions in the
// catalog voice, memoised cards. CSS grid (not CSS columns) so DOM/tab order = visual order.
import { memo, useState } from "react";
import { cn } from "@/lib/cn";

export interface FocusCardData {
  id: string;
  title: string;
  src: string;
  caption?: string;
}

interface CardProps {
  card: FocusCardData;
  index: number;
  focused: number | null;
  setFocused: (i: number | null) => void;
  onSelect: (i: number) => void;
}

const Card = memo(function Card({ card, index, focused, setFocused, onSelect }: CardProps) {
  const dimmed = focused !== null && focused !== index;
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      onMouseEnter={() => setFocused(index)}
      onMouseLeave={() => setFocused(null)}
      onFocus={() => setFocused(index)}
      onBlur={() => setFocused(null)}
      className={cn(
        "group relative block size-full overflow-hidden rounded-sm bg-ink-2 text-left transition-all duration-300 ease-out",
        index % 7 === 0 && "col-span-2 row-span-2",
        dimmed && "scale-[0.98] blur-[2px] brightness-50",
      )}
    >
      <img src={card.src} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <span
        className={cn(
          "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink via-ink/40 to-transparent p-4 transition-opacity duration-300",
          // Touch screens have no hover, so captions are always visible below sm.
          focused === index ? "opacity-100" : "opacity-100 sm:opacity-0",
        )}
      >
        {card.caption && <span className="catalog">{card.caption}</span>}
        <span className="mt-1 line-clamp-2 font-display text-2xl leading-tight text-bone">{card.title}</span>
      </span>
    </button>
  );
});

export function FocusCards({ cards, onSelect }: { cards: FocusCardData[]; onSelect: (index: number) => void }) {
  const [focused, setFocused] = useState<number | null>(null);
  return (
    <div className="grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
      {cards.map((card, i) => (
        <Card key={card.id} card={card} index={i} focused={focused} setFocused={setFocused} onSelect={onSelect} />
      ))}
    </div>
  );
}
