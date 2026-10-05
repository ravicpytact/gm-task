// One-off live diagnosis: signs in as the test user from .env.local, saves its own name and puts it back.
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^LIVE_[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]),
);
const base = env.LIVE_URL.replace(/\/+$/, "");
const SHOW = ["etag", "x-etag", "cache-control", "server", "x-vercel-id", "x-vercel-cache", "x-request-id", "content-type"];
const log = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on("response", async (r) => {
  const u = new URL(r.url());
  if (!u.pathname.startsWith("/api/backend/v1/me") || u.pathname.includes("permissions")) return;
  const req = r.request();
  const h = r.headers();
  let body = "";
  if (r.status() >= 300) body = (await r.text().catch(() => "")).slice(0, 160).replace(/\s+/g, " ");
  log.push(
    `${req.method()} ${u.pathname} -> ${r.status()} | sent If-Match=${req.headers()["if-match"] ?? "-"} X-If-Match=${req.headers()["x-if-match"] ?? "-"} | ` +
      SHOW.filter((k) => h[k]).map((k) => `${k}=${h[k]}`).join(" ; ") +
      (body ? ` | body: ${body || "(empty)"}` : ""),
  );
});

let original = null;
try {
  log.push("=== sign in");
  await page.goto(`${base}/login`);
  await page.getByLabel("Email").fill(env.LIVE_E2E_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(env.LIVE_E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  const skip = page.getByRole("button", { name: "Skip" });
  if (await skip.isVisible({ timeout: 4000 }).catch(() => false)) await skip.click();

  log.push("=== 1) by hand: read, change the name, read again");
  const manual = await page.evaluate(async () => {
    const read = async () => {
      const r = await fetch("/api/backend/v1/me", { cache: "no-store" });
      return { etag: r.headers.get("x-etag") ?? r.headers.get("etag"), name: (await r.json()).data.first_name };
    };
    const before = await read();
    const r = await fetch("/api/backend/v1/me", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-if-match": before.etag },
      body: JSON.stringify({ first_name: `${before.name}X` }),
    });
    const after = await read();
    return { before, status: r.status, after };
  });
  original = manual.before.name;
  log.push(
    `result: save answered ${manual.status}; name before "${manual.before.name}", now on the server "${manual.after.name}"` +
      ` -> ${manual.status !== 200 && manual.after.name !== manual.before.name ? "SAVED, BUT REPORTED AS AN ERROR" : manual.status === 200 ? "ok" : "refused, not saved"}`,
  );

  log.push("=== 2) through the Profile screen");
  await page.goto(`${base}/profile`);
  const first = page.getByLabel("First name");
  await first.waitFor();
  await first.fill(`${original}Y`);
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForTimeout(3000);
  log.push(`toasts: ${JSON.stringify(await page.locator("[data-sonner-toast]").allInnerTexts())}`);
} catch (e) {
  log.push(`stopped: ${e.message.split("\n")[0]}`);
} finally {
  if (original !== null) {
    const restored = await page.evaluate(async (name) => {
      const r0 = await fetch("/api/backend/v1/me", { cache: "no-store" });
      const etag = (r0.headers.get("x-etag") ?? r0.headers.get("etag"));
      const r = await fetch("/api/backend/v1/me", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-if-match": etag },
        body: JSON.stringify({ first_name: name }),
      });
      const check = await (await fetch("/api/backend/v1/me", { cache: "no-store" })).json();
      return `${r.status}, name now "${check.data.first_name}"`;
    }, original);
    log.push(`=== restore name "${original}": ${restored}`);
  }
  console.log(log.join("\n"));
  await browser.close();
}
