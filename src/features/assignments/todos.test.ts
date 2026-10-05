import { describe, expect, it } from "vitest";
import { formatMonth, formatMonthShort } from "@/lib/format";
import { otherAnswerSchema, timeAnswerSchema } from "./schemas";
import {
  addDays,
  answerText,
  calendarWeeks,
  shiftMonth,
  toHistoryQuery,
  toTodoListQuery,
  weekRange,
} from "./utils";

describe("calendar days", () => {
  it("adds days across months and leap days", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("finds Monday to Sunday of a week", () => {
    expect(weekRange("2026-10-03")).toEqual({ from: "2026-09-28", to: "2026-10-04" }); // a Saturday
    expect(weekRange("2026-09-28")).toEqual({ from: "2026-09-28", to: "2026-10-04" }); // a Monday
    expect(weekRange("2026-10-04")).toEqual({ from: "2026-09-28", to: "2026-10-04" }); // a Sunday
  });
  it("moves and names months", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(formatMonth("2026-10")).toBe("October 2026");
    expect(formatMonthShort("2026-09")).toBe("Sep");
  });
  it("lays a month out in Monday-first weeks", () => {
    const weeks = calendarWeeks("2026-10"); // 1 Oct 2026 is a Thursday
    expect(weeks[0]).toEqual([
      null,
      null,
      null,
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });
});

describe("queries", () => {
  it("leaves the date out for today, so the server decides it", () => {
    expect(toTodoListQuery({ date: null, frequency: null, search: "", page: 1 })).toEqual({
      date: undefined,
      frequency: undefined,
      search: undefined,
      page: 1,
      page_size: 20,
    });
  });
  it("defaults history to the current week", () => {
    const query = toHistoryQuery(
      { from: null, to: null, user: null, task: null, frequency: "DAILY", page: 2 },
      "2026-10-03",
    );
    expect(query).toMatchObject({
      date_from: "2026-09-28",
      date_to: "2026-10-04",
      frequency: "DAILY",
      page: 2,
    });
  });
});

describe("answers (contract §3–4)", () => {
  const food = { type: "FOOD", options: [{ value: "AVERAGE", label: "Average" }] };
  it("shows answers as words", () => {
    expect(answerText({ response_value: "AVERAGE", is_other: false }, food)).toBe("Average");
    expect(answerText({ response_value: "10", is_other: true }, undefined)).toBe("10 (Other)");
    expect(answerText({ response_value: "06:30", is_other: false }, undefined)).toBe("06:30");
  });
  it("takes a 24-hour time", () => {
    expect(timeAnswerSchema.safeParse("06:30").success).toBe(true);
    expect(timeAnswerSchema.safeParse("24:00").success).toBe(false);
    expect(timeAnswerSchema.safeParse("6:30").success).toBe(false);
  });
  it("takes Other as a whole number of 5 or more", () => {
    expect(otherAnswerSchema.safeParse(" 10 ").data).toBe("10");
    for (const bad of ["4", "5.5", "", "abc", "-7"]) {
      expect(otherAnswerSchema.safeParse(bad).error?.issues[0]?.message).toBe(
        "Enter a whole number of 5 or more.",
      );
    }
  });
});
