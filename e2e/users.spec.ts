import { expect, test, type Page } from "@playwright/test";
import { credentials, openAccountMenu, uniqueEmail, useSavedSession } from "./helpers";

// User List (Screens 12–15) and My Profile (10–11) against the real backend.
// These tests never change existing users: the only user they create is a throwaway invitation,
// which they delete again; the deactivate and delete dialogs are opened and cancelled.

const visible = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true });

test.describe("users, as Admin", () => {
  useSavedSession();

  test("the list shows the signed-in Admin, without Deactivate or Delete on their own row", async ({
    page,
  }) => {
    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await page.getByRole("searchbox", { name: "Search users" }).fill(credentials.email);
    await expect(page).toHaveURL(/search=/);
    await expect(visible(page, credentials.email).first()).toBeVisible();

    const ownActions = page.getByRole("button", { name: /^Actions for / }).first();
    if (await ownActions.count()) {
      await ownActions.click();
      await expect(page.getByRole("menuitem", { name: "Deactivate" })).toHaveCount(0);
      await expect(page.getByRole("menuitem", { name: "Delete" })).toHaveCount(0);
      await page.keyboard.press("Escape");
    }
  });

  test("search and filters live in the URL and survive a reload", async ({ page }) => {
    await page.goto("/users");
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Invited" }).click();
    await expect(page).toHaveURL(/status=INVITED/);
    await page.reload();
    await expect(page.getByRole("combobox", { name: "Status" })).toContainText("Invited");
  });

  test("the role filter uses the readable role code in the URL", async ({ page }) => {
    await page.goto("/users");
    await page.getByRole("combobox", { name: "Role" }).click();
    await page.getByRole("option", { name: "Admin" }).click();
    await expect(page).toHaveURL(/role=ADMIN/);
    // The signed-in Admin is in the Admin-filtered list; the backend understood the code.
    await expect(page.getByText(credentials.email).filter({ visible: true }).first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole("combobox", { name: "Role" })).toContainText("Admin");
  });

  test("invite a user, refuse the same email twice, re-send, then delete the invitation", async ({
    page,
  }) => {
    const email = uniqueEmail("invite");
    await page.goto("/users");

    // Invite.
    await page.getByRole("button", { name: "Invite user" }).click();
    const dialog = page.getByRole("dialog", { name: "Invite user" });
    await dialog.getByLabel("First name").fill("E2E");
    await dialog.getByLabel("Last name").fill("Invitee");
    await dialog.getByLabel("Email").fill(email);
    await dialog.getByRole("button", { name: "Send invitation" }).click();
    await expect(visible(page, `Invitation sent to ${email}`)).toBeVisible();
    await expect(dialog).toBeHidden();

    // It is in the list as Invited.
    await page.getByRole("searchbox", { name: "Search users" }).fill(email);
    await expect(visible(page, email).first()).toBeVisible();
    await expect(visible(page, "Invited").first()).toBeVisible();

    // The same email again is refused under the Email field.
    await page.getByRole("button", { name: "Invite user" }).click();
    await dialog.getByLabel("First name").fill("E2E");
    await dialog.getByLabel("Last name").fill("Again");
    await dialog.getByLabel("Email").fill(email);
    await dialog.getByRole("button", { name: "Send invitation" }).click();
    await expect(dialog.getByText("A user with this email already exists.")).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();

    // Re-send.
    await page.getByRole("button", { name: "Actions for E2E Invitee" }).click();
    await page.getByRole("menuitem", { name: "Re-send invitation" }).click();
    await expect(visible(page, `Invitation sent to ${email}`).first()).toBeVisible();

    // Delete the invitation (the simple dialog: no impact, no typing). This is the cleanup too.
    await page.getByRole("button", { name: "Actions for E2E Invitee" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toContainText(`Delete invitation for E2E Invitee (${email})?`);
    await expect(confirm).toContainText("The invitation link will stop working.");
    await confirm.getByRole("button", { name: "Delete" }).click();
    await expect(visible(page, "Invitation deleted")).toBeVisible();
    await expect(page.getByText("No users match your search.")).toBeVisible();
  });

  test("deactivate and delete explain the impact, guard the button, and can be cancelled", async ({
    page,
  }) => {
    await page.goto("/users?status=ACTIVE");
    // Any active user other than the signed-in Admin.
    const others = page.getByRole("button", { name: /^Actions for / }).filter({ visible: true });
    await expect(others.first()).toBeVisible(); // the list has loaded before counting rows
    let target = null;
    for (let i = 0; i < (await others.count()); i++) {
      await others.nth(i).click();
      const menu = page.getByRole("menu");
      await menu.waitFor(); // count items only once the menu is open
      if (await menu.getByRole("menuitem", { name: "Deactivate" }).count()) {
        target = others.nth(i);
        break;
      }
      await page.keyboard.press("Escape");
      await menu.waitFor({ state: "hidden" });
    }
    test.skip(target === null, "No other active user to open the dialogs on");

    await page.getByRole("menuitem", { name: "Deactivate" }).click();
    const deactivate = page.getByRole("alertdialog");
    await expect(deactivate).toContainText(/Deactivate .+\?/);
    await expect(deactivate).toContainText("will be signed out immediately");
    await deactivate.getByRole("button", { name: "Cancel" }).click();
    await expect(deactivate).toBeHidden();

    await target!.click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const remove = page.getByRole("alertdialog");
    await expect(remove).toContainText("assignments");
    await expect(remove).toContainText("This cannot be undone.");
    const deleteButton = remove.getByRole("button", { name: "Delete" });
    await expect(deleteButton).toBeDisabled();
    await remove.getByLabel(/to confirm$/).fill("not-the-email@example.com");
    await expect(deleteButton).toBeDisabled();
    await remove.getByRole("button", { name: "Cancel" }).click();
    await expect(remove).toBeHidden();
  });

  test("My profile: details read-only where they should be, and the Password tab", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await openAccountMenu(page);
    await page.getByRole("menuitem", { name: "My profile" }).click();
    await expect(page.getByRole("heading", { name: "My profile" })).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue(credentials.email);
    await expect(page.getByLabel("Email")).toHaveAttribute("readonly", "");

    // Validation without saving: an empty first name is refused, Save needs a change.
    const save = page.getByRole("button", { name: "Save" });
    await expect(save).toBeDisabled();
    await page.getByLabel("First name").fill("");
    await save.click();
    await expect(page.getByText("Enter the first name")).toBeVisible();

    // The Password tab, also reachable by the old address.
    await page.goto("/profile/password");
    await expect(page).toHaveURL(/\/profile\?tab=password/);
    await expect(page.getByRole("tab", { name: "Password" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByLabel("Current password")).toBeVisible();
  });
});

test.describe("my profile, saving", () => {
  useSavedSession();
  const SUFFIX = " E2E";

  // If a run stops halfway, put the signed-in Admin's last name back.
  test.afterEach(async ({ request, baseURL }) => {
    const me = await request.get("/api/backend/v1/me");
    if (!me.ok()) return;
    const lastName: string = (await me.json()).data.last_name;
    if (!lastName.endsWith(SUFFIX)) return;
    await request.patch("/api/backend/v1/me", {
      headers: { "If-Match": me.headers()["etag"] ?? "", Origin: baseURL! },
      data: { last_name: lastName.slice(0, -SUFFIX.length) },
    });
  });

  test("saving the name shows a confirmation, updates the header, and can be undone", async ({
    page,
  }) => {
    await page.goto("/profile");
    const lastName = page.getByLabel("Last name");
    const original = await lastName.inputValue();
    const save = page.getByRole("button", { name: "Save" });

    await lastName.fill(original + SUFFIX);
    await save.click();
    await expect(visible(page, "Profile updated successfully")).toBeVisible();
    await expect(save).toBeDisabled(); // the form now starts from the saved values
    await expect(page.getByRole("button", { name: /Account menu/ })).toHaveAccessibleName(
      new RegExp(`${original}${SUFFIX}$`),
    );

    await lastName.fill(original);
    await save.click();
    await expect(visible(page, "Profile updated successfully").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Account menu/ })).toHaveAccessibleName(
      new RegExp(`${original}$`),
    );
  });
});
