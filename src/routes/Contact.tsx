import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

// FormSubmit AJAX endpoint. Recommended: replace the address with the random alias FormSubmit
// emails you after first activation, so the inbox isn't visible in the public bundle.
const ENDPOINT = "https://formsubmit.co/ajax/work.abhinesh@gmail.com";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export default function Contact() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  useDocumentTitle("Contact");

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (data._honey) return; // bot filled the hidden field
    setStatus({ kind: "sending" });
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...data, _subject: "SpaceHub: new message", _template: "table" }),
      });
      const body = (await res.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
      if (!res.ok || String(body.success) !== "true") throw new Error(body.message ?? `HTTP ${res.status}`);
      form.reset();
      setStatus({ kind: "sent" });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  };

  return (
    <section className="mx-auto grid max-w-6xl gap-14 px-4 pb-24 pt-32 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <p className="catalog text-signal">Contact</p>
        <h1 className="mt-3 font-display text-6xl leading-[0.95] sm:text-7xl">
          Send a signal <em className="text-dust">into the void.</em>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-bone/80">
          Found a bug, have an idea for a feature, or spotted a plate that deserves a closer look? Messages go straight to the
          maintainer’s inbox.
        </p>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {status.kind === "sent" ? (
            <motion.div
              key="sent"
              role="status"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-signal/40 bg-ink-2 p-8"
            >
              <p className="catalog text-signal">Transmission received</p>
              <p className="mt-3 font-display text-4xl">Thank you. We’ll reply soon.</p>
              <button type="button" className="btn-ghost mt-6" onClick={() => setStatus({ kind: "idle" })}>
                Send another
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" exit={{ opacity: 0 }} onSubmit={submit} className="grid gap-5 rounded-3xl border border-bone/10 bg-ink-2/60 p-6 sm:p-8">
              <label className="grid gap-2">
                <span className="catalog">Name</span>
                <input name="name" required autoComplete="name" className="field" />
              </label>
              <label className="grid gap-2">
                <span className="catalog">Email</span>
                <input name="email" type="email" required autoComplete="email" className="field" />
              </label>
              <label className="grid gap-2">
                <span className="catalog">Message</span>
                <textarea name="message" required rows={6} minLength={10} className="field resize-y" />
              </label>
              {/* Honeypot: hidden from people, tempting to bots. */}
              <input type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
              {status.kind === "error" && (
                <p role="alert" className="text-sm text-signal">
                  Couldn’t send ({status.message}). Please try again in a moment.
                </p>
              )}
              <button type="submit" className="btn-solid justify-self-start" disabled={status.kind === "sending"}>
                {status.kind === "sending" ? "Transmitting…" : "Send message"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
