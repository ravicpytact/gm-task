import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { useSavedSession } from "./helpers";

// Task List and its dialogs (Screens 16–18) against the real backend. Only throwaway tasks named
// "E2E task …" are created, and they are deleted again, by the test or by the clean-up below.

const PREFIX = "E2E task";
const visible = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true });

/** Deletes leftover test tasks through the app's own backend proxy (session cookies included). */
async function deleteTestTasks(request: APIRequestContext, baseURL: string) {
  const list = await request.get(
    `/api/backend/v1/tasks?search=${encodeURIComponent(PREFIX)}&page_size=100`,
  );
  if (!list.ok()) return;
  const items: { id: string; name: string }[] = (await list.json()).data.items;
  for (const task of items.filter((t) => t.name.startsWith(PREFIX))) {
    const detail = await request.get(`/api/backend/v1/tasks/${task.id}`);
    const etag = detail.headers()["x-etag"];
    if (!etag) continue;
    await request.delete(`/api/backend/v1/tasks/${task.id}`, {
      headers: { "X-If-Match": etag, Origin: baseURL },
    });
  }
}

test.describe("tasks, as Admin", () => {
  useSavedSession();

  test.afterEach(async ({ request, baseURL }) => {
    await deleteTestTasks(request, baseURL!);
  });

  test("create, refuse a duplicate name, edit, deactivate, activate and delete a task", async ({
    page,
  }, info) => {
    const name = `${PREFIX} ${info.project.name} ${Date.now()}`;
    await page.goto("/tasks");
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();

    // Create: the type cards show what users will answer.
    await page.getByRole("button", { name: "Create task" }).first().click();
    const create = page.getByRole("dialog", { name: "Create task" });
    await create.getByLabel("Name").fill(name);
    await create.getByLabel("Description (optional)").fill("Morning set");
    await expect(create.getByText("11/500")).toBeVisible();
    await create.getByRole("radio", { name: "Number" }).check();
    await expect(create).toContainText("Users will answer: 1, 2, 3, 4, No, Other (5 or more)");
    await expect(create).toContainText("The type can't be changed later.");
    await create.getByRole("button", { name: "Create task" }).click();
    await expect(visible(page, "Task created successfully")).toBeVisible();
    await expect(create).toBeHidden();

    // It is listed, Active, of type Number.
    await page.getByRole("searchbox", { name: "Search tasks" }).fill(name);
    await expect(visible(page, name).first()).toBeVisible();
    await expect(visible(page, "Active").first()).toBeVisible();

    // The same name again is refused under Name.
    await page.getByRole("button", { name: "Create task" }).first().click();
    await create.getByLabel("Name").fill(name.toUpperCase());
    await create.getByRole("radio", { name: "Yes-No" }).check();
    await create.getByRole("button", { name: "Create task" }).click();
    await expect(create.getByText("A task with this name already exists.")).toBeVisible();
    await create.getByRole("button", { name: "Cancel" }).click();

    // Edit: the type is read-only, Save waits for a change.
    const renamed = `${name} renamed`;
    await page.getByRole("button", { name: `Actions for ${name}` }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    const edit = page.getByRole("dialog", { name: "Edit task" });
    await expect(edit.getByLabel("Type")).toHaveValue("Number");
    await expect(edit.getByRole("button", { name: "Save" })).toBeDisabled();
    await edit.getByLabel("Name").fill(renamed);
    await edit.getByRole("button", { name: "Save" }).click();
    await expect(visible(page, "Task updated successfully")).toBeVisible();
    await page.getByRole("searchbox", { name: "Search tasks" }).fill(renamed);
    await expect(visible(page, renamed).first()).toBeVisible();

    // Deactivate, then activate.
    await page.getByRole("button", { name: `Actions for ${renamed}` }).click();
    await page.getByRole("menuitem", { name: "Deactivate" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toContainText(`No new ${renamed} Todos from tomorrow.`);
    await confirm.getByRole("button", { name: "Deactivate" }).click();
    await expect(visible(page, `${renamed} deactivated`)).toBeVisible();
    await expect(visible(page, "Inactive").first()).toBeVisible();
    await page.getByRole("button", { name: `Actions for ${renamed}` }).click();
    await page.getByRole("menuitem", { name: "Activate" }).click();
    await confirm.getByRole("button", { name: "Activate" }).click();
    await expect(visible(page, `${renamed} activated`)).toBeVisible();

    // Delete: the impact, then the name must be typed.
    await page.getByRole("button", { name: `Actions for ${renamed}` }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(confirm).toContainText("users assigned");
    await expect(confirm).toContainText("This cannot be undone.");
    const deleteButton = confirm.getByRole("button", { name: "Delete" });
    await expect(deleteButton).toBeDisabled();
    await confirm.getByLabel(/to confirm$/).fill(renamed);
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();
    await expect(visible(page, "Task deleted successfully")).toBeVisible();
    await expect(page.getByText("No tasks match your search.")).toBeVisible();
  });

  test("type and status filters live in the URL", async ({ page }) => {
    await page.goto("/tasks");
    await page.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: "Number" }).click();
    await expect(page).toHaveURL(/type=NUMBER/);
    await page.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Inactive" }).click();
    await expect(page).toHaveURL(/status=INACTIVE/);
    await page.reload();
    await expect(page.getByRole("combobox", { name: "Type" })).toContainText("Number");
    await expect(page.getByRole("combobox", { name: "Status" })).toContainText("Inactive");
  });
});
