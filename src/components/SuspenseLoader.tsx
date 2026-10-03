import { Suspense, type ReactNode } from "react";

/** "Developing plate…": a scanning line instead of a generic spinner. */
export function PlateFallback({ label = "Developing plate" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto grid max-w-7xl gap-4 px-4 pt-32 sm:px-6">
      <p className="catalog">{label}…</p>
      <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-ink-2">
        <div className="absolute inset-x-0 h-px animate-scan bg-signal/70 shadow-[0_0_24px_4px_rgba(255,122,61,0.35)]" />
      </div>
    </div>
  );
}

export function SuspenseLoader({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <Suspense fallback={fallback ?? <PlateFallback />}>{children}</Suspense>;
}
