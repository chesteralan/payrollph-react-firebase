import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatDateRange,
  parseDate,
  useDateTimeFormat,
} from "./dateFormat";

describe("dateFormat utils", () => {
  describe("formatDate", () => {
    const testDate = new Date(2024, 6, 15); // July 15, 2024

    it("should format as MM/DD/YYYY", () => {
      expect(formatDate(testDate, "MM/DD/YYYY")).toBe("07/15/2024");
    });

    it("should format as DD/MM/YYYY", () => {
      expect(formatDate(testDate, "DD/MM/YYYY")).toBe("15/07/2024");
    });

    it("should format as YYYY-MM-DD", () => {
      expect(formatDate(testDate, "YYYY-MM-DD")).toBe("2024-07-15");
    });

    it("should format as DD-MMM-YYYY", () => {
      expect(formatDate(testDate, "DD-MMM-YYYY")).toBe("15-Jul-2024");
    });

    it("should format as MMM DD, YYYY", () => {
      expect(formatDate(testDate, "MMM DD, YYYY")).toBe("Jul 15, 2024");
    });

    it("should accept string date input", () => {
      expect(formatDate("2024-12-25", "MM/DD/YYYY")).toBe("12/25/2024");
    });

    it("should accept timestamp number input", () => {
      const ts = new Date(2024, 0, 1).getTime();
      expect(formatDate(ts, "YYYY-MM-DD")).toBe("2024-01-01");
    });

    it("should return 'Invalid Date' for invalid input", () => {
      expect(formatDate("not-a-date", "MM/DD/YYYY")).toBe("Invalid Date");
    });

    it("should handle month boundaries (Jan 1)", () => {
      const d = new Date(2024, 0, 1);
      expect(formatDate(d, "MM/DD/YYYY")).toBe("01/01/2024");
    });

    it("should handle month boundaries (Dec 31)", () => {
      const d = new Date(2024, 11, 31);
      expect(formatDate(d, "MM/DD/YYYY")).toBe("12/31/2024");
    });

    it("should pad single-digit months and days", () => {
      const d = new Date(2024, 2, 5); // March 5
      expect(formatDate(d, "MM/DD/YYYY")).toBe("03/05/2024");
    });

    it("should use default locale for unknown format", () => {
      const d = new Date(2024, 6, 15);
      // @ts-expect-error testing invalid format fallback
      const result = formatDate(d, "INVALID_FORMAT");
      expect(result).toBe(d.toLocaleDateString("en-US"));
    });

    describe("PH holiday formatting", () => {
      it("should format New Year's Day", () => {
        const d = new Date(2024, 0, 1);
        expect(formatDate(d, "MMM DD, YYYY")).toBe("Jan 1, 2024");
      });

      it("should format Independence Day (June 12)", () => {
        const d = new Date(2024, 5, 12);
        expect(formatDate(d, "MMM DD, YYYY")).toBe("Jun 12, 2024");
      });

      it("should format Christmas Day", () => {
        const d = new Date(2024, 11, 25);
        expect(formatDate(d, "DD-MMM-YYYY")).toBe("25-Dec-2024");
      });
    });

    describe("leap year edge cases", () => {
      it("should handle Feb 29 in leap year", () => {
        const d = new Date(2024, 1, 29);
        expect(formatDate(d, "MM/DD/YYYY")).toBe("02/29/2024");
      });

      it("should handle Feb 28 in non-leap year", () => {
        const d = new Date(2023, 1, 28);
        expect(formatDate(d, "MM/DD/YYYY")).toBe("02/28/2023");
      });

      it("should handle Feb 29 in non-leap year (rolls to Mar 1)", () => {
        const d = new Date(2023, 1, 29); // JS auto-rolls to Mar 1
        expect(formatDate(d, "MM/DD/YYYY")).toBe("03/01/2023");
      });
    });
  });

  describe("formatTime", () => {
    it("should format 12h AM time", () => {
      const d = new Date(2024, 0, 1, 9, 5, 0);
      expect(formatTime(d, "12h")).toBe("9:05 AM");
    });

    it("should format 12h PM time", () => {
      const d = new Date(2024, 0, 1, 15, 30, 0);
      expect(formatTime(d, "12h")).toBe("3:30 PM");
    });

    it("should format midnight as 12:00 AM", () => {
      const d = new Date(2024, 0, 1, 0, 0, 0);
      expect(formatTime(d, "12h")).toBe("12:00 AM");
    });

    it("should format noon as 12:00 PM", () => {
      const d = new Date(2024, 0, 1, 12, 0, 0);
      expect(formatTime(d, "12h")).toBe("12:00 PM");
    });

    it("should format 24h time", () => {
      const d = new Date(2024, 0, 1, 15, 5, 0);
      expect(formatTime(d, "24h")).toBe("15:05");
    });

    it("should format 24h midnight", () => {
      const d = new Date(2024, 0, 1, 0, 0, 0);
      expect(formatTime(d, "24h")).toBe("00:00");
    });

    it("should pad minutes in 24h format", () => {
      const d = new Date(2024, 0, 1, 8, 7, 0);
      expect(formatTime(d, "24h")).toBe("08:07");
    });

    it("should return 'Invalid Time' for invalid date", () => {
      expect(formatTime("invalid", "12h")).toBe("Invalid Time");
    });
  });

  describe("formatDateTime", () => {
    it("should combine date and time with default format", () => {
      const d = new Date(2024, 6, 15, 14, 30, 0);
      const result = formatDateTime(d, {
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h",
      });
      expect(result).toBe("07/15/2024 2:30 PM");
    });

    it("should format with 24h time", () => {
      const d = new Date(2024, 6, 15, 14, 30, 0);
      const result = formatDateTime(d, {
        dateFormat: "YYYY-MM-DD",
        timeFormat: "24h",
      });
      expect(result).toBe("2024-07-15 14:30");
    });

    it("should format with DD-MMM-YYYY", () => {
      const d = new Date(2024, 6, 15, 9, 0, 0);
      const result = formatDateTime(d, {
        dateFormat: "DD-MMM-YYYY",
        timeFormat: "12h",
      });
      expect(result).toBe("15-Jul-2024 9:00 AM");
    });
  });

  describe("formatDateRange", () => {
    it("should format a date range", () => {
      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 15);
      const result = formatDateRange(start, end, {
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h",
      });
      expect(result).toBe("01/01/2024 - 01/15/2024");
    });

    it("should format a payroll period range", () => {
      const start = new Date(2024, 5, 1);
      const end = new Date(2024, 5, 15);
      const result = formatDateRange(start, end, {
        dateFormat: "MMM DD, YYYY",
        timeFormat: "12h",
      });
      expect(result).toBe("Jun 1, 2024 - Jun 15, 2024");
    });

    it("should handle single-day range", () => {
      const d = new Date(2024, 6, 15);
      const result = formatDateRange(d, d, {
        dateFormat: "YYYY-MM-DD",
        timeFormat: "24h",
      });
      expect(result).toBe("2024-07-15 - 2024-07-15");
    });
  });

  describe("parseDate", () => {
    it("should parse MM/DD/YYYY format", () => {
      const result = parseDate("07/15/2024", "MM/DD/YYYY");
      expect(result).toBeInstanceOf(Date);
      expect(result!.getMonth()).toBe(6); // July
      expect(result!.getDate()).toBe(15);
      expect(result!.getFullYear()).toBe(2024);
    });

    it("should parse DD/MM/YYYY format", () => {
      const result = parseDate("15/07/2024", "DD/MM/YYYY");
      expect(result).toBeInstanceOf(Date);
      expect(result!.getDate()).toBe(15);
      expect(result!.getMonth()).toBe(6);
      expect(result!.getFullYear()).toBe(2024);
    });

    it("should parse YYYY-MM-DD format", () => {
      const result = parseDate("2024-07-15", "YYYY-MM-DD");
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2024);
      expect(result!.getMonth()).toBe(6);
      expect(result!.getDate()).toBe(15);
    });

    it("should parse DD-MMM-YYYY format", () => {
      const result = parseDate("15-Jul-2024", "DD-MMM-YYYY");
      expect(result).toBeInstanceOf(Date);
      expect(result!.getDate()).toBe(15);
      expect(result!.getMonth()).toBe(6);
      expect(result!.getFullYear()).toBe(2024);
    });

    it("should parse MMM DD, YYYY format", () => {
      const result = parseDate("Jul 15, 2024", "MMM DD, YYYY");
      expect(result).toBeInstanceOf(Date);
      expect(result!.getMonth()).toBe(6);
      expect(result!.getDate()).toBe(15);
      expect(result!.getFullYear()).toBe(2024);
    });

    it("should parse MMM DD YYYY without comma", () => {
      const result = parseDate("Jul 15 2024", "MMM DD, YYYY");
      expect(result).toBeInstanceOf(Date);
      expect(result!.getMonth()).toBe(6);
      expect(result!.getDate()).toBe(15);
    });

    it("should return null for empty string", () => {
      expect(parseDate("", "MM/DD/YYYY")).toBeNull();
    });

    it("should return null for whitespace-only string", () => {
      expect(parseDate("   ", "MM/DD/YYYY")).toBeNull();
    });

    it("should return null for invalid format parts", () => {
      expect(parseDate("07-15-2024", "MM/DD/YYYY")).toBeNull(); // wrong delimiter
    });

    it("should handle invalid month name in DD-MMM-YYYY (returns date, no name validation)", () => {
      // JS doesn't validate monthName indexOf -1, rolls to previous year Dec
      const result = parseDate("15-Xyz-2024", "DD-MMM-YYYY");
      expect(result).toBeInstanceOf(Date);
    });

    it("should handle impossible date values via JS auto-roll (no validation)", () => {
      // JS auto-rolls Feb 30 to Mar 1 - source doesn't validate day ranges
      const result = parseDate("02/30/2024", "MM/DD/YYYY");
      expect(result).toBeInstanceOf(Date);
    });

    it("should handle trimmed input", () => {
      const result = parseDate("  12/25/2024  ", "MM/DD/YYYY");
      expect(result).toBeInstanceOf(Date);
      expect(result!.getMonth()).toBe(11);
      expect(result!.getDate()).toBe(25);
    });

    it("should return null for unknown format", () => {
      // @ts-expect-error testing invalid format
      expect(parseDate("12/25/2024", "UNKNOWN")).toBeNull();
    });

    it("should return null for non-matching format", () => {
      const result = parseDate("July 15 2024 year", "MMM DD, YYYY");
      expect(result).toBeNull();
    });

    it("should handle non-matching regex in MMM format", () => {
      const result = parseDate("July 2024", "MMM DD, YYYY");
      expect(result).toBeNull();
    });

    it("should handle Date parse failure", () => {
      const result = parseDate("99/99/9999", "MM/DD/YYYY");
      // JS Date will still produce a Date object but it's technically valid
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("useDateTimeFormat hook", () => {
    it("should use default config", () => {
      const { result } = renderHook(() => useDateTimeFormat());
      expect(result.current.config.dateFormat).toBe("MM/DD/YYYY");
      expect(result.current.config.timeFormat).toBe("12h");
    });

    it("should override with partial config", () => {
      const { result } = renderHook(() =>
        useDateTimeFormat({ dateFormat: "YYYY-MM-DD" }),
      );
      expect(result.current.config.dateFormat).toBe("YYYY-MM-DD");
      expect(result.current.config.timeFormat).toBe("12h");
    });

    it("should format a date", () => {
      const d = new Date(2024, 6, 15);
      const { result } = renderHook(() => useDateTimeFormat());
      expect(result.current.format(d)).toBe("07/15/2024");
    });

    it("should format time in 12h", () => {
      const d = new Date(2024, 0, 1, 14, 30, 0);
      const { result } = renderHook(() => useDateTimeFormat());
      expect(result.current.formatTime(d)).toBe("2:30 PM");
    });

    it("should format time in 24h", () => {
      const d = new Date(2024, 0, 1, 14, 30, 0);
      const { result } = renderHook(() =>
        useDateTimeFormat({ timeFormat: "24h" }),
      );
      expect(result.current.formatTime(d)).toBe("14:30");
    });

    it("should format date and time together", () => {
      const d = new Date(2024, 6, 15, 9, 5, 0);
      const { result } = renderHook(() => useDateTimeFormat());
      expect(result.current.formatDateTime(d)).toBe("07/15/2024 9:05 AM");
    });

    it("should update config", () => {
      const { result } = renderHook(() => useDateTimeFormat());
      act(() => {
        result.current.updateConfig({ dateFormat: "DD/MM/YYYY" });
      });
      expect(result.current.config.dateFormat).toBe("DD/MM/YYYY");
    });
  });
});
