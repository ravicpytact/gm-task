import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatNumber, formatTime, toApiDate } from "./index";

// FE-UI-008: one format each, moments in IST, calendar days never shifted.
describe("format", () => {
  it("shows a UTC moment in IST", () => {
    expect(formatDateTime("2026-09-01T05:30:00Z")).toBe("01 Sep 2026, 11:00 AM");
    expect(formatTime("2026-10-01T04:00:00Z")).toBe("09:30 AM");
  });

  it("moves a late-evening UTC moment to the next IST day", () => {
    expect(formatDate("2026-09-30T20:00:00Z")).toBe("01 Oct 2026");
  });

  it("never shifts a calendar day", () => {
    expect(formatDate("2026-10-01")).toBe("01 Oct 2026");
  });

  it("gives the API the IST calendar day", () => {
    expect(toApiDate(new Date("2026-09-30T20:00:00Z"))).toBe("2026-10-01");
  });

  it("groups numbers the Indian way", () => {
    expect(formatNumber(123456)).toBe("1,23,456");
  });
});
