import { describe, it, expect } from "vitest";
import { DAY_NAMES } from "./constants";

describe("CalendarGrid constants", () => {
  it("DAY_NAMES is an array of 7 strings", () => {
    expect(DAY_NAMES).toHaveLength(7);
    expect(DAY_NAMES).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  });
});
