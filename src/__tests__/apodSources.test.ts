import { describe, expect, it } from "vitest";
import { isPlaceholderApod } from "@/features/apod/api/apodApi";
import { mapScienceArticle, type RawArticle } from "@/features/apod/api/sources/scienceNasa";

// Trimmed from a real science.nasa.gov response (2026-10-03), structure preserved.
const imageDay: RawArticle = {
  date: "2026-10-03T00:05:00",
  slug: "apod-2026-october-3-selfie-at-vera-rubin-ridge",
  title: { rendered: "APOD: 2026 October 3 &#8211; Selfie at Vera Rubin Ridge" },
  content: {
    rendered:
      "<nav>APOD</nav><p>Selfie at Vera Rubin Ridge</p><p><strong>Explanation:</strong> On sol 1943 of its journey…</p>" +
      "<p>Tomorrow&#8217;s picture: x</p><p>Date October 3, 2026</p><p>Credit: Image Credit: <a>NASA</a> , JPL-Caltech , MSSS &#8211; Panorama: Andrew Bodrov</p>" +
      "<p>Authors &amp; editors: Jerry Bonnell</p>",
  },
  _embedded: {
    "wp:featuredmedia": [
      {
        source_url: "https://assets.science.nasa.gov/a/Sol1943.jpg",
        alt_text: "Fisheye image of the Curiosity rover.",
        caption: { rendered: "<p><strong>Explanation:</strong> Excerpt only […]</p>" },
      },
    ],
  },
};

describe("science.nasa.gov adapter", () => {
  it("maps an image day", () => {
    expect(mapScienceArticle(imageDay)).toMatchObject({
      date: "2026-10-03",
      title: "Selfie at Vera Rubin Ridge",
      explanation: "On sol 1943 of its journey…",
      media_type: "image",
      url: "https://assets.science.nasa.gov/a/Sol1943.jpg",
      hdurl: "https://assets.science.nasa.gov/a/Sol1943.jpg",
      credit: "NASA, JPL-Caltech, MSSS – Panorama: Andrew Bodrov",
      alt: "Fisheye image of the Curiosity rover.",
      source: "science.nasa.gov",
    });
  });
  it("detects video days from the embedded iframe", () => {
    const video = mapScienceArticle({
      ...imageDay,
      content: { rendered: '<iframe src="https://www.youtube.com/embed/UgxWkOXcdZU?feature=oembed"></iframe><p>Explanation: Saturn.</p><p>Credit: Video Credit: NASA</p><p>Authors &amp; editors: x</p>' },
    });
    expect(video).toMatchObject({ media_type: "video", url: "https://www.youtube.com/embed/UgxWkOXcdZU?feature=oembed", thumbnail_url: "https://assets.science.nasa.gov/a/Sol1943.jpg", credit: "NASA" });
  });
});

describe("placeholder detection", () => {
  const base = { date: "2026-10-03", explanation: "x", media_type: "image" as const, source: "api.nasa.gov" as const };
  it("flags the broken official API payload", () => {
    expect(isPlaceholderApod({ ...base, title: "NASA Science", url: "https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png" })).toBe(true);
  });
  it("accepts real entries", () => {
    expect(isPlaceholderApod({ ...base, title: "Selfie at Vera Rubin Ridge", url: "https://assets.science.nasa.gov/a.jpg" })).toBe(false);
  });
});
