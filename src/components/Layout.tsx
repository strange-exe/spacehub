import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { ResizableNavbar } from "@/components/ui/resizable-navbar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SuspenseLoader } from "@/components/SuspenseLoader";
import { useFavorites } from "@/features/favorites/hooks/useFavorites";

export function Layout() {
  const { pathname } = useLocation();
  const { items } = useFavorites();

  // Declarative routers have no <ScrollRestoration>; start each page at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-bone px-3 py-2 text-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <ResizableNavbar
        brand={
          <Link to="/" className="flex items-baseline gap-2" aria-label="SpaceHub home">
            <span className="font-display text-2xl leading-none text-bone">SpaceHub</span>
            <span className="catalog hidden sm:inline">Plate Archive</span>
          </Link>
        }
        items={[
          { to: "/", label: "Today" },
          { to: "/gallery", label: "Library" },
          { to: "/favorites", label: "Saved", badge: items.length },
          { to: "/about", label: "About" },
          { to: "/contact", label: "Contact" },
        ]}
      />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <ErrorBoundary resetKey={pathname}>
          <SuspenseLoader>
            <Outlet />
          </SuspenseLoader>
        </ErrorBoundary>
      </main>
      <footer className="border-t border-bone/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-dust sm:flex-row sm:justify-between sm:px-6">
          <p>
            Imagery and text: <a className="link" href="https://apod.nasa.gov/apod/">NASA APOD</a> and the{" "}
            <a className="link" href="https://images.nasa.gov">NASA Image and Video Library</a>. Not affiliated with
            NASA.
          </p>
          <p className="catalog">© {new Date().getFullYear()} SpaceHub</p>
        </div>
      </footer>
    </div>
  );
}
