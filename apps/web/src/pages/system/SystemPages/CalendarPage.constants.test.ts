import { describe, it, expect } from "vitest";
import { CALENDAR_TYPE_COLORS } from "./CalendarPage.constants";

describe("CalendarPage constants", () => {
  it("CALENDAR_TYPE_COLORS contains holiday, special, workday", () => {
    expect(Object.keys(CALENDAR_TYPE_COLORS)).toEqual(
      expect.arrayContaining(["holiday", "special", "workday"]),
    );
    expect(Object.keys(CALENDAR_TYPE_COLORS)).toHaveLength(3);
  });

  it("each color value is a string", () => {
    for (const color of Object.values(CALENDAR_TYPE_COLORS)) {
      expect(typeof color).toBe("string");
    }
  });
});
