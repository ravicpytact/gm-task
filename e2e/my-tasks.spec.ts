import { expect, request, test, type APIRequestContext } from "@playwright/test";
import { SESSION_FILE, credentials, useUserSession, userCredentials } from "./helpers";

// My tasks and My Task Detail (Screens 30–31), as the optional User account (E2E_USER_EMAIL),
// against the real backend. The Admin gives that account a throwaway task "E2E my task …" for the
// test and deletes the task again afterwards (its assignment and Todos go with it).

const PREFIX = "E2E my task";

/** Today as the backend counts it (IST), for the assignment's start date. */
const todayInIst = () => new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);

/** The Admin, through the app's own proxy; writes need the Origin it checks (FE-AUTH-007). */
function adminApi(baseURL: string) {
  return request.newContext({
    baseURL,
    storageState: SESSION_FILE,
    extraHTTPHeaders: { Origin: baseURL },
  });
}

async function deleteTestTasks(admin: APIRequestContext) {
  const list = await admin.get(
    `/api/backend/v1/tasks?search=${encodeURIComponent(PREFIX)}&page_size=100`,
  );
  if (!list.ok()) return;
  const items: { id: string; name: string }[] = (await list.json()).data.items;
  for (const task of items.filter((t) => t.name.startsWith(PREFIX))) {
    const detail = await admin.get(`/api/backend/v1/tasks/${task.id}`);
    const etag = detail.headers()["x-etag"];
    if (etag)
      await admin.delete(`/api/backend/v1/tasks/${task.id}`, { headers: { "X-If-Match": etag } });
  }
}

test.describe("My tasks, as a User", () => {
  useUserSession();
  test.skip(!credentials.email || !credentials.password, "No E2E Admin to set up the task");

  test("a User opens My tasks from the menu, then one task's detail", async ({
    page,
    baseURL,
  }, info) => {
    const admin = await adminApi(baseURL!);
    const name = `${PREFIX} ${info.project.name} ${Date.now()}`;
    try {
      // The Admin assigns a throwaway task to the User account, from today.
      const users = await admin.get(
        `/api/backend/v1/users?search=${encodeURIComponent(userCredentials.email)}`,
      );
      const userId: string = (await users.json()).data.items[0].id;
      const created = await admin.post("/api/backend/v1/tasks", {
        data: { name, type: "YES_NO", description: "Made by an end-to-end test" },
      });
      expect(created.ok()).toBe(true);
      const taskId: string = (await created.json()).data.id;
      const assigned = await admin.post("/api/backend/v1/assignments", {
        data: {
          task_id: taskId,
          user_ids: [userId],
          all_users: false,
          frequency: "DAILY",
          weekdays: [],
          start_date: todayInIst(),
          end_date: null,
        },
      });
      expect(assigned.ok()).toBe(true);

      // My tasks is in the User's menu (bottom bar on phones).
      await page.goto("/todos");
      await page.getByRole("link", { name: "My tasks" }).filter({ visible: true }).first().click();
      await expect(page).toHaveURL(/\/my-tasks$/);
      await expect(page.getByRole("heading", { level: 1, name: "My tasks" })).toBeVisible();

      // The task is listed (Active is the default), due today; it opens its detail.
      const link = page.getByRole("link", { name }).filter({ visible: true });
      await expect(link).toBeVisible();
      await expect(page.getByText("Today").filter({ visible: true }).first()).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/my-tasks\/[0-9a-f-]{36}$/);
      await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
      await expect(page.getByText("Made by an end-to-end test")).toBeVisible();
      await expect(page.getByText("Assigned by")).toBeVisible();
      await expect(page.getByRole("heading", { name: "My history" })).toBeVisible();
      await expect(page.getByText("No answers in this period.")).toBeVisible();

      // Back to the list through the breadcrumb.
      await page
        .getByRole("navigation", { name: "Breadcrumb" })
        .getByRole("link", { name: "My tasks" })
        .click();
      await expect(page).toHaveURL(/\/my-tasks$/);
    } finally {
      await deleteTestTasks(admin);
      await admin.dispose();
    }
  });

  test("on a phone, a User's bar has its five items and no More", async ({ page }, info) => {
    test.skip(info.project.name !== "phone", "The bottom bar is for phones");
    await page.goto("/todos");
    const bar = page.getByRole("navigation", { name: "Main" }).filter({ visible: true });
    await expect(bar.getByRole("link")).toHaveText([
      "Todos",
      "My tasks",
      "History",
      "Report",
      "Profile",
    ]);
    await expect(bar.getByRole("button", { name: "More" })).toHaveCount(0);
  });

  test("an assignment that is not mine says so, with the way back", async ({ page }) => {
    await page.goto("/my-tasks/00000000-0000-0000-0000-000000000000");
    await expect(page.getByText("This task isn't assigned to you.")).toBeVisible();
    await page.getByRole("link", { name: "My tasks" }).filter({ visible: true }).last().click();
    await expect(page).toHaveURL(/\/my-tasks$/);
  });
});
