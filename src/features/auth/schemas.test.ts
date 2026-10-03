import { describe, expect, it } from "vitest";
import { changePasswordSchema, resetPasswordSchema } from "./schemas";

const issues = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) =>
  result.success
    ? []
    : (result.error?.issues ?? []).map((i) => `${i.path.join(".")}: ${i.message}`);

describe("password rule (AUTH-R18)", () => {
  it.each([
    ["abc12345", []],
    ["abcdefgh", ["new_password: Include at least one digit"]],
    ["12345678", ["new_password: Include at least one letter"]],
    ["ab1", ["new_password: At least 8 characters"]],
    ["abcdefgh123456789", ["new_password: At most 16 characters"]],
  ])("%s", (password, expected) => {
    expect(
      issues(resetPasswordSchema.safeParse({ new_password: password, confirm_password: password })),
    ).toEqual(expected);
  });

  it("requires the confirmation to match", () => {
    expect(
      issues(
        resetPasswordSchema.safeParse({ new_password: "abc12345", confirm_password: "abc12346" }),
      ),
    ).toEqual(["confirm_password: Passwords don't match"]);
  });

  it("requires a new password different from the current one", () => {
    expect(
      issues(
        changePasswordSchema.safeParse({
          current_password: "abc12345",
          new_password: "abc12345",
          confirm_password: "abc12345",
        }),
      ),
    ).toEqual(["new_password: Must differ from your current password"]);
  });
});
