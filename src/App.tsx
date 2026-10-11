import { lazy } from "react";
import { HashRouter, Route, Routes } from "react-router";
import { MotionConfig } from "motion/react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Layout } from "@/components/Layout";
import { storageKey } from "@/lib/storage";
import { apodQuery } from "@/features/apod/hooks/useApod";
import { latestApodDate } from "@/features/apod/lib/apodDates";

const Home = lazy(() => import("@/routes/Home"));
const ApodDay = lazy(() => import("@/routes/ApodDay"));
const Gallery = lazy(() => import("@/routes/Gallery"));
const Favorites = lazy(() => import("@/routes/Favorites"));
const About = lazy(() => import("@/routes/About"));
const Contact = lazy(() => import("@/routes/Contact"));
const NotFound = lazy(() => import("@/routes/NotFound"));

const WEEK = 7 * 24 * 3_600_000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: WEEK, // must be >= persister maxAge or restored data is dropped immediately
      retry: (count, error) => count < 2 && !("status" in error && [400, 404, 429].includes(error.status as number)),
      refetchOnWindowFocus: false,
    },
  },
});

function safeLocalStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined; // persister becomes a no-op in locked-down browsers
  }
}

const persister = createSyncStoragePersister({ storage: safeLocalStorage(), key: storageKey("query-cache") });

// Render-as-you-fetch for the landing page: today's plate is the LCP element, and its API call
// is the slowest step (~1 s). Start it now instead of after the lazy route chunk has loaded.
// Skipped when the persisted cache (restored a moment later) already holds today's plate.
if (/^#?\/?$/.test(window.location.hash)) {
  const today = latestApodDate();
  const cached = safeLocalStorage()?.getItem(storageKey("query-cache"))?.includes(`["apod","${today}"]`);
  if (!cached) void queryClient.prefetchQuery(apodQuery(today));
}

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: WEEK,
        buster: "v4", // bump whenever a persisted data shape (e.g. Apod) changes
        // Only APOD days and asset manifests are worth persisting; search pages would bloat storage.
        dehydrateOptions: {
          shouldDehydrateQuery: (q) =>
            q.state.status === "success" && (q.queryKey[0] === "apod" || q.queryKey[0] === "asset"),
        },
      }}
    >
      <MotionConfig reducedMotion="user">
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="apod/:date" element={<ApodDay />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </MotionConfig>
    </PersistQueryClientProvider>
  );
}
