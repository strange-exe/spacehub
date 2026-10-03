// Adapted from Aceternity UI "Resizable Navbar" (ui.aceternity.com/components/resizable-navbar).
// Changes: react-router NavLink, accessible mobile disclosure, one shared active indicator
// (layoutId) for the current route instead of hover pills.
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { NavLink, useLocation } from "react-router";
import { cn } from "@/lib/cn";

export interface NavItem {
  to: string;
  label: string;
  badge?: number;
}

export function ResizableNavbar({ items, brand }: { items: NavItem[]; brand: ReactNode }) {
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const [lastPath, setLastPath] = useState(pathname);

  // Close the mobile menu on navigation (derived during render, no effect needed).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useMotionValueEvent(scrollY, "change", (y) => setCompact(y > 48));

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3">
      <motion.nav
        aria-label="Primary"
        animate={{
          width: compact ? "min(46rem, 100%)" : "min(80rem, 100%)",
          backgroundColor: compact ? "rgba(15,17,23,0.8)" : "rgba(15,17,23,0)",
          borderColor: compact ? "rgba(236,230,217,0.12)" : "rgba(236,230,217,0)",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 32 }}
        className="relative rounded-full border px-4 py-2 backdrop-blur-md sm:px-5"
      >
        <div className="flex items-center justify-between gap-4">
          {brand}
          <ul className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "relative isolate block rounded-full px-3.5 py-1.5 text-sm transition-colors",
                      isActive ? "text-ink" : "text-bone/75 hover:text-bone",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 -z-10 rounded-full bg-bone"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      {item.label}
                      {!!item.badge && (
                        <span className={cn("ml-1.5 font-mono text-[0.7rem]", isActive ? "text-ink/70" : "text-signal")}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-ghost md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.ul
              id="mobile-nav"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute inset-x-0 top-full mt-2 grid gap-1 rounded-3xl border border-bone/10 bg-ink-2/95 p-3 backdrop-blur-md md:hidden"
            >
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn("flex justify-between rounded-2xl px-4 py-3", isActive ? "bg-bone text-ink" : "text-bone")
                    }
                  >
                    {item.label}
                    {!!item.badge && <span className="font-mono text-sm text-signal">{item.badge}</span>}
                  </NavLink>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.nav>
    </header>
  );
}
