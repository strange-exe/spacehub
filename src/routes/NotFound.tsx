import { Link } from "react-router";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Lost in space");
  return (
    <section className="mx-auto max-w-3xl px-6 pb-24 pt-40">
      <p className="catalog text-signal">Error 404 · no plate on file</p>
      <h1 className="mt-4 font-display text-6xl leading-none sm:text-8xl">Nothing out here but vacuum.</h1>
      <p className="mt-6 max-w-prose text-dust">The page you asked for isn’t in the archive. Try today’s plate or search the library.</p>
      <div className="mt-8 flex gap-3">
        <Link className="btn-solid" to="/">Today’s plate</Link>
        <Link className="btn-ghost" to="/gallery">Search the library</Link>
      </div>
    </section>
  );
}
