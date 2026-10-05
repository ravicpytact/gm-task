import { expect, test, type Page } from "@playwright/test";
import { useSavedSession } from "./helpers";

// Reporting (Screen 26) and History for all users (Screen 25), as an Admin. Both only read, so
// they run against whatever data is there and change nothing.

const visible = (page: Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true });

test.describe("reports and history, as Admin", () => {
  useSavedSession();

  test("the report covers every range type and one person", async ({ page, request }) => {
    const me = (await (await request.get("/api/backend/v1/me")).json()).data;
    const myName = `${me.first_name} ${me.last_name}`;

    await page.goto("/report");
    await expect(page.getByRole("heading", { level: 1, name: "Reporting" })).toBeVisible();
    await expect(page.getByText(/^Day: \d\d \w{3} \d{4}$/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Overall Frequency Summary" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "User Wise Details" })).toBeVisible();
    await expect(page.getByText(/^T = Total, C = Completed \(includes No\)/)).toBeVisible();

    // Week, then the week before; a way back to this week appears.
    await page.getByRole("radio", { name: "Week" }).click();
    await expect(page).toHaveURL(/range=WEEK/);
    await expect(page.getByText(/^Week: \d\d \w{3} – \d\d \w{3} \d{4}$/)).toBeVisible();
    await page.getByRole("button", { name: "Previous week" }).click();
    await expect(page).toHaveURL(/week=\d{4}-\d{2}-\d{2}/);
    await page.getByRole("button", { name: "This week" }).click();
    await expect(page).not.toHaveURL(/week=/);

    // Month, and a custom range that waits for both days.
    await page.getByRole("radio", { name: "Month" }).click();
    await expect(page.getByText(/^Month: \w+ \d{4}$/)).toBeVisible();
    await page.getByRole("radio", { name: "Range" }).click();
    await expect(page.getByText("Choose the start and end dates.")).toBeVisible();
    await page.getByLabel("From").fill("2026-09-01");
    await page.getByLabel("To").fill("2026-09-30");
    await expect(page.getByText("Range: 01 Sep – 30 Sep 2026")).toBeVisible();

    // One person: only their row.
    await page.getByRole("combobox", { name: "User" }).click();
    await page.getByPlaceholder("Search by name or email").fill(me.email);
    await page
      .getByRole("option", { name: new RegExp(myName) })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`user=${me.id}`));
    await expect(visible(page, myName).first()).toBeVisible();
    await expect(page.getByText(/^1–1 of 1$/).filter({ visible: true })).toBeVisible();
  });

  test("history shows everyone, or one person", async ({ page, request }) => {
    const me = (await (await request.get("/api/backend/v1/me")).json()).data;
    await page.goto("/history?from=2026-01-01");
    await expect(page.getByRole("heading", { level: 1, name: "History" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "User" })).toContainText("User: All users");
    await page.getByRole("combobox", { name: "User" }).click();
    await page.getByPlaceholder("Search by name or email").fill(me.email);
    await page
      .getByRole("option", { name: new RegExp(`${me.first_name} ${me.last_name}`) })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`user=${me.id}`));
    await expect(page.getByRole("combobox", { name: "User" })).toContainText(me.first_name);
  });
});
