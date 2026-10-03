/**
 * NASA descriptions sometimes contain raw HTML (<a>, <br>, entities). We render them as
 * plain text so nothing from the API is ever interpreted as markup.
 */
export function toPlainText(input: string | undefined | null): string {
  if (!input) return "";
  // textContent joins adjacent blocks with no separator ("…2018</p><p>Credit" → "2018Credit"),
  // so end every block element with a newline before parsing.
  const spaced = input.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(?:p|div|li|h[1-6]|tr|blockquote)>/gi, "$&\n");
  const doc = new DOMParser().parseFromString(spaced, "text/html");
  return (doc.body.textContent ?? "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
