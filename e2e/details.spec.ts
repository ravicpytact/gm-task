import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { credentials, uniqueEmail, useSavedSession } from "./helpers";

// User Detail and Task Detail (Screens 28–29), the Todos rename and who sees My tasks, as Admin,
// against the real backend. Only throwaway records are changed: an invitation and a task named
// "E2E detail …", both deleted by the test (and the task again by the clean-up below).

const TASK_PREFIX = "E2E detail";
const visible = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true });

/** Deletes leftover test tasks through the app's own backend proxy (session cookies included). */
async function deleteTestTasks(request: APIRequestContext, baseURL: string) {
  const list = await request.get(
    `/api/backend/v1/tasks?search=${encodeURIComponent(TASK_PREFIX)}&page_size=100`,
  );
  if (!list.ok()) return;
  const items: { id: string; name: string }[] = (await list.json()).data.items;
  for (const task of items.filter((t) => t.name.startsWith(TASK_PREFIX))) {
    const detail = await request.get(`/api/backend/v1/tasks/${task.id}`);
    const etag = detail.headers()["x-etag"];
    if (!etag) continue;
    await request.delete(`/api/backend/v1/tasks/${task.id}`, {
      headers: { "X-If-Match": etag, Origin: baseURL },
    });
  }
}

test.describe("Todos (formerly Dashboard)", () => {
  useSavedSession();

  test("/dashboard redirects to /todos, keeping the chosen day", async ({ page }) => {
    await page.goto("/dashboard?date=2026-10-01");
    await expect(page).toHaveURL(/\/todos\?date=2026-10-01$/);
    await expect(page.getByRole("link", { name: "Todos" }).first()).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("on a phone, an Admin reaches Users and Tasks through More", async ({ page }, info) => {
    test.skip(info.project.name !== "phone", "The bottom bar is for phones");
    await page.goto("/todos");
    const bar = page.getByRole("navigation", { name: "Main" }).filter({ visible: true });
    await bar.getByRole("button", { name: "More" }).click();
    const sheet = page.getByRole("dialog", { name: "More" });
    await expect(sheet.getByRole("link", { name: "Task Assignments" })).toBeVisible();
    await sheet.getByRole("link", { name: "Users" }).click();
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
    await expect(sheet).toBeHidden();
    // On a More page, More is the highlighted item; Tasks is one more tap away.
    await expect(bar.getByRole("button", { name: "More" })).toHaveAttribute("data-active", "true");
    await bar.getByRole("button", { name: "More" }).click();
    await sheet.getByRole("link", { name: "Tasks" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Tasks" })).toBeVisible();
  });

  test("an Admin has no My tasks: not in the menu, and the page is forbidden", async ({ page }) => {
    await page.goto("/todos");
    await expect(page.getByRole("link", { name: "Todos" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "My tasks" })).toHaveCount(0);
    await page.goto("/my-tasks");
    await expect(page.getByRole("link", { name: "My tasks" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "My tasks" })).toHaveCount(0);
  });
});

test.describe("detail pages, as Admin", () => {
  useSavedSession();

  test.afterEach(async ({ request, baseURL }) => {
    await deleteTestTasks(request, baseURL!);
  });

  test("User Detail: open it from the list, see the tabs, edit is offered; delete goes back", async ({
    page,
  }) => {
    // A throwaway invitation is the user (no existing user changes); deleted at the end.
    const email = uniqueEmail("detail");
    await page.goto("/users");
    await page.getByRole("button", { name: "Invite user" }).click();
    const invite = page.getByRole("dialog", { name: "Invite user" });
    await invite.getByLabel("First name").fill("E2E");
    await invite.getByLabel("Last name").fill("Detailed");
    await invite.getByLabel("Email").fill(email);
    await invite.getByRole("button", { name: "Send invitation" }).click();
    await expect(invite).toBeHidden();

    // The name in the list opens the detail page.
    await page.getByRole("searchbox", { name: "Search users" }).fill(email);
    await page.getByRole("link", { name: "E2E Detailed" }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/users\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1, name: "E2E Detailed" })).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Users" })).toBeVisible();
    await expect(visible(page, email).first()).toBeVisible();
    await expect(visible(page, "Invited on")).toBeVisible();
    await expect(visible(page, "Invited by")).toBeVisible();
    await expect(visible(page, "Welcome tour")).toHaveCount(0); // hidden for Invited

    // Tabs: Assignments first; History keeps its tab in the URL.
    await expect(page.getByRole("tab", { name: "Assignments" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByText("No active assignments.")).toBeVisible();
    await page.getByRole("tab", { name: "History" }).click();
    await expect(page).toHaveURL(/tab=history/);
    await expect(page.getByText("No answers in this period.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("tab", { name: "History" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // An action works from here: Edit opens the same dialog (cancelled).
    await page.getByRole("button", { name: "Edit" }).click();
    const edit = page.getByRole("dialog", { name: "Edit user" });
    await expect(edit).toContainText(email);
    await edit.getByRole("button", { name: "Cancel" }).click();
    await expect(edit).toBeHidden();

    // Delete (the cleanup too) goes back to the User List.
    await page.getByRole("button", { name: "Actions for E2E Detailed" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(visible(page, "Invitation deleted")).toBeVisible();
    await expect(page).toHaveURL(/\/users$/);
  });

  test("User Detail of yourself: no Delete, and the counts show", async ({ page, request }) => {
    const me: { id: string; first_name: string; last_name: string } = (
      await (await request.get("/api/backend/v1/me")).json()
    ).data;
    await page.goto(`/users/${me.id}`);
    await expect(visible(page, credentials.email).first()).toBeVisible();
    await expect(visible(page, "Completed Todos")).toBeVisible();
    await expect(visible(page, "Pending Todos")).toBeVisible();
    // The user's own menu, not an assignment row's.
    const menu = page.getByRole("button", {
      name: `Actions for ${me.first_name} ${me.last_name}`,
      exact: true,
    });
    if (await menu.count()) {
      await menu.click();
      await expect(page.getByRole("menuitem", { name: "Delete" })).toHaveCount(0);
      await page.keyboard.press("Escape");
    }
  });

  test("Task Detail: open it from the list, Assign has the task chosen, delete goes back", async ({
    page,
  }) => {
    const name = `${TASK_PREFIX} ${Date.now()}`;
    await page.goto("/tasks");
    await page.getByRole("button", { name: "Create task" }).first().click();
    const create = page.getByRole("dialog", { name: "Create task" });
    await create.getByLabel("Name").fill(name);
    await create.getByRole("radio", { name: "Number" }).check();
    await create.getByRole("button", { name: "Create task" }).click();
    await expect(create).toBeHidden();

    await page.getByRole("searchbox", { name: "Search tasks" }).fill(name);
    await page.getByRole("link", { name }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/tasks\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(visible(page, "Created by")).toBeVisible();
    await expect(visible(page, "Users assigned")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Assignments" })).toBeVisible();
    await expect(page.getByText("No active assignments.")).toBeVisible();
    await page.getByRole("button", { name: "Show all" }).click();
    await expect(page.getByText("Nobody has this task yet.")).toBeVisible();

    // Assign opens Assign Task with this task already chosen (cancelled).
    await page.getByRole("button", { name: "Assign", exact: true }).click();
    const assign = page.getByRole("dialog", { name: "Assign task" });
    await expect(assign.getByRole("combobox", { name: "Task" })).toContainText(name);
    await assign.getByRole("button", { name: "Cancel" }).click();
    await expect(assign).toBeHidden();

    // Delete goes back to the Task List.
    await page.getByRole("button", { name: `Actions for ${name}` }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const confirm = page.getByRole("alertdialog");
    await confirm.getByLabel(/to confirm$/).fill(name);
    await confirm.getByRole("button", { name: "Delete" }).click();
    await expect(visible(page, "Task deleted successfully")).toBeVisible();
    await expect(page).toHaveURL(/\/tasks$/);
  });

  test("a detail page for a record that is not there says so, with the way back", async ({
    page,
  }) => {
    await page.goto("/users/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText("This user doesn't exist or was deleted.")).toBeVisible();
    await page.getByRole("link", { name: "Users" }).filter({ visible: true }).last().click();
    await expect(page).toHaveURL(/\/users$/);

    await page.goto("/tasks/not-an-id");
    await expect(page.getByText("This task doesn't exist or was deleted.")).toBeVisible();
  });
});
