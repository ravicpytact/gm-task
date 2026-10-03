import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";
import { unwrap, unwrapEmpty, unwrapWithEtag } from "./unwrap";

const ok = <T>(data: T, headers: Record<string, string> = {}) =>
  Promise.resolve({
    data: { data, message: "ok" },
    response: new Response(null, { status: 200, headers }),
  });

const failed = (status: number, body: unknown) =>
  Promise.resolve({ error: body, response: new Response(null, { status }) });

// FE-API-003, FE-API-005
describe("unwrap", () => {
  it("returns the envelope's data", async () => {
    await expect(unwrap(ok({ id: "1" }))).resolves.toEqual({ id: "1" });
  });

  it("throws ApiError for an error envelope", async () => {
    const error = await unwrap(
      failed(404, { error: { code: "NOT_FOUND", details: [] }, message: "Task not found" }),
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("turns a network failure into ApiError with status 0", async () => {
    const error = await unwrap(Promise.reject(new TypeError("fetch failed"))).catch(
      (e: unknown) => e,
    );
    expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });

  it("throws when a success response has no data", async () => {
    await expect(unwrap(ok(null))).rejects.toMatchObject({ code: "EMPTY_RESPONSE" });
  });
});

describe("unwrapWithEtag", () => {
  it("returns the data and the ETag a later write must send", async () => {
    await expect(unwrapWithEtag(ok({ id: "1" }, { ETag: '"20261002T101500Z"' }))).resolves.toEqual({
      data: { id: "1" },
      etag: '"20261002T101500Z"',
    });
  });

  it("refuses a versioned read without an ETag", async () => {
    await expect(unwrapWithEtag(ok({ id: "1" }))).rejects.toMatchObject({ code: "MISSING_ETAG" });
  });
});

describe("unwrapEmpty", () => {
  it("accepts a 204", async () => {
    await expect(
      unwrapEmpty(Promise.resolve({ response: new Response(null, { status: 204 }) })),
    ).resolves.toBeUndefined();
  });
});
