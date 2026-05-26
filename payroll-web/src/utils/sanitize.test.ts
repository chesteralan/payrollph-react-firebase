import { describe, it, expect } from "vitest";
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeName,
  sanitizeNumber,
  sanitizeCurrency,
  sanitizeFilename,
  stripHtml,
  sanitizeDate,
  sanitizeObject,
  containsSqlInjection,
  containsXss,
  validateInput,
} from "./sanitize";

describe("sanitizeString", () => {
  it("should escape HTML special characters", () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;",
    );
  });

  it("should handle empty string", () => {
    expect(sanitizeString("")).toBe("");
  });

  it("should trim whitespace", () => {
    expect(sanitizeString("  test  ")).toBe("test");
  });
});

describe("sanitizeEmail", () => {
  it("should lowercase and trim email", () => {
    expect(sanitizeEmail("  USER@EXAMPLE.COM  ")).toBe("user@example.com");
  });

  it("should reject invalid email", () => {
    expect(sanitizeEmail("not-an-email")).toBe("");
  });

  it("should accept valid email", () => {
    expect(sanitizeEmail("test@example.com")).toBe("test@example.com");
  });
});

describe("sanitizePhone", () => {
  it("should keep only valid phone characters", () => {
    expect(sanitizePhone("+1 (234) 567-890")).toBe("+1 (234) 567-890");
  });

  it("should remove invalid characters", () => {
    expect(sanitizePhone("123-ABC-456")).toBe("123--456");
  });
});

describe("sanitizeName", () => {
  it("should allow letters, spaces, hyphens, and apostrophes", () => {
    expect(sanitizeName("John O'Connor-Smith")).toBe("John O'Connor-Smith");
  });

  it("should remove numbers and special characters", () => {
    expect(sanitizeName("John123!@#")).toBe("John");
  });
});

describe("sanitizeNumber", () => {
  it("should keep only digits and decimal point", () => {
    expect(sanitizeNumber("123.45abc")).toBe("123.45");
  });

  it("should allow negative numbers when specified", () => {
    expect(sanitizeNumber("-123.45", true)).toBe("-123.45");
  });

  it("should remove negative sign by default", () => {
    expect(sanitizeNumber("-123.45")).toBe("123.45");
  });
});

describe("sanitizeCurrency", () => {
  it("should format currency value", () => {
    expect(sanitizeCurrency("$1,234.56")).toBe("1234.56");
  });

  it("should handle multiple decimal points", () => {
    expect(sanitizeCurrency("1.2.3.4")).toBe("1.234");
  });
});

describe("sanitizeFilename", () => {
  it("should remove path traversal attempts", () => {
    expect(sanitizeFilename("../../../etc/passwd")).toBe("___etc_passwd");
  });

  it("should remove invalid filename characters", () => {
    expect(sanitizeFilename("file*.txt")).toBe("file_.txt");
  });

  it("should limit length to 255 characters", () => {
    const longName = "a".repeat(300);
    expect(sanitizeFilename(longName)).toHaveLength(255);
  });
});

describe("containsSqlInjection", () => {
  it("should detect SELECT statements", () => {
    expect(containsSqlInjection("'; SELECT * FROM users; --")).toBe(true);
  });

  it("should detect UNION attacks", () => {
    expect(containsSqlInjection("1 UNION SELECT password FROM users")).toBe(
      true,
    );
  });

  it("should allow safe input", () => {
    expect(containsSqlInjection("john doe")).toBe(false);
  });
});

describe("containsXss", () => {
  it("should detect script tags", () => {
    expect(containsXss("<script>alert(1)</script>")).toBe(true);
  });

  it("should detect onerror handlers", () => {
    expect(containsXss("<img src=x onerror=alert(1)>")).toBe(true);
  });

  it("should allow safe HTML", () => {
    expect(containsXss("<b>bold text</b>")).toBe(false);
  });
});

