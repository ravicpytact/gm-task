import { describe, expect, it } from "vitest";
import { toUserListQuery } from "./utils";

describe("toUserListQuery", () => {
  const base = {
    page: 1,
    search: "",
    status: null,
    role: null,
    sort: "first_name",
    order: "asc",
  } as const;

  it("sends only the filters that are set", () => {
    expect(toUserListQuery(base)).toEqual({
      page: 1,
      page_size: 20,
      sort_by: "first_name",
      sort_order: "asc",
      search: undefined,
      status: undefined,
      role: undefined,
    });
  });

  it("passes the role code straight through, as the backend expects", () => {
    expect(
      toUserListQuery({ ...base, role: "USER", status: "INVITED", search: "raja" }),
    ).toMatchObject({ role: "USER", status: "INVITED", search: "raja" });
  });
});
