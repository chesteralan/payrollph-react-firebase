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

describe("sanitize utils", () => {
  describe("sanitizeString", () => {
    it("should escape HTML special characters", () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;"
      );
    });

    it("should escape ampersand", () => {
      expect(sanitizeString("a & b")).toBe("a &amp; b");
    });

    it("should escape single quotes", () => {
      expect(sanitizeString("it's")).toBe("it&#x27;s");
    });

    it("should trim whitespace", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizeString(null as unknown as string)).toBe("");
      expect(sanitizeString(undefined as unknown as string)).toBe("");
      expect(sanitizeString(123 as unknown as string)).toBe("");
    });

    it("should return empty string for empty string", () => {
      expect(sanitizeString("")).toBe("");
    });

    it("should handle string with only special characters", () => {
      expect(sanitizeString("<>&\"'/")).toBe(
        "&lt;&gt;&amp;&quot;&#x27;&#x2F;"
      );
    });
  });

  describe("sanitizeEmail", () => {
    it("should return valid lowercase email", () => {
      expect(sanitizeEmail("User@Example.COM")).toBe("user@example.com");
    });

    it("should trim whitespace", () => {
      expect(sanitizeEmail("  user@example.com  ")).toBe("user@example.com");
    });

    it("should reject email without @", () => {
      expect(sanitizeEmail("userexample.com")).toBe("");
    });

    it("should reject email without domain", () => {
      expect(sanitizeEmail("user@")).toBe("");
    });

    it("should reject email without TLD", () => {
      expect(sanitizeEmail("user@example")).toBe("");
    });

    it("should reject empty string", () => {
      expect(sanitizeEmail("")).toBe("");
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizeEmail(null as unknown as string)).toBe("");
      expect(sanitizeEmail(undefined as unknown as string)).toBe("");
    });

    it("should accept email with subdomains", () => {
      expect(sanitizeEmail("user@sub.example.com")).toBe(
        "user@sub.example.com"
      );
    });

    it("should accept email with plus addressing", () => {
      expect(sanitizeEmail("user+tag@example.com")).toBe(
        "user+tag@example.com"
      );
    });
  });

  describe("sanitizePhone", () => {
    it("should keep digits and allowed symbols", () => {
      expect(sanitizePhone("+1 (234) 567-8901")).toBe("+1 (234) 567-8901");
    });

    it("should remove letters", () => {
      expect(sanitizePhone("abc123")).toBe("123");
    });

    it("should remove special characters not in allowed set", () => {
      expect(sanitizePhone("+1#234!567")).toBe("+1234567");
    });

    it("should trim whitespace", () => {
      expect(sanitizePhone("  +1234  ")).toBe("+1234");
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizePhone(null as unknown as string)).toBe("");
      expect(sanitizePhone(undefined as unknown as string)).toBe("");
    });

    it("should return empty string for empty string", () => {
      expect(sanitizePhone("")).toBe("");
    });

    it("should handle string with only disallowed characters", () => {
      expect(sanitizePhone("abc!@#")).toBe("");
    });
  });

  describe("sanitizeName", () => {
    it("should keep letters, spaces, hyphens, and apostrophes", () => {
      expect(sanitizeName("Mary-Jane O'Neil")).toBe("Mary-Jane O'Neil");
    });

    it("should remove digits", () => {
      expect(sanitizeName("John123")).toBe("John");
    });

    it("should remove special characters", () => {
      expect(sanitizeName("John@Doe!")).toBe("JohnDoe");
    });

    it("should trim whitespace", () => {
      expect(sanitizeName("  John  ")).toBe("John");
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizeName(null as unknown as string)).toBe("");
      expect(sanitizeName(undefined as unknown as string)).toBe("");
    });

    it("should return empty string for empty string", () => {
      expect(sanitizeName("")).toBe("");
    });
  });

  describe("sanitizeNumber", () => {
    it("should keep digits and decimal point", () => {
      expect(sanitizeNumber("123.45")).toBe("123.45");
    });

    it("should remove letters", () => {
      expect(sanitizeNumber("abc123")).toBe("123");
    });

    it("should remove minus sign by default", () => {
      expect(sanitizeNumber("-123")).toBe("123");
    });

    it("should allow minus sign when allowNegative is true", () => {
      expect(sanitizeNumber("-123.45", true)).toBe("-123.45");
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizeNumber(null as unknown as string)).toBe("");
      expect(sanitizeNumber(undefined as unknown as string)).toBe("");
    });

    it("should return empty string for empty string", () => {
      expect(sanitizeNumber("")).toBe("");
    });

    it("should handle multiple decimal points", () => {
      expect(sanitizeNumber("1.2.3")).toBe("1.2.3");
    });
  });

  describe("sanitizeCurrency", () => {
    it("should keep digits and single decimal point", () => {
      expect(sanitizeCurrency("1234.56")).toBe("1234.56");
    });

    it("should remove letters and symbols", () => {
      expect(sanitizeCurrency("$1,234.56")).toBe("1234.56");
    });

    it("should collapse multiple decimal points", () => {
      expect(sanitizeCurrency("1.2.3")).toBe("1.23");
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizeCurrency(null as unknown as string)).toBe("");
      expect(sanitizeCurrency(undefined as unknown as string)).toBe("");
    });

    it("should return empty string for empty string", () => {
      expect(sanitizeCurrency("")).toBe("");
    });

    it("should handle string with only special characters", () => {
      expect(sanitizeCurrency("$,")).toBe("");
    });
  });

  describe("sanitizeFilename", () => {
    it("should replace special characters with underscores", () => {
      expect(sanitizeFilename('file:name"s')).toBe("file_name_s");
    });

    it("should remove path traversal sequences", () => {
      expect(sanitizeFilename("../../../etc/passwd")).toBe("___etc_passwd");
    });

    it("should trim whitespace", () => {
      expect(sanitizeFilename("  file.txt  ")).toBe("file.txt");
    });

    it("should truncate to 255 characters", () => {
      const longName = "a".repeat(300);
      expect(sanitizeFilename(longName)).toHaveLength(255);
    });

    it("should return empty string for non-string input", () => {
      expect(sanitizeFilename(null as unknown as string)).toBe("");
      expect(sanitizeFilename(undefined as unknown as string)).toBe("");
    });

    it("should return empty string for empty string", () => {
      expect(sanitizeFilename("")).toBe("");
    });

    it("should handle backslashes", () => {
      expect(sanitizeFilename("path\\to\\file")).toBe("path_to_file");
    });
  });

  describe("stripHtml", () => {
    it("should remove HTML tags", () => {
      expect(stripHtml("<p>Hello</p>")).toBe("Hello");
    });

    it("should remove nested tags", () => {
      expect(stripHtml("<div><span>Hello</span></div>")).toBe("Hello");
    });

    it("should remove self-closing tags", () => {
      expect(stripHtml("Hello<br/>World")).toBe("HelloWorld");
    });

    it("should remove script tags", () => {
      expect(stripHtml('<script>alert("xss")</script>')).toBe(
        'alert("xss")'
      );
    });

    it("should return empty string for non-string input", () => {
      expect(stripHtml(null as unknown as string)).toBe("");
      expect(stripHtml(undefined as unknown as string)).toBe("");
    });

    it("should return empty string for empty string", () => {
      expect(stripHtml("")).toBe("");
    });

    it("should handle string with no tags", () => {
      expect(stripHtml("plain text")).toBe("plain text");
    });
  });

  describe("sanitizeDate", () => {
    it("should return ISO string for valid date", () => {
      const result = sanitizeDate("2024-01-15");
      expect(result).toBeTruthy();
      expect(result).toContain("2024-01-15");
    });

    it("should return null for invalid date string", () => {
      expect(sanitizeDate("not-a-date")).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(sanitizeDate("")).toBeNull();
    });

    it("should return null for non-string input", () => {
      expect(sanitizeDate(null as unknown as string)).toBeNull();
      expect(sanitizeDate(undefined as unknown as string)).toBeNull();
    });

    it("should handle ISO date with time", () => {
      const result = sanitizeDate("2024-01-15T10:30:00Z");
      expect(result).toBeTruthy();
      expect(result).toBe("2024-01-15T10:30:00.000Z");
    });

    it("should handle date-only format", () => {
      const result = sanitizeDate("2024-12-25");
      expect(result).toBeTruthy();
      expect(result).toContain("2024-12-25");
    });
  });

  describe("sanitizeObject", () => {
    it("should apply sanitizers to specified keys", () => {
      const obj = { name: "John", email: "JOHN@EXAMPLE.COM" };
      const result = sanitizeObject(obj, {
        email: (v) => (v as string).toLowerCase(),
      });
      expect(result.email).toBe("john@example.com");
      expect(result.name).toBe("John");
    });

    it("should not modify keys without sanitizers", () => {
      const obj = { name: "John", age: 30 };
      const result = sanitizeObject(obj, {});
      expect(result).toEqual(obj);
    });

    it("should not mutate the original object", () => {
      const obj = { name: "John" };
      const result = sanitizeObject(obj, {
        name: () => "Jane",
      });
      expect(obj.name).toBe("John");
      expect(result.name).toBe("Jane");
    });

    it("should skip keys not present in the object", () => {
      const obj = { name: "John" };
      const result = sanitizeObject(obj, {
        missing: () => "value",
      } as any);
      expect(result).toEqual({ name: "John" });
    });

    it("should handle multiple sanitizers", () => {
      const obj = { first: "JOHN", last: "DOE" };
      const result = sanitizeObject(obj, {
        first: (v) => (v as string).toLowerCase(),
        last: (v) => (v as string).toLowerCase(),
      });
      expect(result.first).toBe("john");
      expect(result.last).toBe("doe");
    });
  });

  describe("containsSqlInjection", () => {
    it("should detect SELECT keyword", () => {
      expect(containsSqlInjection("SELECT * FROM users")).toBe(true);
    });

    it("should detect DROP keyword", () => {
      expect(containsSqlInjection("DROP TABLE users")).toBe(true);
    });

    it("should detect OR tautology", () => {
      expect(containsSqlInjection("' OR 1=1 --")).toBe(true);
    });

    it("should detect AND tautology", () => {
      expect(containsSqlInjection("' AND 1=1 --")).toBe(true);
    });

    it("should detect comment sequences", () => {
      expect(containsSqlInjection("input -- comment")).toBe(true);
    });

    it("should detect semicolons", () => {
      expect(containsSqlInjection("input; DROP TABLE")).toBe(true);
    });

    it("should return false for normal input", () => {
      expect(containsSqlInjection("Hello world")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(containsSqlInjection("")).toBe(false);
    });

    it("should return false for non-string input", () => {
      expect(containsSqlInjection(null as unknown as string)).toBe(false);
      expect(containsSqlInjection(undefined as unknown as string)).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(containsSqlInjection("select * from users")).toBe(true);
      expect(containsSqlInjection("Select * From Users")).toBe(true);
    });
  });

  describe("containsXss", () => {
    it("should detect script tags", () => {
      expect(containsXss('<script>alert("xss")</script>')).toBe(true);
    });

    it("should detect inline event handlers", () => {
      expect(containsXss('<img onerror="alert(1)">')).toBe(true);
    });

    it("should detect javascript: URIs", () => {
      expect(containsXss('javascript:alert(1)')).toBe(true);
    });

    it("should detect iframe tags", () => {
      expect(containsXss('<iframe src="evil.com"></iframe>')).toBe(true);
    });

    it("should return false for normal input", () => {
      expect(containsXss("Hello world")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(containsXss("")).toBe(false);
    });

    it("should return false for non-string input", () => {
      expect(containsXss(null as unknown as string)).toBe(false);
      expect(containsXss(undefined as unknown as string)).toBe(false);
    });
  });

  describe("validateInput", () => {
    it("should return valid for clean input", () => {
      const result = validateInput("Hello world");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should sanitize HTML by default", () => {
      const result = validateInput('<script>alert("xss")</script>');
      expect(result.sanitized).not.toContain("<script>");
    });

    it("should skip HTML sanitization when allowHtml is true", () => {
      const result = validateInput("<p>Hello</p>", { allowHtml: true });
      expect(result.sanitized).toBe("<p>Hello</p>");
    });

    it("should enforce maxLength", () => {
      const result = validateInput("hello world", { maxLength: 5 });
      expect(result.isValid).toBe(false);
      expect(result.sanitized).toBe("hello");
      expect(result.errors).toContain(
        "Input exceeds maximum length of 5"
      );
    });

    it("should enforce minLength", () => {
      const result = validateInput("hi", { minLength: 5 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Input must be at least 5 characters"
      );
    });

    it("should validate pattern", () => {
      const result = validateInput("abc", { pattern: /^[0-9]+$/ });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Input does not match required pattern");
    });

    it("should detect SQL injection", () => {
      const result = validateInput("SELECT * FROM users");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Input contains invalid characters");
    });

    it("should detect XSS when not allowing HTML", () => {
      const result = validateInput('<script>alert(1)</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Input contains invalid characters");
    });

    it("should not flag XSS when allowHtml is true", () => {
      const result = validateInput('<script>alert(1)</script>', {
        allowHtml: true,
      });
      expect(result.errors).not.toContain("Input contains invalid characters");
    });

    it("should combine multiple validation errors", () => {
      const result = validateInput("hi", {
        minLength: 5,
        maxLength: 10,
        pattern: /^[a-z]+$/,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it("should return valid result with no options", () => {
      const result = validateInput("test");
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe("test");
      expect(result.errors).toHaveLength(0);
    });
  });
});
