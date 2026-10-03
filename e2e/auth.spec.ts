import { expect, test } from "@playwright/test";
import {
  credentials,
  openAccountMenu,
  requireCredentials,
  signIn,
  uniqueEmail,
  useSavedSession,
} from "./helpers";

// Critical auth flows (docs/08-frontend §5) against the real backend.

test.describe("signed out", () => {
  test("a protected page sends you to sign in and remembers where you were going", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("a wrong password shows one message for the whole form", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(uniqueEmail("wrong"));
    await page.getByLabel("Password", { exact: true }).fill("not-the-password1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });

  test("an inactive account sees why it was signed out", async ({ page }) => {
    await page.goto("/login?reason=inactive");
    await expect(page.getByText("Your account is inactive. Contact the Admin.")).toBeVisible();
  });

  test("forgot password never reveals whether the email exists", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await page.getByLabel("Email").fill(uniqueEmail("forgot"));
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("If this email exists, a reset link has been sent.")).toBeVisible();
  });

  test("a reset link that is not valid says so and offers a new one", async ({ page }) => {
    await page.goto("/reset-password?token=not-a-real-token");
    await expect(page.getByText("This link has expired. Request a new one.")).toBeVisible();
    await page.getByRole("link", { name: "Request a new link" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("an invitation link that is not valid says so", async ({ page }) => {
    await page.goto("/accept-invitation?token=not-a-real-token");
    await expect(
      page.getByText(/This invitation link has expired or is no longer valid/),
    ).toBeVisible();
  });
});
// The password rule itself (8–16, letter + digit, confirmation) is unit-tested in
// src/features/auth/schemas.test.ts: the reset and invitation forms need a real emailed link.

test.describe("signing in and out", () => {
  test.beforeEach(() => requireCredentials());

  // Its own real sign-in: signing out revokes the session, so it must not use the shared one.
  test("sign in, see your name, sign out, and Back does not show the app", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await openAccountMenu(page);
    await expect(page.getByRole("menu")).toContainText(credentials.email);
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);

    // Sign-in and sign-out replace their history entries, so Back never lands on the app.
    await page.goBack();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toHaveCount(0);
    // And the session is really over: the app asks to sign in again.
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("signed in", () => {
  useSavedSession();

  test("change password: a wrong current password is reported on that field", async ({ page }) => {
    await page.goto("/dashboard");
    await openAccountMenu(page);
    await page.getByRole("menuitem", { name: "Change password" }).click();
    await expect(page).toHaveURL(/\/profile\?tab=password/);

    await page.getByLabel("Current password").fill("definitely-wrong-1");
    await page.getByLabel("New password").fill("NewPassw0rd");
    await page.getByLabel("Confirm password").fill("NewPassw0rd");
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(page.getByText("Current password is incorrect.")).toBeVisible();
    await expect(page.getByLabel("Current password")).toHaveAttribute("aria-invalid", "true");
  });

  test("change password: mismatched confirmation never reaches the backend", async ({ page }) => {
    await page.goto("/profile/password");
    let sent = false;
    page.on("request", (r) => r.url().includes("/api/auth/change-password") && (sent = true));

    await page.getByLabel("Current password").fill("whatever1");
    await page.getByLabel("New password").fill("NewPassw0rd");
    await page.getByLabel("Confirm password").fill("Different1");
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(page.getByText("Passwords don't match")).toBeVisible();
    expect(sent).toBe(false);
  });
});
