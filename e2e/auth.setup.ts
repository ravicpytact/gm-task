import { expect, test as setup, type Page } from "@playwright/test";
import { credentials, SESSION_FILE, USER_SESSION_FILE, userCredentials } from "./helpers";

// One sign-in per account per run, reused by the signed-in tests. A wrong password then costs one
// failed attempt, not one per test, and the backend's login rate limit is never tripped by the suite.

async function signInAndSave(
  page: Page,
  account: { email: string; password: string },
  file: string,
  hint: string,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  const refused = page.getByText(/Invalid email or password|Too many attempts|inactive/);
  // Signed in: the Todos screen, or a new account's welcome card over it.
  const signedIn = page
    .getByRole("heading", { level: 1, name: /^(Hi, .+|Todos)$/ })
    .or(page.getByRole("dialog", { name: /^Welcome to / }));
  await expect(signedIn.or(refused)).toBeVisible({ timeout: 15_000 }); // a fresh start can be slow
  if (await refused.isVisible()) {
    throw new Error(
      `Sign-in refused: "${await refused.textContent()}". ${hint} Not retrying, to avoid the rate limit.`,
    );
  }
  await page.context().storageState({ path: file });
}

setup("sign in once", async ({ page }) => {
  setup.skip(!credentials.email || !credentials.password, "No E2E user configured");
  await signInAndSave(
    page,
    credentials,
    SESSION_FILE,
    "Check FIRST_ADMIN_PASSWORD in backend/.env (or E2E_PASSWORD in frontend/.env).",
  );
});

setup("sign in once as the User account", async ({ page }) => {
  setup.skip(!userCredentials.email || !userCredentials.password, "No E2E User account configured");
  await signInAndSave(
    page,
    userCredentials,
    USER_SESSION_FILE,
    "Check E2E_USER_EMAIL / E2E_USER_PASSWORD in frontend/.env.",
  );
  // A test account may be new: skip its welcome card once (recorded on the account), so it never
  // covers the screens under test.
  const skip = page
    .getByRole("dialog", { name: /^Welcome to / })
    .getByRole("button", { name: "Skip" });
  if (await skip.isVisible()) {
    await skip.click();
    await expect(skip).toBeHidden();
  }
});
