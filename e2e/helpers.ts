import { expect, type Page, test } from "@playwright/test";

export const credentials = {
  email: process.env.E2E_EMAIL ?? "",
  password: process.env.E2E_PASSWORD ?? "",
};

/** Session saved by auth.setup.ts (git-ignored). */
export const SESSION_FILE = "e2e/.auth/session.json";

/**
 * For a describe block of signed-in tests: reuse the setup's session instead of signing in.
 * (Skips are decided before setup runs, so they depend on the credentials, not on the file.)
 */
export function useSavedSession() {
  test.skip(!credentials.email || !credentials.password, "No E2E user configured");
  test.use({ storageState: SESSION_FILE });
}

/** Skips the current test when no backend user is configured for end-to-end runs. */
export function requireCredentials() {
  test.skip(!credentials.email || !credentials.password, "No E2E user configured");
}

/** A fresh address per run, so backend rate limits (per email) never make a test flaky. */
export const uniqueEmail = (label: string) => `e2e-${label}-${Date.now()}@example.com`;

/** A real sign-in. Only for tests about signing in or out; others use the saved session. */
export async function signIn(page: Page, next = "/dashboard") {
  await page.goto(next);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(next));
}

export async function openAccountMenu(page: Page) {
  await page.getByRole("button", { name: /Account menu/ }).click();
}
