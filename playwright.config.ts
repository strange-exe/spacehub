import { defineConfig } from "@playwright/test";

const PORT = 4319;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  fullyParallel: false, // NASA's APIs are shared and rate-limited; keep requests sequential
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    colorScheme: "dark",
  },
  // Playwright owns the server so it is torn down with the run.
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
