import { describe, expect, it, vi } from "vitest";
import { createSingleFlight } from "./single-flight";

// FE-AUTH-003: one refresh token is spent once, however many requests need a new one.
describe("createSingleFlight", () => {
  it("shares one call between concurrent callers with the same key", async () => {
    const run = createSingleFlight<string>(30_000);
    const call = vi.fn(async () => "new-pair");

    const results = await Promise.all(Array.from({ length: 5 }, () => run("token-a", call)));

    expect(call).toHaveBeenCalledTimes(1);
    expect(results).toEqual(Array(5).fill("new-pair"));
  });

  it("gives a just-late caller the same result instead of calling again", async () => {
    let time = 0;
    const run = createSingleFlight<string>(30_000, () => time);
    const call = vi.fn(async () => "new-pair");

    await run("token-a", call);
    time = 29_000;
    await expect(run("token-a", call)).resolves.toBe("new-pair");
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("calls again once the window has passed", async () => {
    let time = 0;
    const run = createSingleFlight<string>(30_000, () => time);
    const call = vi.fn(async () => "pair");

    await run("token-a", call);
    time = 31_000;
    await run("token-a", call);
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("keeps different keys apart", async () => {
    const run = createSingleFlight<string>(30_000);
    const call = vi.fn(async () => "pair");

    await Promise.all([run("token-a", call), run("token-b", call)]);
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("forgets a call that failed, so the next caller may retry", async () => {
    const run = createSingleFlight<string>(30_000);
    const failing = vi.fn(async () => {
      throw new Error("backend down");
    });
    const working = vi.fn(async () => "pair");

    await expect(run("token-a", failing)).rejects.toThrow("backend down");
    await expect(run("token-a", working)).resolves.toBe("pair");
    expect(working).toHaveBeenCalledTimes(1);
  });
});
