import { describe, expect, it } from "vitest";
import { HOME_PATH, safeNextPath } from "./constants";

// FE-AUTH-004: a redirect after login never leaves the app's origin.
describe("safeNextPath", () => {
  it.each([
    ["/tasks?status=active", "/tasks?status=active"],
    [null, HOME_PATH],
    ["", HOME_PATH],
    ["https://evil.example", HOME_PATH],
    ["//evil.example", HOME_PATH],
    ["/\\evil.example", HOME_PATH],
    ["javascript:alert(1)", HOME_PATH],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
