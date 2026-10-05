import { describe, expect, it } from "vitest";
import {
  includesToday,
  rangeHeader,
  rangeProblem,
  stepRange,
  toMyReportQuery,
  toReportQuery,
  type ReportParams,
} from "./utils";

const params = (over: Partial<ReportParams> = {}): ReportParams => ({
  range: "DAY",
  day: null,
  week: null,
  month: null,
  from: null,
  to: null,
  user: null,
  page: 1,
  ...over,
});

describe("report queries", () => {
  it("sends only the field of the chosen range type", () => {
    expect(
      toMyReportQuery(params({ range: "WEEK", week: "2026-09-28", day: "2026-10-01" })),
    ).toEqual({
      range_type: "WEEK",
      day: undefined,
      week_start: "2026-09-28",
      month: undefined,
      date_from: undefined,
      date_to: undefined,
    });
  });
  it("leaves the day out for today, so the server decides it", () => {
    expect(toMyReportQuery(params()).day).toBeUndefined();
  });
  it("adds the person and the page for the Admin report", () => {
    expect(toReportQuery(params({ user: "u1", page: 2 }))).toMatchObject({
      user_id: "u1",
      page: 2,
      page_size: 20,
    });
  });
  it("waits for a complete, ordered custom range", () => {
    expect(rangeProblem(params({ range: "CUSTOM" }))).toBe("Choose the start and end dates.");
    expect(rangeProblem(params({ range: "CUSTOM", from: "2026-10-05", to: "2026-10-01" }))).toBe(
      "The start date must be on or before the end date.",
    );
    expect(
      rangeProblem(params({ range: "CUSTOM", from: "2026-10-01", to: "2026-10-05" })),
    ).toBeNull();
    expect(rangeProblem(params())).toBeNull();
  });
});

const range = (range_type: string, date_from: string, date_to: string) => ({
  range_type,
  date_from,
  date_to,
  today: "2026-10-03",
});

describe("range header and steps (contract §1)", () => {
  it("names the range", () => {
    expect(rangeHeader(range("DAY", "2026-10-01", "2026-10-01"))).toBe("Day: 01 Oct 2026");
    expect(rangeHeader(range("WEEK", "2026-09-28", "2026-10-04"))).toBe(
      "Week: 28 Sep – 04 Oct 2026",
    );
    expect(rangeHeader(range("MONTH", "2026-09-01", "2026-09-30"))).toBe("Month: September 2026");
    expect(rangeHeader(range("CUSTOM", "2025-12-20", "2026-01-10"))).toBe(
      "Range: 20 Dec 2025 – 10 Jan 2026",
    );
  });
  it("steps a day, a week or a month", () => {
    expect(stepRange(range("DAY", "2026-10-01", "2026-10-01"), -1)).toEqual({ day: "2026-09-30" });
    expect(stepRange(range("WEEK", "2026-09-28", "2026-10-04"), 1)).toEqual({ week: "2026-10-05" });
    expect(stepRange(range("MONTH", "2026-12-01", "2026-12-31"), 1)).toEqual({ month: "2027-01" });
  });
  it("knows whether today is in view", () => {
    expect(includesToday(range("WEEK", "2026-09-28", "2026-10-04"))).toBe(true);
    expect(includesToday(range("DAY", "2026-10-01", "2026-10-01"))).toBe(false);
  });
});