describe("validateInput", () => {
  it("should pass valid input", () => {
    const result = validateInput("test", { maxLength: 10, minLength: 2 });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail on maxLength exceeded", () => {
    const result = validateInput("too long text", { maxLength: 5 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Input exceeds maximum length of 5");
  });

  it("should fail on minLength not met", () => {
    const result = validateInput("ab", { minLength: 5 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Input must be at least 5 characters");
  });

  it("should truncate to maxLength", () => {
    const result = validateInput("too long", { maxLength: 5 });
    expect(result.sanitized).toBe("too l");
  });

  it("should detect SQL injection patterns", () => {
    const result = validateInput("1 OR 1=1", { maxLength: 20 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Input contains invalid characters");
  });

  it("should detect XSS patterns", () => {
    const result = validateInput("<script>alert(1)</script>", { maxLength: 50 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Input contains invalid characters");
  });

  it("should allow HTML when allowHtml is true", () => {
    const result = validateInput("<b>bold</b>", { allowHtml: true, maxLength: 20 });
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe("<b>bold</b>");
  });

  it("should validate against pattern", () => {
    const result = validateInput("abc", { pattern: /^[A-Z]+$/ });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Input does not match required pattern");
  });

  it("should fail on SQL injection with allowHtml", () => {
    const result = validateInput("DROP TABLE users", { allowHtml: true });
    expect(result.isValid).toBe(false);
  });
});

describe("stripHtml", () => {
  it("should remove HTML tags", () => {
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  it("should handle empty string", () => {
    expect(stripHtml("")).toBe("");
  });

  it("should return plain text unchanged", () => {
    expect(stripHtml("just text")).toBe("just text");
  });

  it("should handle non-string input", () => {
    expect(stripHtml(123 as unknown as string)).toBe("");
  });
});

describe("sanitizeDate", () => {
  it("should return ISO string for valid date", () => {
    const result = sanitizeDate("2024-01-15");
    expect(result).toBe("2024-01-15T00:00:00.000Z");
  });

  it("should return null for invalid date", () => {
    expect(sanitizeDate("not-a-date")).toBeNull();
  });

  it("should return null for non-string input", () => {
    expect(sanitizeDate(123 as unknown as string)).toBeNull();
  });
});

describe("sanitizeObject", () => {
  it("should apply sanitizers to specified keys", () => {
    const obj = { name: "  John  ", email: " USER@EXAMPLE.COM " };
    const result = sanitizeObject(obj, {
      name: (v) => (typeof v === "string" ? v.trim() : v),
      email: (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    });
    expect(result.name).toBe("John");
    expect(result.email).toBe("user@example.com");
  });

  it("should skip missing keys", () => {
    const obj = { name: "John" };
    const result = sanitizeObject(obj, {
      email: (v) => v,
    });
    expect(result).toEqual({ name: "John" });
  });
});

describe("sanitizeString edge cases", () => {
  it("should handle non-string input", () => {
    expect(sanitizeString(123 as unknown as string)).toBe("");
  });
});

describe("sanitizeEmail edge cases", () => {
  it("should handle non-string input", () => {
    expect(sanitizeEmail(123 as unknown as string)).toBe("");
  });
});

describe("sanitizePhone edge cases", () => {
  it("should handle non-string input", () => {
    expect(sanitizePhone(123 as unknown as string)).toBe("");
  });
});

describe("sanitizeNumber edge cases", () => {
  it("should handle non-string input", () => {
    expect(sanitizeNumber(123 as unknown as string)).toBe("");
  });
});

describe("sanitizeCurrency edge cases", () => {
  it("should handle non-string input", () => {
    expect(sanitizeCurrency(123 as unknown as string)).toBe("");
  });

  it("should handle single decimal", () => {
    expect(sanitizeCurrency("123.45")).toBe("123.45");
  });
});

describe("sanitizeFilename edge cases", () => {
  it("should handle non-string input", () => {
    expect(sanitizeFilename(123 as unknown as string)).toBe("");
  });
});

describe("containsSqlInjection edge cases", () => {
  it("should detect DROP statement", () => {
    expect(containsSqlInjection("DROP TABLE users")).toBe(true);
  });

  it("should detect comment injection", () => {
    expect(containsSqlInjection("admin'--")).toBe(true);
  });

  it("should detect OR injection", () => {
    expect(containsSqlInjection("1 OR 1=1")).toBe(true);
  });

  it("should detect AND injection", () => {
    expect(containsSqlInjection("1 AND 1=1")).toBe(true);
  });

  it("should handle non-string input", () => {
    expect(containsSqlInjection(123 as unknown as string)).toBe(false);
  });
});

describe("containsXss edge cases", () => {
  it("should detect iframe injection", () => {
    expect(containsXss("<iframe src='http://evil.com'></iframe>")).toBe(true);
  });

  it("should detect javascript: URI", () => {
    expect(containsXss("javascript:alert(1)")).toBe(true);
  });

  it("should detect on* event handlers", () => {
    expect(containsXss("onload=alert(1)")).toBe(true);
  });

  it("should handle non-string input", () => {
    expect(containsXss(123 as unknown as string)).toBe(false);
  });
});
