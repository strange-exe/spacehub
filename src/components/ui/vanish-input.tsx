// Adapted from Aceternity UI "Placeholders and Vanish Input"
// (ui.aceternity.com/components/placeholders-and-vanish-input).
// Changes: the canvas particle effect is replaced by a per-letter motion dissolve (lighter,
// respects reduced motion via MotionConfig); controlled value; labelled for screen readers.
import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";

interface VanishInputProps {
  placeholders: string[];
  defaultValue?: string;
  label: string;
  onSubmit: (value: string) => void;
}

export function VanishInput({ placeholders, defaultValue = "", label, onSubmit }: VanishInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [vanishing, setVanishing] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    if (value) return; // only rotate while the field is empty
    const id = window.setInterval(() => setPlaceholderIdx((i) => (i + 1) % placeholders.length), 3000);
    return () => window.clearInterval(id);
  }, [value, placeholders.length]);

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setVanishing(trimmed);
    setValue("");
    onSubmit(trimmed);
  };

  return (
    <form role="search" onSubmit={submit} className="relative mx-auto flex h-14 w-full max-w-2xl items-center overflow-hidden rounded-full border border-bone/15 bg-ink-2 pl-6 pr-2 focus-within:border-signal/70">
      <label htmlFor="library-search" className="sr-only">
        {label}
      </label>
      <input
        id="library-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        className="relative z-10 h-full flex-1 bg-transparent text-bone outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {/* Rotating placeholder */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-6 flex items-center">
        <AnimatePresence mode="wait">
          {!value && !vanishing && (
            <motion.span
              key={placeholderIdx}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-dust/80"
            >
              {placeholders[placeholderIdx]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {/* Submitted text dissolving letter by letter */}
      {vanishing && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-6 flex items-center">
          {vanishing.split("").map((ch, i) => (
            <motion.span
              key={`${vanishing}-${i}`}
              initial={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              animate={{ opacity: 0, y: -14 - (i % 3) * 6, x: (i % 2 ? 1 : -1) * 6, filter: "blur(4px)" }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
              onAnimationComplete={i === vanishing.length - 1 ? () => setVanishing(null) : undefined}
              className="whitespace-pre text-bone"
            >
              {ch}
            </motion.span>
          ))}
        </div>
      )}
      <button type="submit" disabled={!value.trim()} className="btn-solid z-10 h-10 px-4" aria-label="Search">
        Search →
      </button>
    </form>
  );
}
