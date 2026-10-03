import { useState } from "react";

interface ShareButtonProps {
  title: string;
  /** Absolute URL to share; defaults to the current page. */
  url?: string;
}

/** Native share sheet where available (mobile), otherwise copy the link. */
export function ShareButton({ title, url = window.location.href }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const share = async (): Promise<void> => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} · SpaceHub`, url });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // user closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <button type="button" className="btn-ghost" onClick={() => void share()}>
      <span aria-live="polite">{copied ? "Link copied ✓" : "Share"}</span>
    </button>
  );
}
