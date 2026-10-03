import { useEffect, useState } from "react";
import type { IsoDate } from "@/lib/dates";
import { latestApodDate } from "../lib/apodDates";

/**
 * latestApodDate(), but reactive: a tab left open across midnight US Eastern picks up the new
 * day (checked every minute and whenever the tab becomes visible again).
 */
export function useLatestApodDate(): IsoDate {
  const [latest, setLatest] = useState(latestApodDate);

  useEffect(() => {
    const check = (): void => setLatest(latestApodDate()); // same string → React bails out
    const id = window.setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return latest;
}
