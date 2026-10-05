import { expect, test } from "@playwright/test";
import { useSavedSession } from "./helpers";

// A versioned answer must never be reused by the browser without asking the server: otherwise a read
// after a save returns the old version, and the next save is refused as "changed by someone else".
// Reads and writes the signed-in person's own profile, and puts the name back.

test.describe("API answers and the browser cache", () => {
  useSavedSession();

  test("a read after a save returns the new version", async ({ page }) => {
    await page.goto("/login"); // any page of the app: its origin and cookies
    const result = await page.evaluate(async () => {
      const read = async () => {
        const r = await fetch("/api/backend/v1/me");
        const body = await r.json();
        return {
          etag: r.headers.get("x-etag"),
          cache: r.headers.get("cache-control"),
          name: body.data.first_name as string,
        };
      };
      const save = (etag: string, first_name: string) =>
        fetch("/api/backend/v1/me", {
          method: "PATCH",
          headers: { "content-type": "application/json", "x-if-match": etag },
          body: JSON.stringify({ first_name }),
        });
      const before = await read();
      const saved = await save(before.etag!, `${before.name}X`);
      const savedEtag = saved.headers.get("x-etag");
      const after = await read();
      await save(after.etag!, before.name); // put the name back
      return { before, savedStatus: saved.status, savedEtag, after };
    });

    expect(result.before.cache).toBe("private, no-cache");
    expect(result.before.etag).toBeTruthy();
    expect(result.savedStatus).toBe(200);
    expect(result.after.etag).toBe(result.savedEtag); // not the cached old version
    expect(result.after.name).toBe(`${result.before.name}X`);
  });
});

// Hosting edges (Vercel) answer a request carrying If-Match with their own 412 when the response's
// ETag differs, which it always does after a save. So between the browser and the app's server the
// version travels only in X-If-Match / X-ETag (the app server translates for the backend).
test.describe("version headers between the browser and the app server", () => {
  useSavedSession();

  test("a save sends X-If-Match, never If-Match; answers carry X-ETag, never ETag", async ({
    page,
  }) => {
    const seen: {
      method: string;
      ifMatch?: string;
      xIfMatch?: string;
      etag?: string;
      xEtag?: string;
      status: number;
    }[] = [];
    page.on("response", (r) => {
      if (!/\/api\/backend\/v1\/me$/.test(new URL(r.url()).pathname)) return;
      const req = r.request().headers();
      const res = r.headers();
      seen.push({
        method: r.request().method(),
        ifMatch: req["if-match"],
        xIfMatch: req["x-if-match"],
        etag: res["etag"],
        xEtag: res["x-etag"],
        status: r.status(),
      });
    });
    await page.goto("/profile");
    const first = page.getByLabel("First name");
    const original = await first.inputValue();
    await first.fill(`${original}X`);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Profile updated successfully").first()).toBeVisible();
    await first.fill(original);
    await page.getByRole("button", { name: "Save" }).click();
    await expect.poll(() => seen.filter((s) => s.method === "PATCH").length).toBe(2);

    for (const s of seen) {
      expect(s.ifMatch, `${s.method} must not send If-Match`).toBeUndefined();
      expect(s.etag, `${s.method} answer must not carry ETag`).toBeUndefined();
    }
    for (const s of seen.filter((x) => x.method === "PATCH")) {
      expect(s.status).toBe(200);
      expect(s.xIfMatch).toBeTruthy();
      expect(s.xEtag).toBeTruthy();
    }
  });
});
