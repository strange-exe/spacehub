/**
 * NASA descriptions sometimes contain raw HTML (<a>, <br>, entities). We render them as
 * plain text so nothing from the API is ever interpreted as markup.
 */
export function toPlainText(input: string | undefined | null): string {
  if (!input) return "";
  const doc = new DOMParser().parseFromString(input.replace(/<br\s*\/?>/gi, "\n"), "text/html");
  return (doc.body.textContent ?? "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
