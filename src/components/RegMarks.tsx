import { cn } from "@/lib/cn";

/** Corner registration marks, as printed on photographic plates. Purely decorative. */
export function RegMarks({ className }: { className?: string }) {
  const corner = "absolute size-4 border-signal/80";
  return (
    <span aria-hidden className={cn("pointer-events-none absolute -inset-2", className)}>
      <span className={cn(corner, "left-0 top-0 border-l border-t")} />
      <span className={cn(corner, "right-0 top-0 border-r border-t")} />
      <span className={cn(corner, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(corner, "bottom-0 right-0 border-b border-r")} />
    </span>
  );
}
