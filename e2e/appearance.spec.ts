import { expect, test } from "@playwright/test";
import { useSavedSession } from "./helpers";

// Appearance (FE-UI-010): mode and colour theme are saved on this device and survive a reload.
// Each test has its own browser context, so nothing here leaks into other tests.

test.describe("appearance", () => {
  useSavedSession();

  test("the account menu switches mode and colour theme, and they stay", async ({ page }) => {
    const html = page.locator("html");
    await page.goto("/dashboard");
    await expect(html).toHaveAttribute("data-accent", "indigo");

    await page.getByRole("button", { name: /Account menu/ }).click();
    await page.getByRole("menuitem", { name: "Appearance" }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(html).toHaveClass(/\bdark\b/);

    await page.getByRole("button", { name: /Account menu/ }).click();
    await page.getByRole("menuitem", { name: "Appearance" }).click();
    await page.getByRole("menuitemradio", { name: "Teal" }).click();
    await expect(html).toHaveAttribute("data-accent", "teal");
    const tabIcon = page.locator('link[rel="icon"][type="image/svg+xml"]');
    await expect(tabIcon).toHaveAttribute("href", "/icons/mark-teal.svg"); // the tab icon follows

    await page.reload();
    await expect(html).toHaveClass(/\bdark\b/);
    await expect(html).toHaveAttribute("data-accent", "teal");
    await expect(tabIcon).toHaveAttribute("href", "/icons/mark-teal.svg"); // from the server too
  });

  test("the Profile tab offers the same choices", async ({ page }) => {
    const html = page.locator("html");
    await page.goto("/profile?tab=appearance");
    await page.getByRole("radio", { name: "Light" }).click();
    await expect(html).not.toHaveClass(/\bdark\b/);
    await page.getByRole("radio", { name: "Violet" }).click();
    await expect(html).toHaveAttribute("data-accent", "violet");
    await expect(page.getByRole("radio", { name: "Violet" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});

test("sign-in screens have a light / dark switch", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
});
