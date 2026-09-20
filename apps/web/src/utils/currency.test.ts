import { describe, it, expect, beforeAll } from "vitest";
import {
  formatCurrency,
  formatCurrencyShort,
  setDefaultCurrency,
  getDefaultCurrency,
  getCurrencyInfo,
  getAvailableCurrencies,
} from "./currency";

describe("currency utils", () => {
  describe("formatCurrency", () => {
    it("should format positive amount in PHP by default", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("1,234.56");
      expect(result).toContain("₱");
    });

    it("should format amount in USD", () => {
      const result = formatCurrency(99.99, "USD");
      expect(result).toContain("99.99");
      expect(result).toContain("$");
    });

    it("should format amount in EUR (using de-DE locale format)", () => {
      const result = formatCurrency(1500.5, "EUR");
      // de-DE uses 1.500,50 format (dot thousands sep, comma decimal)
      expect(result).toContain("€");
      expect(result).toContain("1.500");
    });

    it("should format amount in JPY", () => {
      const result = formatCurrency(50000, "JPY");
      expect(result).toContain("50,000");
    });

    it("should format zero amount", () => {
      const result = formatCurrency(0);
      expect(result).toContain("0.00");
    });

    it("should format negative amount", () => {
      const result = formatCurrency(-500.25);
      expect(result).toContain("500.25");
      expect(result).toContain("-");
    });

    it("should handle large numbers", () => {
      const result = formatCurrency(9_999_999_999.99);
      expect(result).toContain("9,999,999,999.99");
    });

    it("should round to 2 decimal places", () => {
      const result = formatCurrency(123.456);
      expect(result).toContain("123.46");
    });

    it("should round down correctly", () => {
      const result = formatCurrency(123.453);
      expect(result).toContain("123.45");
    });

    it("should fallback to PHP for unknown currency code", () => {
      const result = formatCurrency(100, "XYZ");
      expect(result).toContain("₱");
    });
  });

  describe("formatCurrencyShort", () => {
    it("should format with symbol prefix and commas", () => {
      const result = formatCurrencyShort(1234.56);
      expect(result).toBe("₱1,234.56");
    });

    it("should use USD symbol when specified", () => {
      const result = formatCurrencyShort(99.99, "USD");
      expect(result).toBe("$99.99");
    });

    it("should use EUR symbol when specified", () => {
      const result = formatCurrencyShort(2500, "EUR");
      expect(result).toBe("€2,500.00");
    });

    it("should handle zero", () => {
      const result = formatCurrencyShort(0);
      expect(result).toBe("₱0.00");
    });

    it("should handle negative values", () => {
      const result = formatCurrencyShort(-1000);
      expect(result).toBe("₱-1,000.00");
    });

    it("should round to 2 decimal places", () => {
      const result = formatCurrencyShort(99.999);
      expect(result).toBe("₱100.00");
    });
  });

  describe("setDefaultCurrency / getDefaultCurrency", () => {
    beforeAll(() => {
      setDefaultCurrency("PHP");
    });

    it("should default to PHP", () => {
      expect(getDefaultCurrency()).toBe("PHP");
    });

    it("should change default currency", () => {
      setDefaultCurrency("USD");
      expect(getDefaultCurrency()).toBe("USD");
      setDefaultCurrency("PHP"); // reset
    });

    it("should not change to invalid currency", () => {
      setDefaultCurrency("INVALID");
      expect(getDefaultCurrency()).toBe("PHP");
    });
  });

  describe("getCurrencyInfo", () => {
    it("should return PHP info by default", () => {
      const info = getCurrencyInfo();
      expect(info.code).toBe("PHP");
      expect(info.symbol).toBe("₱");
    });

    it("should return info for specified currency", () => {
      const info = getCurrencyInfo("USD");
      expect(info.code).toBe("USD");
      expect(info.symbol).toBe("$");
    });

    it("should fallback to PHP for unknown currency", () => {
      const info = getCurrencyInfo("XYZ");
      expect(info.code).toBe("PHP");
    });
  });

  describe("getAvailableCurrencies", () => {
    it("should return all supported currencies", () => {
      const currencies = getAvailableCurrencies();
      expect(currencies.length).toBeGreaterThanOrEqual(10);
    });

    it("should include PHP with ₱ symbol", () => {
      const currencies = getAvailableCurrencies();
      const php = currencies.find((c) => c.code === "PHP");
      expect(php).toBeDefined();
      expect(php!.symbol).toBe("₱");
      expect(php!.label).toContain("₱");
    });

    it("should include USD with $ symbol", () => {
      const currencies = getAvailableCurrencies();
      const usd = currencies.find((c) => c.code === "USD");
      expect(usd).toBeDefined();
      expect(usd!.symbol).toBe("$");
    });

    it("should return objects with code, symbol, and label", () => {
      const currencies = getAvailableCurrencies();
      for (const c of currencies) {
        expect(c).toHaveProperty("code");
        expect(c).toHaveProperty("symbol");
        expect(c).toHaveProperty("label");
      }
    });
  });
});
