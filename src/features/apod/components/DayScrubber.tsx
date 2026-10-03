import { useMemo, type KeyboardEvent } from "react";
import { addDays, daysBetween, formatLong, type IsoDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { APOD_EPOCH } from "../lib/apodDates";

const WINDOW = 45;

interface DayScrubberProps {
  date: IsoDate;
  latest: IsoDate;
  onChange: (date: IsoDate) => void;
}

/**
 * A strip of day ticks around the current plate. Exposed to assistive tech as ONE slider
 * (arrow keys / PageUp / Home / End) rather than 45 separate tab stops.
 */
export function DayScrubber({ date, latest, onChange }: DayScrubberProps) {
  const ticks = useMemo(() => {
    const total = daysBetween(APOD_EPOCH, latest);
    const offset = Math.min(Math.max(daysBetween(APOD_EPOCH, date) - Math.floor(WINDOW / 2), 0), Math.max(total - WINDOW + 1, 0));
    const start = addDays(APOD_EPOCH, offset);
    return Array.from({ length: Math.min(WINDOW, total + 1) }, (_, i) => addDays(start, i));
  }, [date, latest]);

  const move = (delta: number): void => {
    const next = addDays(date, delta);
    onChange(next < APOD_EPOCH ? APOD_EPOCH : next > latest ? latest : next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const map: Record<string, () => void> = {
      ArrowLeft: () => move(-1),
      ArrowDown: () => move(-1),
      ArrowRight: () => move(1),
      ArrowUp: () => move(1),
      PageDown: () => move(-7),
      PageUp: () => move(7),
      Home: () => onChange(APOD_EPOCH),
      End: () => onChange(latest),
    };
    const action = map[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Archive day"
      aria-valuemin={0}
      aria-valuemax={daysBetween(APOD_EPOCH, latest)}
      aria-valuenow={daysBetween(APOD_EPOCH, date)}
      aria-valuetext={formatLong(date)}
      onKeyDown={onKeyDown}
      className="group relative flex h-14 items-end justify-between gap-px rounded-md px-1 outline-offset-4"
    >
      {ticks.map((d) => {
        const current = d === date;
        const monthStart = d.endsWith("-01");
        return (
          // Plain spans (not buttons): a clicked tick must not take focus while aria-hidden.
          // Pointer users click ticks; keyboard/AT users operate the slider itself.
          <span
            key={d}
            aria-hidden
            title={formatLong(d)}
            onPointerDown={(e) => {
              e.preventDefault(); // keep focus on the slider, not the page body
              e.currentTarget.closest<HTMLElement>("[role=slider]")?.focus();
              onChange(d);
            }}
            className="relative flex h-full flex-1 cursor-pointer items-end justify-center"
          >
            <span
              className={cn(
                "w-px transition-all duration-300",
                current ? "h-full w-0.5 bg-signal" : monthStart ? "h-8 bg-bone/60" : "h-4 bg-bone/25 hover:h-6 hover:bg-bone/70",
              )}
            />
            {monthStart && !current && (
              <span className="catalog absolute -top-1 left-1/2 -translate-x-1/2 text-[0.6rem]">
                {new Date(`${d}T00:00:00Z`).toLocaleString("en", { month: "short", timeZone: "UTC" })}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
