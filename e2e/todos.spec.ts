import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { useSavedSession } from "./helpers";

// Dashboard, answering, the calendar and My History (Screens 05–08, 27) against the real backend.
// Answers can't be undone, so each test answers only Todos of its own throwaway tasks
// ("E2E todo …"), assigned to the signed-in Admin; deleting the tasks afterwards removes their
// assignments, Todos and answers too.

const PREFIX = "E2E todo";
const visible = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true });

type Created = { id: string; name: string };

async function createAssignedTask(
  request: APIRequestContext,
  baseURL: string,
  me: string,
  name: string,
  type: string,
): Promise<Created> {
  const task = await request.post("/api/backend/v1/tasks", {
    data: { name, type },
    headers: { Origin: baseURL },
  });
  expect(task.ok()).toBeTruthy();
  const created: Created = (await task.json()).data;
  const assigned = await request.post("/api/backend/v1/assignments", {
    data: { task_id: created.id, user_ids: [me], frequency: "DAILY" },
    headers: { Origin: baseURL },
  });
  expect(assigned.ok()).toBeTruthy(); // today's Todo is created with it
  return created;
}

async function deleteTask(request: APIRequestContext, baseURL: string, id: string) {
  const etag = (await request.get(`/api/backend/v1/tasks/${id}`)).headers()["etag"];
  if (!etag) return;
  await request.delete(`/api/backend/v1/tasks/${id}`, {
    headers: { "If-Match": etag, Origin: baseURL },
  });
}

async function dailyPending(request: APIRequestContext): Promise<number> {
  const summary = (await (await request.get("/api/backend/v1/me/todos/summary")).json()).data;
  return summary.pending_by_frequency.find((p: { frequency: string }) => p.frequency === "DAILY")
    .pending;
}

test.describe("my Todos", () => {
  useSavedSession();

  let created: Created[] = [];
  test.afterEach(async ({ request, baseURL }) => {
    for (const task of created) await deleteTask(request, baseURL!, task.id);
    created = [];
  });

  test("answer each task type, see the counts drop and the answers in History", async ({
    page,
    request,
    baseURL,
  }, info) => {
    const me = (await (await request.get("/api/backend/v1/me")).json()).data.id as string;
    const run = `${PREFIX} ${info.project.name} ${Date.now()}`;
    for (const [suffix, type] of [
      ["Time", "TIME"],
      ["Bed", "YES_NO"],
      ["Lunch", "FOOD"],
      ["Pull-ups", "NUMBER"],
    ] as const) {
      created.push(await createAssignedTask(request, baseURL!, me, `${run} ${suffix}`, type));
    }
    const [time, bed, lunch, pullUps] = created as [Created, Created, Created, Created];
    const before = await dailyPending(request);

    // Only this run's Todos, through the search in the URL.
    await page.goto(`/dashboard?search=${encodeURIComponent(run)}`);
    await expect(page.getByRole("heading", { level: 1, name: /^Hi, / })).toBeVisible();
    await expect(page.getByText(/^Pending for \d\d \w{3} \d{4}$/)).toBeVisible();
    await expect(page.getByText("Answers can't be changed.")).toBeVisible();
    await expect(page.getByRole("button", { name: `Daily: ${before} pending` })).toBeVisible();

    // Yes-No and Food answer with one tap.
    await page
      .getByRole("group", { name: `Answer ${bed.name}` })
      .getByRole("button", { name: "Yes" })
      .click();
    await expect(visible(page, "Todo updated successfully").first()).toBeVisible();
    await expect(visible(page, bed.name)).toHaveCount(0);
    await page
      .getByRole("group", { name: `Answer ${lunch.name}` })
      .getByRole("button", { name: "Average" })
      .click();
    await expect(visible(page, lunch.name)).toHaveCount(0);

    // Number → Other: a whole number of 5 or more.
    await page
      .getByRole("group", { name: `Answer ${pullUps.name}` })
      .getByRole("button", { name: "Other" })
      .click();
    const other = page.getByLabel(`Other number for ${pullUps.name}`).filter({ visible: true });
    await other.fill("4");
    await other.press("Enter");
    await expect(visible(page, "Enter a whole number of 5 or more.")).toBeVisible();
    await other.fill("10");
    await other.press("Enter");
    await expect(visible(page, pullUps.name)).toHaveCount(0);

    // Time: a 24-hour time and Save.
    const timeInput = page.getByLabel(`Time for ${time.name}`).filter({ visible: true });
    await timeInput.fill("06:30");
    await timeInput.press("Enter");
    await expect(page.getByText("No pending Todos match your search.")).toBeVisible();
    await expect(page.getByRole("button", { name: `Daily: ${before - 4} pending` })).toBeVisible();

    // History (an Admin sees everyone's) shows the answers as words, filtered by task.
    await page.goto("/history");
    await expect(page.getByRole("heading", { level: 1, name: "History" })).toBeVisible();
    for (const [task, answer] of [
      [pullUps, "10 (Other)"],
      [lunch, "Average"],
    ] as const) {
      await page.getByRole("combobox", { name: "Task" }).click();
      await page.getByPlaceholder("Search tasks").fill(task.name);
      await page.getByRole("option", { name: task.name }).click();
      await expect(page).toHaveURL(new RegExp(`task=${task.id}`));
      await expect(visible(page, answer).first()).toBeVisible();
    }
  });

  test("the calendar popup opens a day's Todos", async ({ page }) => {
    await page.goto("/dashboard");
    const pill = page.getByRole("button", { name: /^Today · .+ Open the calendar$/ });
    await pill.click();
    const calendar = page.getByRole("region", { name: "Pending-dates calendar" });
    const today = calendar.getByRole("button", { name: /, today, / });
    await expect(today).toBeVisible();

    // Month title → 12 month cards; year → year cards; back down to this month's days.
    await calendar.getByRole("button", { name: /: choose a month$/ }).click();
    await expect(
      calendar.getByRole("button", {
        name: /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}/,
      }),
    ).toHaveCount(12);
    await calendar.getByRole("button", { name: /: choose a year$/ }).click();
    await expect(calendar.getByRole("heading", { name: "Years" })).toBeVisible();
    await calendar.getByRole("button", { name: /^\d{4} \(current\)/ }).click();
    await calendar.getByRole("button", { name: /^\w+ \d{4} \(current\)/ }).click();
    await expect(today).toBeVisible();

    // Another day: the popup closes and the list shows that day.
    await calendar.getByRole("button", { name: /^01 \w{3} \d{4}/ }).click();
    await expect(calendar).toBeHidden();
    await expect(page.getByText(/^Pending for 01 \w{3} \d{4}$/)).toBeVisible();
  });
});
