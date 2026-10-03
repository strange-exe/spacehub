# SpaceHub: a plate archive of the cosmos

SpaceHub presents NASA's **Astronomy Picture of the Day** as a numbered photographic plate
(Plate № 1 = 16 June 1995) that you can walk day by day, alongside a searchable view of the
**NASA Image and Video Library**.

### [Live demo](https://abhinesh.codes/spacehub/)

## Features

- **Today's plate** with full explanation, credit, HD original and video support (YouTube via the privacy-enhanced domain)
- **Archive navigation**: previous/next, date picker, keyboard (← →), a day-scrubber slider, and "random plate"
- **Library search** with topic chips, URL-synced queries (`#/gallery?q=saturn`), and "load more"
- **Accessible lightbox** built on native `<dialog>`: focus trap, Esc/backdrop to close, ← → to browse, progressive full-resolution loading
- **Saved plates**: favourites stored locally in your browser (namespaced `spacehub:*` keys only)
- Respects `prefers-reduced-motion`; skip link; keyboard-reachable everything
- Old URLs (`gallery.html`, `about.html`, …) redirect to their new routes

## Where the APOD data comes from (important)

`apod.nasa.gov` now 301-redirects every page to `science.nasa.gov`, and as of October 2026 the
official `api.nasa.gov/planetary/apod` endpoint returns a placeholder (`"NASA Science"` + the NASA
logo) for every date. SpaceHub therefore uses a **source chain**:

1. **science.nasa.gov WordPress REST API** (primary): public and CORS-enabled, no key needed. It is *not* a documented public API, so all knowledge of its shape lives in `src/features/apod/api/sources/scienceNasa.ts`.
2. **api.nasa.gov APOD API** (fallback).

Every response is validated (`isPlaceholderApod`), so a `200 OK` with junk is never shown.

## Tech stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · Motion · TanStack Query (with a
localStorage persister) · React Router (hash routing) · Vitest. Navbar, spotlight, focus cards and
the search input are adapted from [Aceternity UI](https://ui.aceternity.com).

```
src/
  components/        Layout, Lightbox, error/suspense boundaries, ui/ (Aceternity adaptations)
  features/apod      data sources, plate, scrubber, date logic
  features/gallery   NASA Image Library API + results grid
  features/favorites localStorage-backed store (useSyncExternalStore)
  routes/            lazy-loaded pages, the only layer that composes features
  lib/               dates, namespaced storage, HTTP errors, plain-text sanitiser
```

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (dates, adapters, storage, sanitiser)
npm run lint && npm run typecheck
npm run build      # static output in dist/, works from any sub-path
```

Optional: copy `.env.example` to `.env` and set `VITE_NASA_API_KEY` (free at
[api.nasa.gov](https://api.nasa.gov)). It is only used by the fallback source and ends up in the
public bundle, so never put a real secret in a `VITE_*` variable.

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` lints, tests, builds and deploys on every push to `main`.
One-time setup: **Settings → Pages → Source: GitHub Actions**, and optionally add the
`NASA_API_KEY` repository secret.

---

Imagery and text © their respective owners; most NASA material is public domain. SpaceHub is not affiliated with NASA.
