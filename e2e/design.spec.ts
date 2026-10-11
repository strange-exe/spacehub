import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Design verification pass: screenshots, axe (WCAG 2.2 AA), overflow, console/network errors,
 * H1 line count and LCP for every key page at desktop and mobile size.
 *
 *   SHOTS=before npx playwright test   # baseline
 *   SHOTS=after  npx playwright test   # after changes (default)
 *   STRICT=1 ...                       # fail on any finding instead of only reporting it
 */
const PHASE = process.env.SHOTS ?? "after";
const STRICT = process.env.STRICT === "1";
const OUT = `e2e/shots/${PHASE}`;
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: "home", path: "/" },
  { name: "plate-long-title", path: "#/apod/2026-10-02" }, // "The Complete Sharpless Catalog: 313 Nebulas"
  { name: "plate-video", path: "#/apod/2018-07-10" },
  { name: "library", path: "#/gallery?q=nebula" },
  { name: "about", path: "#/about" },
  { name: "saved", path: "#/favorites" },
  { name: "contact", path: "#/contact" },
] as const;

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

interface PageReport {
  page: string;
  viewport: string;
  axe: string[];
  overflow: boolean;
  errors: string[];
  h1: { text: string; lines: number } | null;
  lcpMs: number | null;
}
const report: PageReport[] = [];

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  page.on("requestfailed", (r) => {
    const reason = r.failure()?.errorText ?? "";
    // Aborted image/media preloads (navigating away mid-download) are benign; list everything else.
    if (!/ERR_ABORTED/.test(reason)) errors.push(`failed: ${r.url()} ${reason}`);
  });
  return errors;
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(800); // let entrance transitions finish before measuring
}

/** Scroll through the page like a visitor so lazy images load and scroll reveals play. */
async function scrollThrough(page: Page): Promise<void> {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(120);
  }
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(400);
}

for (const vp of VIEWPORTS) {
  for (const target of PAGES) {
    test(`${target.name} @ ${vp.name}`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(target.path);
      await settle(page);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      const h1 = await page.evaluate(() => {
        const el = document.querySelector("h1");
        if (!el) return null;
        const lh = parseFloat(getComputedStyle(el).lineHeight) || 1;
        return { text: el.textContent?.trim() ?? "", lines: Math.round(el.getBoundingClientRect().height / lh) };
      });
      const lcpMs = await page.evaluate(
        () =>
          new Promise<number | null>((resolve) => {
            let last: number | null = null;
            new PerformanceObserver((list) => {
              for (const e of list.getEntries()) last = e.startTime;
            }).observe({ type: "largest-contentful-paint", buffered: true });
            setTimeout(() => resolve(last === null ? null : Math.round(last)), 300);
          }),
      );
      // After measuring LCP (scrolling ends LCP collection): reveal lazy content, then audit it.
      await scrollThrough(page);
      // Freeze the page's own errors before axe runs: axe re-fetches cross-origin stylesheets
      // (Google Fonts) with XHR, which the CSP's connect-src correctly blocks. That is the
      // audit tool's request, not something visitors ever trigger.
      const pageErrors = [...errors];
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        // YouTube/Vimeo player markup inside the embed is third-party and outside our control
        // (e.g. YouTube's aria-level on <a>, aria-label on a role-less div). Our own page is still scanned.
        .exclude('iframe[src*="youtube-nocookie.com"]')
        .exclude('iframe[src*="player.vimeo.com"]')
        .analyze();

      await page.screenshot({ path: `${OUT}/${target.name}-${vp.name}.png`, fullPage: true, animations: "disabled" });

      report.push({
        page: target.name,
        viewport: vp.name,
        axe: axe.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}`),
        overflow,
        errors: pageErrors,
        h1,
        lcpMs,
      });

      if (STRICT) {
        expect(axe.violations.map((v) => v.id)).toEqual([]);
        expect(overflow).toBe(false);
        expect(pageErrors).toEqual([]);
      }
    });
  }
}

test("home hierarchy: grayscale + blur", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await settle(page);
  // Via the CSSOM, not addStyleTag: the production CSP (correctly) blocks injected <style> tags.
  for (const [name, filter] of [["gray", "grayscale(1)"], ["blur", "blur(6px)"]] as const) {
    await page.evaluate((f) => (document.documentElement.style.filter = f), filter);
    await page.screenshot({ path: `${OUT}/home-hierarchy-${name}.png`, animations: "disabled" });
  }
  await page.evaluate(() => (document.documentElement.style.filter = ""));
});

test("home reduced motion and light scheme render", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await settle(page);
  await expect(page.locator("h1")).toBeVisible();
  await page.screenshot({ path: `${OUT}/home-reduced-motion-light.png`, animations: "disabled" });
});

test.afterAll(() => {
  writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
});
