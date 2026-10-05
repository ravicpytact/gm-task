import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { useSavedSession } from "./helpers";

// Task Assignments and its dialogs (Screens 19–24) against the real backend. Each test makes its
// own throwaway task ("E2E assign …") and assigns it only to the signed-in Admin; deleting that
// task afterwards removes its assignment and Todos too. Copy is only previewed (a dry run).

const PREFIX = "E2E assign";
const visible = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true });

/** Today in the app's zone (IST), as the date inputs want it: 2026-10-03. */
const isoDay = (offsetDays = 0) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(Date.now() + offsetDays * 86_400_000),
  );
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shown = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
};

type Me = { id: string; first_name: string; last_name: string; email: string };

async function createTask(request: APIRequestContext, baseURL: string, name: string) {
  const response = await request.post("/api/backend/v1/tasks", {
    data: { name, type: "YES_NO" },
    headers: { Origin: baseURL },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).data as { id: string; name: string };
}

async function deleteTask(request: APIRequestContext, baseURL: string, id: string) {
  const detail = await request.get(`/api/backend/v1/tasks/${id}`);
  const etag = detail.headers()["x-etag"];
  if (!etag) return;
  await request.delete(`/api/backend/v1/tasks/${id}`, {
    headers: { "X-If-Match": etag, Origin: baseURL },
  });
}

/** Picks from a searchable select: open it, search, choose the option. */
async function pick(
  scope: Page | ReturnType<Page["getByRole"]>,
  page: Page,
  label: string,
  search: string,
  option: string | RegExp,
) {
  await scope.getByRole("combobox", { name: label }).click();
  await page.getByPlaceholder(/^Search/).fill(search);
  await page.getByRole("option", { name: option }).first().click();
}

test.describe("task assignments, as Admin", () => {
  useSavedSession();

  let taskId: string | null = null;
  test.afterEach(async ({ request, baseURL }) => {
    if (taskId) await deleteTask(request, baseURL!, taskId);
    taskId = null;
  });

  test("assign, skip a duplicate, change frequency and end date, and de-assign", async ({
    page,
    request,
    baseURL,
  }, info) => {
    const task = await createTask(
      request,
      baseURL!,
      `${PREFIX} ${info.project.name} ${Date.now()}`,
    );
    taskId = task.id;
    const me: Me = (await (await request.get("/api/backend/v1/me")).json()).data;
    const myName = `${me.first_name} ${me.last_name}`;

    await page.goto("/assignments");
    await expect(page.getByRole("heading", { name: "Task Assignments" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Status" })).toContainText("Active");

    // Assign: Weekly needs a day; the next dates come from the server.
    await page.getByRole("button", { name: "Assign task" }).first().click();
    const assign = page.getByRole("dialog", { name: "Assign task" });
    await assign.getByRole("button", { name: "Assign", exact: true }).click();
    await expect(assign.getByRole("alert").filter({ hasText: "Choose a task" })).toBeVisible();
    await expect(
      assign.getByRole("alert").filter({ hasText: "Choose at least one user" }),
    ).toBeVisible();
    await pick(assign, page, "Task", task.name, task.name);
    await pick(assign, page, "Users", me.email, new RegExp(myName));
    await page.keyboard.press("Escape"); // closes the multi-select list, not the dialog
    await expect(assign.getByRole("button", { name: `Remove ${myName}` })).toBeVisible();
    await assign.getByRole("combobox", { name: "Frequency" }).click();
    await page.getByRole("option", { name: "Weekly" }).click();
    await assign.getByRole("button", { name: "Assign", exact: true }).click();
    await expect(
      assign.getByRole("alert").filter({ hasText: "Choose at least one day" }),
    ).toBeVisible();
    await assign.getByRole("button", { name: "Mon" }).click();
    await assign.getByRole("button", { name: "Thu" }).click();
    await expect(assign.getByText(/^Next: (Mon|Thu) \d\d \w{3}, /)).toBeVisible();
    await assign.getByRole("button", { name: "Assign", exact: true }).click();
    await expect(assign.getByText("Assigned to 1 user.")).toBeVisible();
    await assign.getByRole("button", { name: "Done" }).click();

    // The list, filtered by the task in the URL; the picker still names it after a reload.
    await page.goto(`/assignments?task=${task.id}`);
    await expect(page.getByRole("combobox", { name: "Task" })).toContainText(task.name);
    await expect(visible(page, "Weekly (Mon, Thu)").first()).toBeVisible();
    await expect(visible(page, myName).first()).toBeVisible();

    // The same task again: skipped, not doubled (ASG-R3).
    await page.getByRole("button", { name: "Assign task" }).first().click();
    await pick(assign, page, "Task", task.name, task.name);
    await pick(assign, page, "Users", me.email, new RegExp(myName));
    await page.keyboard.press("Escape");
    await assign.getByRole("combobox", { name: "Frequency" }).click();
    await page.getByRole("option", { name: "Daily" }).click();
    await assign.getByRole("button", { name: "Assign", exact: true }).click();
    await expect(
      assign.getByText(
        `No one was assigned. Skipped 1 who already has this task: ${me.first_name}.`,
      ),
    ).toBeVisible();
    await assign.getByRole("button", { name: "Done" }).click();

    const actions = page.getByRole("button", { name: `Actions for ${task.name} — ${myName}` });

    // Change frequency: the warning, then Daily.
    await actions.click();
    await page.getByRole("menuitem", { name: "Change frequency" }).click();
    const frequency = page.getByRole("dialog", { name: "Change frequency" });
    await expect(frequency).toContainText(`${myName} — ${task.name}`);
    await expect(frequency).toContainText("Today's pending Todo will be replaced.");
    await frequency.getByRole("combobox", { name: "New frequency" }).click();
    await page.getByRole("option", { name: "Daily" }).click();
    await frequency.getByRole("button", { name: "Save" }).click();
    await expect(visible(page, "Assignment updated successfully")).toBeVisible();
    await expect(visible(page, "Daily").first()).toBeVisible();

    // Change end date: none yet; a date in a month.
    const end = isoDay(30);
    await actions.click();
    await page.getByRole("menuitem", { name: "Change end date" }).click();
    const endDate = page.getByRole("dialog", { name: "Change end date" });
    await expect(endDate).toContainText("Current end date: None");
    await expect(endDate.getByRole("button", { name: "Save" })).toBeDisabled();
    await endDate.getByLabel("No end date").uncheck();
    await endDate.getByLabel("New end date").fill(end);
    await endDate.getByRole("button", { name: "Save" }).click();
    await expect(visible(page, "Assignment updated successfully").first()).toBeVisible();
    await expect(visible(page, shown(end)).first()).toBeVisible();

    // De-assign: the contract's words; it leaves the Active list and shows as Ended under All.
    await actions.click();
    await page.getByRole("menuitem", { name: "De-assign" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toContainText(`Stop ${task.name} for ${myName}?`);
    await expect(confirm).toContainText("History and reports are kept.");
    await confirm.getByRole("button", { name: "De-assign" }).click();
    await expect(visible(page, "Assignment ended")).toBeVisible();
    await expect(page.getByText("No assignments match these filters.")).toBeVisible();
    await page.goto(`/assignments?task=${task.id}&status=ALL`);
    await expect(visible(page, "Ended (de-assigned)").first()).toBeVisible();
    await expect(actions).toHaveCount(0);
  });

  test("copy previews before anything changes", async ({ page, request, baseURL }, info) => {
    const task = await createTask(
      request,
      baseURL!,
      `${PREFIX} ${info.project.name} ${Date.now()}`,
    );
    taskId = task.id;
    const me: Me = (await (await request.get("/api/backend/v1/me")).json()).data;
    const myName = `${me.first_name} ${me.last_name}`;
    const assigned = await request.post("/api/backend/v1/assignments", {
      data: { task_id: task.id, user_ids: [me.id], frequency: "DAILY" },
      headers: { Origin: baseURL! },
    });
    expect(assigned.ok()).toBeTruthy();

    await page.goto("/assignments");
    await page.getByRole("button", { name: "Copy assignments" }).click();
    const copy = page.getByRole("dialog", { name: "Copy assignments" });
    await copy.getByRole("button", { name: "Preview" }).click();
    await expect(
      copy.getByRole("alert").filter({ hasText: "Choose whose assignments to copy" }),
    ).toBeVisible();
    await expect(
      copy.getByRole("alert").filter({ hasText: "Choose at least one user" }),
    ).toBeVisible();

    await pick(copy, page, "Copy from", me.email, new RegExp(myName));
    // Anyone else active will do: the preview is a dry run and changes nothing.
    await copy.getByRole("combobox", { name: "Copy to" }).click();
    const others = page.getByRole("option");
    await expect(others.first().or(page.getByText("No active users found."))).toBeVisible();
    if ((await others.count()) === 0) {
      test.info().annotations.push({ type: "skip-reason", description: "No other active user" });
      return;
    }
    await others.first().click();
    await page.keyboard.press("Escape");
    await copy.getByRole("button", { name: "Preview" }).click();
    await expect(copy.getByRole("cell", { name: task.name })).toBeVisible();
    await expect(copy).toContainText(
      `Copies keep ${me.first_name}'s start dates so they fall on the same days.`,
    );
    await copy.getByRole("button", { name: "Back" }).click();
    await expect(copy.getByRole("button", { name: "Preview" })).toBeVisible();
    await copy.getByRole("button", { name: "Cancel" }).click();
    await expect(copy).toBeHidden();
  });
});
