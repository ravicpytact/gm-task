import { describe, expect, it } from "vitest";
import type { TaskTypeInfo } from "./types";
import { answerPreview, toTaskListQuery, typeLabel } from "./utils";

const number: TaskTypeInfo = {
  type: "NUMBER",
  label: "Number",
  options: ["1", "2", "3", "4"]
    .map((v) => ({ value: v, label: v }))
    .concat({ value: "NO", label: "No" }),
  accepts_time: false,
  has_other: true,
  other_min: 5,
};
const time: TaskTypeInfo = {
  type: "TIME",
  label: "Time",
  options: [],
  accepts_time: true,
  has_other: false,
};

describe("answerPreview (Screen 17)", () => {
  it("lists the answers, with Other for 5 or more", () => {
    expect(answerPreview(number)).toBe("1, 2, 3, 4, No, Other (5 or more)");
  });
  it("describes a time answer", () => {
    expect(answerPreview(time)).toBe("Any time, e.g. 06:30");
  });
});

describe("typeLabel", () => {
  it("prefers the backend's label, falls back to ours, then to the code", () => {
    expect(typeLabel("NUMBER", [number])).toBe("Number");
    expect(typeLabel("YES_NO", undefined)).toBe("Yes-No");
    expect(typeLabel("SOMETHING_NEW", undefined)).toBe("SOMETHING_NEW");
  });
});

describe("toTaskListQuery", () => {
  it("sends only the filters that are set", () => {
    expect(
      toTaskListQuery({
        page: 2,
        search: "",
        type: "FOOD",
        status: null,
        sort: "name",
        order: "asc",
      }),
    ).toEqual({
      page: 2,
      page_size: 20,
      sort_by: "name",
      sort_order: "asc",
      search: undefined,
      type: "FOOD",
      status: undefined,
    });
  });
});
