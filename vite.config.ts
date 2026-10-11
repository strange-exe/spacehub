import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Content-Security-Policy as a <meta> tag (GitHub Pages cannot send response headers).
 * Build-only: Vite's dev server relies on inline scripts that this policy would block.
 * frame-ancestors is header-only (ignored in <meta>), so it is left out.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: https:", // NASA imagery comes from many hosts; data: = CSS grain texture
  "media-src https:",
  "connect-src 'self' https://science.nasa.gov https://api.nasa.gov https://images-api.nasa.gov https://formsubmit.co",
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const cspMeta = (): Plugin => ({
  name: "spacehub-csp-meta",
  apply: "build",
  transformIndexHtml: () => [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: CSP }, injectTo: "head-prepend" }],
});

// Relative base + hash routing: the build works from any sub-path
// (abhinesh.codes/spacehub/, strange-exe.github.io/spacehub/, a local file server).
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), cspMeta()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // Production hardening (Vite 8 / Rolldown + Oxc). This hides source *structure*, not secrets:
  // anything shipped to the browser is public. Dev builds are unaffected.
  build: {
    sourcemap: false, // no maps, so DevTools cannot rebuild the src/ tree
    rolldownOptions: {
      output: {
        // Hash-only names: chunks no longer advertise component/hook names
        // (e.g. ApodDayView-x.js, useLatestApodDate-x.js). Hashes keep caching correct.
        entryFileNames: "assets/[hash].js",
        chunkFileNames: "assets/[hash].js",
        assetFileNames: "assets/[hash][extname]",
        // Replaces the deprecated esbuild.drop (see vite.dev/guide/migration).
        minify: { compress: { dropConsole: true, dropDebugger: true } },
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"], // e2e/ belongs to Playwright
  },
});
