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
          etag: r.headers.get("etag"),
          cache: r.headers.get("cache-control"),
          name: body.data.first_name as string,
        };
      };
      const save = (etag: string, first_name: string) =>
        fetch("/api/backend/v1/me", {
          method: "PATCH",
          headers: { "content-type": "application/json", "if-match": etag },
          body: JSON.stringify({ first_name }),
        });
      const before = await read();
      const saved = await save(before.etag!, `${before.name}X`);
      const savedEtag = saved.headers.get("etag");
      const after = await read();
      await save(after.etag!, before.name); // put the name back
      return { before, savedStatus: saved.status, savedEtag, after };
    });

    expect(result.before.cache).toBe("private, no-cache");
    expect(result.savedStatus).toBe(200);
    expect(result.after.etag).toBe(result.savedEtag); // not the cached old version
    expect(result.after.name).toBe(`${result.before.name}X`);
  });
});
