import { readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The signed-in tests need a real backend user: E2E_EMAIL / E2E_PASSWORD from .env, or else the
// backend's first Admin (FIRST_ADMIN_EMAIL / FIRST_ADMIN_PASSWORD in ../backend/.env), so the
// password lives in one place.
try {
  process.loadEnvFile(".env");
} catch {
  // CI provides the variables directly.
}
if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
  try {
    const backend = readFileSync("../backend/.env", "utf8");
    const read = (name: string) =>
      backend
        .match(new RegExp(`^${name}=(.*)$`, "m"))?.[1]
        ?.trim()
        .replace(/^"|"$/g, "");
    process.env.E2E_EMAIL ||= read("FIRST_ADMIN_EMAIL");
    process.env.E2E_PASSWORD ||= read("FIRST_ADMIN_PASSWORD");
  } catch {
    // No backend checkout next to this one: signed-in tests are skipped.
  }
}

// Its own port, so a running `pnpm dev` on 3000 is never touched.
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  workers: 1, // one backend, shared rate limits
  retries: 0, // a retried sign-in counts against the backend's login rate limit
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    // Signs in ONCE per run and saves the session; if that fails, nothing else runs.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
    { name: "phone", use: { ...devices["Pixel 7"] }, dependencies: ["setup"] },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { APP_ORIGIN: baseURL }, // the origin check must match this port (FE-AUTH-007)
  },
});
