import { describe, expect, it, vi } from "vitest";
import { ApiError, applyFieldErrors, toUserMessage } from "./errors";

const response = (status: number, requestId = "req-1") =>
  new Response(null, { status, headers: { "X-Request-ID": requestId } });

const backendError = (
  status: number,
  code: string,
  message: string,
  details: { field: string; issue: string }[] = [],
) => ApiError.fromResponse(response(status), { error: { code, details }, message });

describe("ApiError.fromResponse", () => {
  it("reads the backend envelope and the request ID", () => {
    const error = backendError(409, "EMAIL_EXISTS", "Email already in use", [
      { field: "email", issue: "Taken" },
    ]);
    expect(error).toMatchObject({
      status: 409,
      code: "EMAIL_EXISTS",
      message: "Email already in use",
      details: [{ field: "email", issue: "Taken" }],
      requestId: "req-1",
      hasBackendMessage: true,
    });
  });

  it("falls back when the body is not an envelope", () => {
    const error = ApiError.fromResponse(response(502), "Bad Gateway");
    expect(error.code).toBe("HTTP_502");
    expect(error.hasBackendMessage).toBe(false);
  });
});

// FE-API-004
describe("toUserMessage", () => {
  it("shows the backend's message for a 4xx", () => {
    expect(
      toUserMessage(backendError(401, "INVALID_CREDENTIALS", "Invalid email or password.")),
    ).toBe("Invalid email or password.");
  });

  it("uses the status table when the backend sent no message", () => {
    expect(toUserMessage(ApiError.fromResponse(response(412), null))).toBe(
      "Someone else changed this. Reload to see their changes.",
    );
  });

  it("adds the request ID to unexpected errors, never the raw text", () => {
    const message = toUserMessage(
      backendError(500, "INTERNAL", "Traceback (most recent call last)…"),
    );
    expect(message).toBe("Something went wrong. Try again. (Ref: req-1)");
  });

  it("prefers a feature's override for its own code", () => {
    const error = backendError(409, "EMAIL_EXISTS", "Conflict");
    expect(toUserMessage(error, { EMAIL_EXISTS: "That email already has an account." })).toBe(
      "That email already has an account.",
    );
  });

  it("never shows a non-API error's text", () => {
    expect(toUserMessage(new TypeError("Cannot read properties of undefined"))).toBe(
      "Something went wrong. Try again.",
    );
  });
});

describe("applyFieldErrors", () => {
  it("puts each detail under its field", () => {
    const setError = vi.fn();
    const applied = applyFieldErrors(
      backendError(400, "VALIDATION_FAILED", "Validation failed", [
        { field: "email", issue: "Not a valid email" },
        { field: "first_name", issue: "Required" },
      ]),
      setError,
    );
    expect(applied).toBe(true);
    expect(setError).toHaveBeenCalledWith("email", {
      type: "server",
      message: "Not a valid email",
    });
    expect(setError).toHaveBeenCalledWith("first_name", { type: "server", message: "Required" });
  });

  it("reports false when there are no field details", () => {
    expect(applyFieldErrors(backendError(409, "CONFLICT", "Conflict"), vi.fn())).toBe(false);
  });
});
