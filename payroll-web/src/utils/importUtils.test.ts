import { describe, it, expect } from "vitest";
import { parseCSV, csvToObjects, validateRequired, findDuplicates } from "./importUtils";

describe("parseCSV", () => {
  it("should parse basic CSV", () => {
    const csv = "name,email\nAlice,alice@test.com\nBob,bob@test.com";
    const result = parseCSV(csv);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(["name", "email"]);
    expect(result[1]).toEqual(["Alice", "alice@test.com"]);
    expect(result[2]).toEqual(["Bob", "bob@test.com"]);
  });

  it("should handle quoted fields with commas", () => {
    const csv = 'name,note\nAlice,"has, comma"\nBob,"no comma"';
    const result = parseCSV(csv);
    expect(result[1]).toEqual(["Alice", "has, comma"]);
    expect(result[2]).toEqual(["Bob", "no comma"]);
  });

  it("should handle quoted fields with newlines", () => {
    const csv = 'name,description\nAlice,"line1\nline2"\nBob,"single line"';
    const result = parseCSV(csv);
    expect(result[1]).toEqual(["Alice", "line1\nline2"]);
  });

  it("should handle escaped quotes in quoted fields", () => {
    const csv = 'name,quote\nAlice,"she said ""hello"""';
    const result = parseCSV(csv);
    expect(result[1]).toEqual(["Alice", 'she said "hello"']);
  });

  it("should skip empty rows", () => {
    const csv = "a,b\n1,2\n\n3,4\n";
    const result = parseCSV(csv);
    expect(result).toHaveLength(3);
    expect(result[1]).toEqual(["1", "2"]);
    expect(result[2]).toEqual(["3", "4"]);
  });

  it("should handle Windows line endings (CRLF)", () => {
    const csv = "a,b\r\n1,2\r\n3,4";
    const result = parseCSV(csv);
    expect(result).toHaveLength(3);
  });

  it("should handle trailing empty fields", () => {
    const csv = "a,b,c\n1,2,";
    const result = parseCSV(csv);
    expect(result[1]).toEqual(["1", "2", ""]);
  });

  it("should handle empty input", () => {
    const result = parseCSV("");
    expect(result).toHaveLength(0);
  });

  it("should detect comma delimiter by default", () => {
    const csv = "a,b,c\n1,2,3";
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual(["1", "2", "3"]);
  });

  it("should detect tab delimiter", () => {
    const csv = "a\tb\tc\n1\t2\t3";
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual(["1", "2", "3"]);
  });

  it("should accept explicit delimiter", () => {
    const csv = "a;b;c\n1;2;3";
    const result = parseCSV(csv, ";");
    expect(result[1]).toEqual(["1", "2", "3"]);
  });

  it("should handle pipe delimiter via auto-detect", () => {
    const csv = "a|b|c\n1|2|3";
    const result = parseCSV(csv);
    expect(result[1]).toEqual(["1", "2", "3"]);
  });

  it("should trim field values", () => {
    const csv = "  name  ,  email  \n  Alice  ,  alice@test.com  ";
    const result = parseCSV(csv);
    expect(result[0]).toEqual(["name", "email"]);
    expect(result[1]).toEqual(["Alice", "alice@test.com"]);
  });
});

describe("csvToObjects", () => {
  it("should convert CSV to objects using header row", () => {
    const csv = "name,email\nAlice,alice@test.com\nBob,bob@test.com";
    const result = csvToObjects<Record<string, string>>(csv);
    expect(result.headers).toEqual(["name", "email"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ name: "Alice", email: "alice@test.com" });
    expect(result.rows[1]).toEqual({ name: "Bob", email: "bob@test.com" });
  });

  it("should use provided headers and include all rows as data", () => {
    const csv = "Alice,alice@test.com\nBob,bob@test.com";
    const result = csvToObjects<Record<string, string>>(csv, ["name", "email"]);
    expect(result.headers).toEqual(["name", "email"]);
    expect(result.rows).toHaveLength(2);
  });

  it("should handle empty CSV and return error", () => {
    const result = csvToObjects("");
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe("Empty file");
  });

  it("should handle rows with missing fields", () => {
    const csv = "name,email,phone\nAlice,alice@test.com\nBob";
    const result = csvToObjects<Record<string, string>>(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ name: "Alice", email: "alice@test.com", phone: "" });
    expect(result.rows[1]).toEqual({ name: "Bob", email: "", phone: "" });
  });

  it("should skip completely empty rows", () => {
    const csv = "a,b\n1,2\n\n3,4\n";
    const result = csvToObjects<Record<string, string>>(csv);
    expect(result.rows).toHaveLength(2);
  });
});

describe("validateRequired", () => {
  it("should pass when all required fields are present", () => {
    const data = [
      { name: "Alice", email: "alice@test.com" },
      { name: "Bob", email: "bob@test.com" },
    ];
    const errors = validateRequired(data, ["name", "email"]);
    expect(errors).toHaveLength(0);
  });

  it("should report missing required fields", () => {
    const data = [
      { name: "Alice", email: "" },
      { name: "", email: "bob@test.com" },
    ];
    const errors = validateRequired(data, ["name", "email"]);
    expect(errors).toHaveLength(2);
  });

  it("should include correct row numbers", () => {
    const data = [
      { name: "Alice", email: "alice@test.com" },
      { name: "", email: "" },
    ];
    const errors = validateRequired(data, ["name"], 1);
    expect(errors[0].row).toBe(2); // base 1 + index 1
    expect(errors[0].field).toBe("name");
  });

  it("should handle null/undefined values as empty", () => {
    const data = [
      { name: null as unknown as string, email: undefined as unknown as string },
    ];
    const errors = validateRequired(data, ["name", "email"]);
    expect(errors).toHaveLength(2);
  });

  it("should custom start row", () => {
    const data = [{ name: "" }];
    const errors = validateRequired(data, ["name"], 5);
    expect(errors[0].row).toBe(5);
  });
});

describe("findDuplicates", () => {
  it("should detect duplicate values", () => {
    const data = [
      { email: "alice@test.com" },
      { email: "bob@test.com" },
      { email: "alice@test.com" },
    ];
    const result = findDuplicates(data, "email");
    expect(result.count).toBe(2); // rows 1 and 3 are duplicates
    expect(result.duplicates.has(1)).toBe(true);
    expect(result.duplicates.has(3)).toBe(true);
  });

  it("should handle case-insensitive duplicates", () => {
    const data = [
      { email: "Alice@test.com" },
      { email: "alice@test.com" },
    ];
    const result = findDuplicates(data, "email");
    expect(result.count).toBe(2);
  });

  it("should trim whitespace before comparing", () => {
    const data = [
      { email: "alice@test.com" },
      { email: "  alice@test.com  " },
    ];
    const result = findDuplicates(data, "email");
    expect(result.count).toBe(2);
  });

  it("should return empty set when no duplicates", () => {
    const data = [
      { email: "alice@test.com" },
      { email: "bob@test.com" },
    ];
    const result = findDuplicates(data, "email");
    expect(result.count).toBe(0);
    expect(result.duplicates.size).toBe(0);
  });

  it("should handle empty values (skip)", () => {
    const data = [
      { email: "" },
      { email: "" },
    ];
    const result = findDuplicates(data, "email");
    expect(result.count).toBe(0); // empty values are skipped
  });

  it("should use custom start row", () => {
    const data = [
      { id: "A" },
      { id: "A" },
    ];
    const result = findDuplicates(data, "id", 10);
    expect(result.duplicates.has(10)).toBe(true);
    expect(result.duplicates.has(11)).toBe(true);
  });
});
