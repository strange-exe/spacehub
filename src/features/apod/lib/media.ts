/** apod.nasa.gov page for a given day, e.g. 2024-05-01 → ap240501.html */
export function apodPageUrl(date: string): string {
  return `https://apod.nasa.gov/apod/ap${date.slice(2).replaceAll("-", "")}.html`;
}

/** Only embed iframes from known video hosts; anything else becomes an outbound link. */
export function toEmbedUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (/(^|\.)youtube\.com$/.test(url.hostname) || url.hostname === "youtu.be") {
      const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.pathname.split("/embed/")[1] ?? url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id.split(/[?/]/)[0]}` : null;
    }
    if (/(^|\.)vimeo\.com$/.test(url.hostname)) return url.href;
    return null;
  } catch {
    return null;
  }
}
