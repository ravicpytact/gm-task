import { expect, test as setup } from "@playwright/test";
import { credentials, SESSION_FILE } from "./helpers";

// One sign-in per run, reused by the signed-in tests. A wrong password then costs one failed
// attempt, not one per test, and the backend's login rate limit is never tripped by the suite.
setup("sign in once", async ({ page }) => {
  setup.skip(!credentials.email || !credentials.password, "No E2E user configured");

  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  const refused = page.getByText(/Invalid email or password|Too many attempts|inactive/);
  await expect(page.getByRole("heading", { level: 1, name: /^(Hi, .+|Dashboard)$/ }).or(refused)).toBeVisible();
  if (await refused.isVisible()) {
    throw new Error(
      `Sign-in refused: "${await refused.textContent()}". Check FIRST_ADMIN_PASSWORD in ` +
        "backend/.env (or E2E_PASSWORD in frontend/.env). Not retrying, to avoid the rate limit.",
    );
  }
  await page.context().storageState({ path: SESSION_FILE });
});
