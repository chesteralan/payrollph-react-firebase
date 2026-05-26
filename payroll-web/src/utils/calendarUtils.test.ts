import { describe, it, expect } from "vitest";
import { calculateWorkingDaysSync } from "./calendarUtils";

describe("calculateWorkingDaysSync", () => {
  it("should count weekdays as working days in a normal week", () => {
    // Mon Jan 1, 2024 - Sun Jan 7, 2024
    const result = calculateWorkingDaysSync("2024-01-01", "2024-01-07", []);
    expect(result.totalWorkingDays).toBe(5); // Mon-Fri
    expect(result.holidaysSubtracted).toBe(0);
    expect(result.specialWorkdaysAdded).toBe(0);
  });

  it("should count no working days in a weekend-only range", () => {
    // Sat Jan 6 - Sun Jan 7, 2024
    const result = calculateWorkingDaysSync("2024-01-06", "2024-01-07", []);
    expect(result.totalWorkingDays).toBe(0);
  });

  it("should subtract weekday holidays", () => {
    // Mon Jan 1 - Fri Jan 5, 2024 (5 weekdays)
    // Jan 1 is New Year's (holiday)
    const holidays = [
      {
        id: "1",
        companyId: "global",
        date: new Date("2024-01-01"),
        type: "holiday" as const,
        name: "New Year's Day",
      },
    ];
    const result = calculateWorkingDaysSync("2024-01-01", "2024-01-05", holidays);
    expect(result.totalWorkingDays).toBe(4); // 5 weekdays - 1 holiday
    expect(result.holidaysSubtracted).toBe(1);
  });

  it("should add special workdays on weekends", () => {
    // Sat Jan 6 - Sun Jan 7, 2024
    // Both declared as workdays
    const specialWorkdays = [
      {
        id: "1",
        companyId: "global",
        date: new Date("2024-01-06"),
        type: "workday" as const,
        name: "Special Working Day",
      },
      {
        id: "2",
        companyId: "global",
        date: new Date("2024-01-07"),
        type: "workday" as const,
        name: "Special Working Day 2",
      },
    ];
    const result = calculateWorkingDaysSync("2024-01-06", "2024-01-07", specialWorkdays);
    expect(result.totalWorkingDays).toBe(2);
    expect(result.specialWorkdaysAdded).toBe(2);
  });

  it("should not add special workday on weekday (already counted)", () => {
    // Wed Jan 3, 2024 - already a weekday
    const workday = [
      {
        id: "1",
        companyId: "global",
        date: new Date("2024-01-03"),
        type: "workday" as const,
        name: "Extra Workday",
      },
    ];
    const result = calculateWorkingDaysSync("2024-01-03", "2024-01-03", workday);
    expect(result.totalWorkingDays).toBe(1);
    expect(result.specialWorkdaysAdded).toBe(0); // Already a weekday
  });

  it("should handle holidays on weekends (not subtracted)", () => {
    // Sat Jan 6 - Sun Jan 7, 2024 - no weekdays, so no subtraction
    const holidays = [
      {
        id: "1",
        companyId: "global",
        date: new Date("2024-01-06"),
        type: "holiday" as const,
        name: "Weekend Holiday",
      },
    ];
    const result = calculateWorkingDaysSync("2024-01-06", "2024-01-07", holidays);
    expect(result.totalWorkingDays).toBe(0);
    expect(result.holidaysSubtracted).toBe(0); // Weekend holiday doesn't subtract
  });

  it("should provide detailed breakdown of each day", () => {
    const start = "2024-01-01";
    const end = "2024-01-03";
    const holidays = [
      {
        id: "1",
        companyId: "global",
        date: new Date("2024-01-01"),
        type: "holiday" as const,
        name: "New Year's Day",
      },
    ];
    const result = calculateWorkingDaysSync(start, end, holidays);
    expect(result.details).toHaveLength(3);
    expect(result.details[0]).toEqual({
      date: "2024-01-01",
      type: "holiday",
      name: "New Year's Day",
    });
    expect(result.details[1]).toEqual({
      date: "2024-01-02",
      type: "working",
    });
    expect(result.details[2]).toEqual({
      date: "2024-01-03",
      type: "working",
    });
  });

  it("should handle special holidays (special non-working days)", () => {
    const specials = [
      {
        id: "1",
        companyId: "global",
        date: new Date("2024-01-02"),
        type: "special" as const,
        name: "Special Non-Working Day",
      },
    ];
    const result = calculateWorkingDaysSync("2024-01-01", "2024-01-05", specials);
    expect(result.totalWorkingDays).toBe(4); // 5 weekdays - 1 special non-working
    expect(result.holidaysSubtracted).toBe(1);
  });

  it("should handle pay period boundaries (1st-15th)", () => {
    // Jan 1-15, 2024 = 11 weekdays (Jan 1 holiday)
    const holidays = [
      {
        id: "1",
        companyId: "global",
        date: new Date("2024-01-01"),
        type: "holiday" as const,
        name: "New Year's Day",
      },
    ];
    const result = calculateWorkingDaysSync("2024-01-01", "2024-01-15", holidays);
    // Weekdays: Jan 1-5 (Mon-Fri), Jan 8-12 (Mon-Fri), Jan 15 (Mon) = 11
    // Minus 1 holiday = 10
    expect(result.totalWorkingDays).toBe(10);
    expect(result.holidaysSubtracted).toBe(1);
  });

  it("should handle pay period boundaries (16th-end)", () => {
    // Jan 16-31, 2024
    const result = calculateWorkingDaysSync("2024-01-16", "2024-01-31", []);
    // Weekdays: Jan 16-19 (Tue-Fri), Jan 22-26 (Mon-Fri), Jan 29-31 (Mon-Wed)
    // = 4 + 5 + 3 = 12
    expect(result.totalWorkingDays).toBe(12);
  });

  it("should handle leap year February", () => {
    // Feb 1-29, 2024 (leap year)
    const result = calculateWorkingDaysSync("2024-02-01", "2024-02-29", []);
    // Feb 1-29, 2024 = 21 weekdays (leap year)
    expect(result.totalWorkingDays).toBe(21);
  });

  it("should handle non-leap year February", () => {
    // Feb 1-28, 2023 (non-leap)
    const result = calculateWorkingDaysSync("2023-02-01", "2023-02-28", []);
    // Feb 1-28, 2023 = 20 weekdays
    expect(result.totalWorkingDays).toBe(20);
  });

  it("should handle single-day range on weekday", () => {
    const result = calculateWorkingDaysSync("2024-01-03", "2024-01-03", []);
    expect(result.totalWorkingDays).toBe(1);
    expect(result.details).toHaveLength(1);
    expect(result.details[0].type).toBe("working");
  });

  it("should handle single-day range on weekend", () => {
    const result = calculateWorkingDaysSync("2024-01-06", "2024-01-06", []);
    expect(result.totalWorkingDays).toBe(0);
    expect(result.details[0].type).toBe("weekend");
  });

  it("should handle string date entries in calendar array", () => {
    const holidays = [
      {
        id: "1",
        companyId: "global",
        date: "2024-01-01" as unknown as Date,
        type: "holiday" as const,
        name: "New Year's Day",
      },
    ];
    const result = calculateWorkingDaysSync("2024-01-01", "2024-01-05", holidays);
    expect(result.totalWorkingDays).toBe(4);
    expect(result.holidaysSubtracted).toBe(1);
  });

  it("should filter out calendar entries outside the date range", () => {
    const holidays = [
      {
        id: "1",
        companyId: "global",
        date: new Date("2024-01-01"),
        type: "holiday" as const,
        name: "New Year's Day",
      },
      {
        id: "2",
        companyId: "global",
        date: new Date("2024-06-12"),
        type: "holiday" as const,
        name: "Independence Day",
      },
    ];
    // Only looking at Jan, so Independence Day should be filtered out
    const result = calculateWorkingDaysSync("2024-01-01", "2024-01-31", holidays);
    expect(result.holidaysSubtracted).toBe(1); // Only New Year
  });
});
