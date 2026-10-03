import { Link } from "react-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SuspenseLoader } from "@/components/SuspenseLoader";
import { addDays, formatLong, type IsoDate } from "@/lib/dates";
import { ApiError, describeError } from "@/lib/http";
import { APOD_EPOCH, latestApodDate, plateNumber, randomApodDate } from "../lib/apodDates";
import { apodPageUrl } from "../lib/media";
import { ApodPlate } from "./ApodPlate";

const dayRoute = (d: IsoDate): string => (d === latestApodDate() ? "/" : `/apod/${d}`);

/** A plate wrapped in its own boundary, so a missing day still offers a way onward. */
export function ApodDayView({ date }: { date: IsoDate }) {
  return (
    <ErrorBoundary
      resetKey={date}
      fallback={({ error, retry }) => <MissingPlate date={date} error={error} retry={retry} />}
    >
      <SuspenseLoader>
        <ApodPlate date={date} />
      </SuspenseLoader>
    </ErrorBoundary>
  );
}

function MissingPlate({ date, error, retry }: { date: IsoDate; error: unknown; retry: () => void }) {
  const latest = latestApodDate();
  const notPublished = error instanceof ApiError && error.status === 404;
  // Today's post usually appears a few minutes after midnight US Eastern; that's "not yet", not a gap.
  const notYet = notPublished && date === latest;
  const { title, hint } = notYet
    ? { title: "Today’s plate is still developing.", hint: "NASA publishes shortly after midnight US Eastern time. Try again in a few minutes, or see yesterday’s plate." }
    : notPublished
      ? { title: "No plate on file for this day.", hint: "APOD skipped a few days, mostly in its first weeks in 1995. Try a neighbouring day." }
      : describeError(error);
  const canRetry = !notPublished || notYet;

  return (
    <section role="alert" className="mx-auto max-w-3xl px-6 pb-24 pt-36">
      <p className="catalog text-signal">
        Plate № {plateNumber(date).toLocaleString("en-US")} · {formatLong(date)}
      </p>
      <h1 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">{title}</h1>
      <p className="mt-4 max-w-prose text-dust">{hint}</p>
      <div className="mt-8 flex flex-wrap gap-2">
        {date > APOD_EPOCH && (
          <Link className="btn-ghost" to={dayRoute(addDays(date, -1))}>
            ← Previous day
          </Link>
        )}
        {date < latest && (
          <Link className="btn-ghost" to={dayRoute(addDays(date, 1))}>
            Next day →
          </Link>
        )}
        <Link className="btn-ghost" to={dayRoute(randomApodDate(latest))}>
          Random plate
        </Link>
        {canRetry && (
          <button type="button" className="btn-solid" onClick={retry}>
            Try again
          </button>
        )}
        <a className="btn-ghost" href={apodPageUrl(date)} target="_blank" rel="noreferrer">
          Check on NASA ↗
        </a>
      </div>
    </section>
  );
}
