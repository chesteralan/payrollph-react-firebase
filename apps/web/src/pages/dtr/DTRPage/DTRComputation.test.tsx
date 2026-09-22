import { describe, it, expect } from "vitest";
import {
  calcHours,
  dateStr,
  daysInMonth,
  firstDayOfMonth,
  dayStatus,
} from "./DTRComputation";
import type { DTREntry } from "@/types/dtr";

describe("calcHours", () => {
  it("calculates hours between two times", () => {
    expect(calcHours("09:00", "17:00")).toBe(8);
  });

  it("returns 0 when timeIn is empty", () => {
    expect(calcHours("", "17:00")).toBe(0);
  });

  it("returns 0 when timeOut is empty", () => {
    expect(calcHours("09:00", "")).toBe(0);
  });

  it("returns 0 when both are empty", () => {
    expect(calcHours("", "")).toBe(0);
  });

  it("returns 0 for overnight (timeOut before timeIn)", () => {
    expect(calcHours("17:00", "09:00")).toBe(0);
  });

  it("handles partial hours", () => {
    expect(calcHours("08:30", "12:00")).toBe(3.5);
  });

  it("rounds to 2 decimal places", () => {
    expect(calcHours("08:00", "11:10")).toBe(3.17);
  });
});

describe("dateStr", () => {
  it("formats date with zero-padded month and day", () => {
    expect(dateStr(2025, 0, 5)).toBe("2025-01-05");
  });

  it("formats date with double-digit day", () => {
    expect(dateStr(2025, 11, 25)).toBe("2025-12-25");
  });

  it("handles single-digit month and day", () => {
    expect(dateStr(2025, 2, 1)).toBe("2025-03-01");
  });
});

describe("daysInMonth", () => {
  it("returns 31 for January", () => {
    expect(daysInMonth(2025, 0)).toBe(31);
  });

  it("returns 28 for February in non-leap year", () => {
    expect(daysInMonth(2025, 1)).toBe(28);
  });

  it("returns 29 for February in leap year", () => {
    expect(daysInMonth(2024, 1)).toBe(29);
  });

  it("returns 30 for April", () => {
    expect(daysInMonth(2025, 3)).toBe(30);
  });
});

describe("firstDayOfMonth", () => {
  it("returns 3 for Wednesday Jan 1 2025", () => {
    expect(firstDayOfMonth(2025, 0)).toBe(3);
  });

  it("returns 0 for Sunday Sep 1 2024", () => {
    expect(firstDayOfMonth(2024, 8)).toBe(0);
  });
});

describe("dayStatus", () => {
  const entryMap = new Map<string, DTREntry>();
  const baseEntry: DTREntry = {
    id: "1",
    employeeId: "emp1",
    date: "2025-01-15",
    timeIn: "09:00",
    timeOut: "17:00",
    hoursWorked: 8,
    overtimeHours: 0,
    lateHours: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("returns 'none' when no entry exists", () => {
    expect(dayStatus(15, 2025, 0, new Map())).toBe("none");
  });

  it("returns 'absent' when entry has absenceType", () => {
    const map = new Map<string, DTREntry>();
    map.set("2025-01-15", { ...baseEntry, absenceType: "absent" });
    expect(dayStatus(15, 2025, 0, map)).toBe("absent");
  });

  it("returns 'complete' when both timeIn and timeOut exist", () => {
    const map = new Map<string, DTREntry>();
    map.set("2025-01-15", { ...baseEntry });
    expect(dayStatus(15, 2025, 0, map)).toBe("complete");
  });

  it("returns 'partial' when only timeIn exists", () => {
    const map = new Map<string, DTREntry>();
    map.set("2025-01-15", { ...baseEntry, timeOut: undefined });
    expect(dayStatus(15, 2025, 0, map)).toBe("partial");
  });

  it("returns 'partial' when only timeOut exists", () => {
    const map = new Map<string, DTREntry>();
    map.set("2025-01-15", { ...baseEntry, timeIn: undefined });
    expect(dayStatus(15, 2025, 0, map)).toBe("partial");
  });
});
