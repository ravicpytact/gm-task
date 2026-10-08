import { describe, expect, it } from "vitest";
import {
  endedText,
  nextDueLabel,
  toDetailAssignmentQuery,
  toDetailHistoryQuery,
  toMyAssignmentListQuery,
  toMyTaskHistoryQuery,
  weekRange,
  type DetailParams,
} from "./utils";

// User Detail, Task Detail (users §5, activities §6), My tasks and My Task Detail (contract §11–12).

const TODAY = "2026-10-08"; // a Thursday
const WEEK = weekRange(TODAY);

const params = (changes: Partial<DetailParams> = {}): DetailParams => ({
  tab: "assignments",
  status: "ACTIVE",
  frequency: null,
  from: null,
  to: null,
  user: null,
  task: null,
  page: 1,
  ...changes,
});

describe("the Assignments tab", () => {
  it("lists one person's assignments by task name", () => {
    expect(toDetailAssignmentQuery(params(), { kind: "user", userId: "u1" })).toEqual({
      page: 1,
      page_size: 20,
      status: "ACTIVE",
      frequency: undefined,
      user_id: "u1",
      task_id: undefined,
      sort_by: "task_name",
      sort_order: "asc",
    });
  });

  it("lists one task's people by name, with the chosen filters", () => {
    const query = toDetailAssignmentQuery(params({ status: "ALL", frequency: "WEEKLY", page: 3 }), {
      kind: "task",
      taskId: "t1",
    });
    expect(query).toMatchObject({
      status: "ALL",
      frequency: "WEEKLY",
      page: 3,
      task_id: "t1",
      user_id: undefined,
      sort_by: "user_name",
    });
  });
});

describe("the History tab", () => {
  it("defaults to this week, for this person, by any task", () => {
    expect(toDetailHistoryQuery(params(), { kind: "user", userId: "u1" }, TODAY)).toEqual({
      date_from: WEEK.from,
      date_to: WEEK.to,
      frequency: undefined,
      user_id: "u1",
      task_id: undefined,
      page: 1,
      page_size: 20,
    });
  });

  it("filters a person's history by task, and a task's history by person", () => {
    const filters = params({ user: "u9", task: "t9", from: "2026-09-01", to: "2026-09-30" });
    expect(toDetailHistoryQuery(filters, { kind: "user", userId: "u1" }, TODAY)).toMatchObject({
      user_id: "u1",
      task_id: "t9",
      date_from: "2026-09-01",
      date_to: "2026-09-30",
    });
    expect(toDetailHistoryQuery(filters, { kind: "task", taskId: "t1" }, TODAY)).toMatchObject({
      user_id: "u9",
      task_id: "t1",
    });
  });
});

describe("My tasks", () => {
  it("asks for the chosen status (Active by default in the URL)", () => {
    expect(toMyAssignmentListQuery({ status: "ACTIVE", page: 2 })).toEqual({
      status: "ACTIVE",
      page: 2,
      page_size: 20,
    });
  });

  it("My Task Detail's history is this task's, this week by default", () => {
    expect(toMyTaskHistoryQuery({ from: null, to: null, page: 1 }, "t1", TODAY)).toEqual({
      date_from: WEEK.from,
      date_to: WEEK.to,
      task_id: "t1",
      page: 1,
      page_size: 20,
    });
  });
});

describe("nextDueLabel", () => {
  it("says Today for today, the day otherwise, and nothing when ended", () => {
    expect(nextDueLabel([TODAY, "2026-10-12"], TODAY)).toBe("Today");
    expect(nextDueLabel(["2026-10-12"], TODAY)).toBe("12 Oct 2026");
    expect(nextDueLabel([], TODAY)).toBeNull();
  });
});

describe("endedText (contract §12)", () => {
  it("names the day and the reason an assignment ended", () => {
    expect(endedText({ status: "ENDED", ended_reason: "DEASSIGNED", ended_on: "2026-09-30" })).toBe(
      "Ended on 30 Sep 2026 (de-assigned)",
    );
    expect(
      endedText({ status: "ENDED", ended_reason: "END_DATE_PASSED", ended_on: "2026-09-30" }),
    ).toBe("Ended on 30 Sep 2026 (end date passed)");
  });

  it("is Active while active", () => {
    expect(endedText({ status: "ACTIVE", ended_reason: null, ended_on: null })).toBe("Active");
  });
});
