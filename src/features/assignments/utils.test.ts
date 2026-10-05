import { describe, expect, it } from "vitest";
import { assignSchema, copySchema, endDateSchema, frequencySchema } from "./schemas";
import {
  assignResultText,
  canChangeEndDate,
  copyResultText,
  frequencyText,
  nextDueText,
  statusText,
  toAssignmentListQuery,
} from "./utils";

describe("toAssignmentListQuery", () => {
  it("maps the URL to the backend query, leaving out empty filters", () => {
    expect(
      toAssignmentListQuery({
        page: 2,
        user: null,
        task: "t1",
        frequency: null,
        status: "ACTIVE",
        sort: "user_name",
        order: "asc",
      }),
    ).toEqual({
      page: 2,
      page_size: 20,
      status: "ACTIVE",
      sort_by: "user_name",
      sort_order: "asc",
      user_id: undefined,
      task_id: "t1",
      frequency: undefined,
    });
  });
});

describe("frequencyText (contract §6)", () => {
  it("lists weekly days in week order", () => {
    expect(frequencyText("WEEKLY", ["THU", "MON"])).toBe("Weekly (Mon, Thu)");
  });
  it("names other frequencies alone", () => {
    expect(frequencyText("EVERY_15_DAYS", [])).toBe("15 Days");
  });
});

describe("statusText and canChangeEndDate", () => {
  it("tells the two ways an assignment ends apart", () => {
    expect(statusText({ status: "ACTIVE", ended_reason: null })).toBe("Active");
    expect(statusText({ status: "ENDED", ended_reason: "DEASSIGNED" })).toBe("Ended (de-assigned)");
    expect(statusText({ status: "ENDED", ended_reason: "END_DATE_PASSED" })).toBe(
      "Ended (end date passed)",
    );
  });
  it("offers Change end date unless the assignment was de-assigned", () => {
    expect(canChangeEndDate({ status: "ACTIVE", ended_reason: null })).toBe(true);
    expect(canChangeEndDate({ status: "ENDED", ended_reason: "END_DATE_PASSED" })).toBe(true);
    expect(canChangeEndDate({ status: "ENDED", ended_reason: "DEASSIGNED" })).toBe(false);
  });
});

describe("result texts", () => {
  it("shows the next due dates (contract §7)", () => {
    expect(nextDueText(["2026-10-01", "2026-10-05"])).toBe("Next: Thu 01 Oct, Mon 05 Oct");
    expect(nextDueText([])).toBe("No upcoming dates.");
  });
  it("summarises an assign with skipped users", () => {
    const skipped = (first_name: string) => ({
      user_id: first_name,
      first_name,
      last_name: "X",
      reason: "ALREADY_ASSIGNED",
    });
    const created = { assignment_id: "a", user_id: "u", next_due_dates: [] };
    expect(
      assignResultText({
        created: Array.from({ length: 18 }, () => created),
        skipped: [skipped("Ravi"), skipped("Shahid")],
      }),
    ).toBe("Assigned to 18 users. Skipped 2 who already have this task: Ravi, Shahid.");
    expect(assignResultText({ created: [created], skipped: [] })).toBe("Assigned to 1 user.");
  });
  it("summarises a copy per person (contract §10)", () => {
    const item = {
      task_id: "t",
      task_name: "Gym",
      frequency: "DAILY",
      weekdays: [],
      start_date: "2026-09-01",
      end_date: null,
    };
    expect(
      copyResultText({
        user_id: "u",
        first_name: "Shahid",
        last_name: "K",
        copied: [item, item, item],
        skipped: [{ task_id: "w", task_name: "Wake-up", reason: "ALREADY_ASSIGNED" }],
      }),
    ).toBe("Shahid: 3 copied, 1 skipped (Wake-up)");
  });
});

const TODAY = "2026-10-03";
const issues = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : (result.error?.issues ?? []).map((i) => i.path.join("."));

describe("assignSchema (contract §7)", () => {
  const valid = {
    task_id: "t",
    all_users: false,
    user_ids: ["u"],
    frequency: "DAILY",
    weekdays: [],
    start_date: TODAY,
    end_date: "",
  };
  it("accepts a complete assignment", () => {
    expect(assignSchema(TODAY).safeParse(valid).success).toBe(true);
  });
  it("reports every missing choice at once", () => {
    expect(
      issues(
        assignSchema(TODAY).safeParse({
          ...valid,
          task_id: "",
          user_ids: [],
          frequency: undefined,
        }),
      ),
    ).toEqual(["task_id", "frequency", "user_ids"]);
  });
  it("needs users unless All active users is on", () => {
    expect(issues(assignSchema(TODAY).safeParse({ ...valid, user_ids: [] }))).toEqual(["user_ids"]);
    expect(assignSchema(TODAY).safeParse({ ...valid, user_ids: [], all_users: true }).success).toBe(
      true,
    );
  });
  it("needs a day for Weekly, a start from today and an end after the start", () => {
    expect(
      issues(
        assignSchema(TODAY).safeParse({
          ...valid,
          frequency: "WEEKLY",
          start_date: "2026-10-02",
          end_date: "2026-10-01",
        }),
      ),
    ).toEqual(["weekdays", "start_date", "end_date"]);
  });
});

describe("frequency, end date and copy schemas", () => {
  it("checks a new schedule like Assign does", () => {
    expect(
      issues(
        frequencySchema(TODAY).safeParse({ frequency: "WEEKLY", weekdays: [], start_date: TODAY }),
      ),
    ).toEqual(["weekdays"]);
  });
  it("needs an end date from today and the start, unless No end date", () => {
    const schema = endDateSchema(TODAY, "2026-11-01");
    expect(schema.safeParse({ no_end_date: true, end_date: "" }).success).toBe(true);
    expect(issues(schema.safeParse({ no_end_date: false, end_date: "" }))).toEqual(["end_date"]);
    expect(issues(schema.safeParse({ no_end_date: false, end_date: "2026-10-20" }))).toEqual([
      "end_date",
    ]);
    expect(schema.safeParse({ no_end_date: false, end_date: "2026-11-01" }).success).toBe(true);
  });
  it("won't copy a person to themself", () => {
    expect(
      issues(copySchema.safeParse({ source_user_id: "a", target_user_ids: ["b", "a"] })),
    ).toEqual(["target_user_ids"]);
  });
});
