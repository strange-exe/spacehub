import { describe, expect, it } from "vitest";
import { mapSearchResponse, pickLargest } from "@/features/gallery/api/imagesApi";
import { apodPageUrl, toEmbedUrl } from "@/features/apod/lib/media";
import { toPlainText } from "@/lib/text";

describe("toPlainText", () => {
  it("strips markup and never executes it", () => {
    expect(toPlainText('Hi <a href="x">there</a><img src=x onerror=alert(1)>')).toBe("Hi there");
    expect(toPlainText("a<br>b")).toBe("a\nb");
    expect(toPlainText("<p>Date July 10, 2018</p><p>Credit</p>")).toBe("Date July 10, 2018\nCredit");
    expect(toPlainText(undefined)).toBe("");
  });
});

describe("NASA image library mappers", () => {
  it("normalises search results and skips incomplete items", () => {
    const page = mapSearchResponse(
      {
        collection: {
          items: [
            {
              data: [{ nasa_id: "PIA1", title: "<b>Orion</b>", description: "Nebula", date_created: "2001-05-02T00:00:00Z", center: "JPL" }],
              links: [{ href: "http://images-assets.nasa.gov/image/PIA1/PIA1~thumb.jpg", render: "image" }],
            },
            { data: [{ title: "no id" }], links: [] },
          ],
          links: [{ rel: "next", href: "..." }],
          metadata: { total_hits: 42 },
        },
      },
      1,
    );
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({ id: "PIA1", title: "Orion", date: "2001-05-02", thumb: "https://images-assets.nasa.gov/image/PIA1/PIA1~thumb.jpg" });
    expect(page).toMatchObject({ total: 42, nextPage: 2 });
  });
  it("prefers a large JPEG over the original", () => {
    expect(
      pickLargest({ collection: { items: [{ href: "https://x/a~orig.tif" }, { href: "https://x/a~orig.jpg" }, { href: "https://x/a~large.jpg" }, { href: "https://x/metadata.json" }] } }),
    ).toBe("https://x/a~large.jpg");
  });
});

describe("APOD media helpers", () => {
  it("builds apod.nasa.gov page URLs", () => {
    expect(apodPageUrl("2024-05-01")).toBe("https://apod.nasa.gov/apod/ap240501.html");
  });
  it("embeds only allow-listed video hosts", () => {
    expect(toEmbedUrl("https://www.youtube.com/embed/abc123?rel=0")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(toEmbedUrl("https://youtu.be/abc123")).toBe("https://www.youtube-nocookie.com/embed/abc123");
    expect(toEmbedUrl("https://player.vimeo.com/video/1")).toBe("https://player.vimeo.com/video/1");
    expect(toEmbedUrl("https://vimeo.com/123456")).toBe("https://player.vimeo.com/video/123456");
    expect(toEmbedUrl("https://evil.example/embed")).toBeNull();
  });
});
