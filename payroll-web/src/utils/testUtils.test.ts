import { describe, it, expect } from "vitest";
import { getTestStatusSummary, formatTestDuration, groupTestsByFile } from "./testUtils";

describe("getTestStatusSummary", () => {
  it("should calculate pass percentage", () => {
    const result = getTestStatusSummary(100, 95, 3, 2);
    expect(result.total).toBe(100);
    expect(result.passed).toBe(95);
    expect(result.failed).toBe(3);
    expect(result.skipped).toBe(2);
    expect(result.pct).toBe(95);
  });

  it("should handle zero total", () => {
    const result = getTestStatusSummary(0, 0, 0, 0);
    expect(result.pct).toBe(0);
  });
});

describe("formatTestDuration", () => {
  it("should format milliseconds", () => {
    expect(formatTestDuration(500)).toBe("500ms");
  });

  it("should format seconds", () => {
    expect(formatTestDuration(1500)).toBe("1.5s");
  });
});

describe("groupTestsByFile", () => {
  it("should group tests by file", () => {
    const tests = [
      { file: "a.test.ts", name: "test1", status: "passed" as const },
      { file: "a.test.ts", name: "test2", status: "passed" as const },
      { file: "b.test.ts", name: "test3", status: "failed" as const },
    ];
    const result = groupTestsByFile(tests);
    expect(result["a.test.ts"].passed).toBe(2);
    expect(result["b.test.ts"].failed).toBe(1);
  });
});
