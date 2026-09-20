import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { validate, rules, useValidation } from "./validation";

describe("validation utils", () => {
  describe("rules.required", () => {
    const req = rules.required();

    it("should reject null", () => {
      expect(req.validate(null)).toBe(false);
    });

    it("should reject undefined", () => {
      expect(req.validate(undefined)).toBe(false);
    });

    it("should reject empty string", () => {
      expect(req.validate("")).toBe(false);
    });

    it("should reject whitespace-only string", () => {
      expect(req.validate("   ")).toBe(false);
    });

    it("should accept non-empty string", () => {
      expect(req.validate("hello")).toBe(true);
    });

    it("should accept number 0", () => {
      expect(req.validate(0)).toBe(true);
    });

    it("should have default error message", () => {
      expect(req.message).toBe("This field is required");
    });

    it("should accept custom message", () => {
      const custom = rules.required("Custom error");
      expect(custom.message).toBe("Custom error");
    });
  });

  describe("rules.minLength", () => {
    it("should validate minimum length", () => {
      const r = rules.minLength(5);
      expect(r.validate("hello")).toBe(true);
      expect(r.validate("hi")).toBe(false);
    });

    it("should handle empty string", () => {
      const r = rules.minLength(3);
      expect(r.validate("")).toBe(false);
    });

    it("should have default error message", () => {
      expect(rules.minLength(5).message).toBe("Must be at least 5 characters");
    });

    it("should accept custom message", () => {
      expect(rules.minLength(5, "Too short!").message).toBe("Too short!");
    });
  });

  describe("rules.maxLength", () => {
    it("should validate maximum length", () => {
      const r = rules.maxLength(5);
      expect(r.validate("hello")).toBe(true);
      expect(r.validate("hello world")).toBe(false);
    });

    it("should handle empty string", () => {
      const r = rules.maxLength(3);
      expect(r.validate("")).toBe(true);
    });

    it("should have default error message", () => {
      expect(rules.maxLength(5).message).toBe("Must be at most 5 characters");
    });
  });

  describe("rules.email", () => {
    const emailRule = rules.email();

    it("should accept valid email", () => {
      expect(emailRule.validate("user@example.com")).toBe(true);
    });

    it("should accept email with subdomain", () => {
      expect(emailRule.validate("user@sub.example.com")).toBe(true);
    });

    it("should accept email with plus addressing", () => {
      expect(emailRule.validate("user+tag@example.com")).toBe(true);
    });

    it("should reject email without @", () => {
      expect(emailRule.validate("userexample.com")).toBe(false);
    });

    it("should reject email without domain", () => {
      expect(emailRule.validate("user@")).toBe(false);
    });

    it("should reject email without TLD", () => {
      expect(emailRule.validate("user@example")).toBe(false);
    });

    it("should reject empty string", () => {
      expect(emailRule.validate("")).toBe(false);
    });

    it("should reject null", () => {
      expect(emailRule.validate(null)).toBe(false);
    });
  });

  describe("rules.phone (TIN/SSS/etc. number-like validation)", () => {
    const phoneRule = rules.phone();

    it("should accept valid phone number", () => {
      expect(phoneRule.validate("+639171234567")).toBe(true);
    });

    it("should accept phone with formatting", () => {
      expect(phoneRule.validate("+1 (234) 567-8901")).toBe(true);
    });

    it("should accept phone with dashes", () => {
      expect(phoneRule.validate("0917-123-4567")).toBe(true);
    });

    it("should reject empty string", () => {
      expect(phoneRule.validate("")).toBe(false);
    });

    it("should reject too short number", () => {
      expect(phoneRule.validate("12345")).toBe(false);
    });
  });

  describe("rules.number", () => {
    const numRule = rules.number();

    it("should accept numeric string", () => {
      expect(numRule.validate("123")).toBe(true);
    });

    it("should accept actual number", () => {
      expect(numRule.validate(42)).toBe(true);
    });

    it("should accept decimal string", () => {
      expect(numRule.validate("123.45")).toBe(true);
    });

    it("should reject non-numeric string", () => {
      expect(numRule.validate("abc")).toBe(false);
    });

    it("should pass null as valid (optional field)", () => {
      expect(numRule.validate(null)).toBe(true);
    });

    it("should pass undefined as valid (optional field)", () => {
      expect(numRule.validate(undefined)).toBe(true);
    });

    it("should pass empty string as valid (optional field)", () => {
      expect(numRule.validate("")).toBe(true);
    });
  });

  describe("rules.min / rules.max", () => {
    it("should validate min value", () => {
      const r = rules.min(10);
      expect(r.validate(15)).toBe(true);
      expect(r.validate(10)).toBe(true);
      expect(r.validate(5)).toBe(false);
    });

    it("should validate max value", () => {
      const r = rules.max(100);
      expect(r.validate(50)).toBe(true);
      expect(r.validate(100)).toBe(true);
      expect(r.validate(150)).toBe(false);
    });
  });

  describe("rules.pattern", () => {
    it("should match regex pattern", () => {
      const r = rules.pattern(/^[A-Z]{3}$/, "Must be 3 uppercase letters");
      expect(r.validate("ABC")).toBe(true);
      expect(r.validate("abc")).toBe(false);
      expect(r.validate("ABCD")).toBe(false);
    });

    it("should have custom message", () => {
      const r = rules.pattern(/^\\d+$/, "Must be digits");
      expect(r.message).toBe("Must be digits");
    });
  });

  describe("rules.unique", () => {
    it("should accept unique value", () => {
      const r = rules.unique(["a", "b", "c"]);
      expect(r.validate("d")).toBe(true);
    });

    it("should reject duplicate value", () => {
      const r = rules.unique(["a", "b", "c"]);
      expect(r.validate("a")).toBe(false);
    });

    it("should be case-sensitive", () => {
      const r = rules.unique(["A"]);
      expect(r.validate("a")).toBe(true);
    });
  });

  describe("rules.date", () => {
    const dateRule = rules.date();

    it("should accept valid date string", () => {
      expect(dateRule.validate("2024-01-15")).toBe(true);
    });

    it("should accept Date object", () => {
      expect(dateRule.validate(new Date())).toBe(true);
    });

    it("should pass null as valid (optional)", () => {
      expect(dateRule.validate(null)).toBe(true);
    });

    it("should reject invalid date string", () => {
      expect(dateRule.validate("not-a-date")).toBe(false);
    });
  });

  describe("rules.futureDate", () => {
    const futureRule = rules.futureDate();

    it("should accept future date", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(futureRule.validate(future.toISOString())).toBe(true);
    });

    it("should reject past date", () => {
      expect(futureRule.validate("2020-01-01")).toBe(false);
    });

    it("should pass null as valid (optional)", () => {
      expect(futureRule.validate(null)).toBe(true);
    });
  });

  describe("rules.pastDate", () => {
    const pastRule = rules.pastDate();

    it("should accept past date", () => {
      expect(pastRule.validate("2020-01-01")).toBe(true);
    });

    it("should reject future date", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(pastRule.validate(future.toISOString())).toBe(false);
    });

    it("should pass null as valid (optional)", () => {
      expect(pastRule.validate(null)).toBe(true);
    });
  });

  describe("validate function", () => {
    interface TestData {
      name: string;
      email: string;
      age: number;
    }

    it("should pass with valid data", () => {
      const data: TestData = {
        name: "John",
        email: "john@example.com",
        age: 25,
      };
      const result = validate(data, [
        {
          field: "name",
          validate: rules.required().validate,
          message: rules.required().message,
        },
        {
          field: "email",
          validate: rules.email().validate,
          message: rules.email().message,
        },
      ]);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it("should fail with invalid data", () => {
      const data: TestData = { name: "", email: "invalid", age: 25 };
      const result = validate(data, [
        {
          field: "name",
          validate: rules.required().validate,
          message: rules.required().message,
        },
        {
          field: "email",
          validate: rules.email().validate,
          message: rules.email().message,
        },
      ]);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
    });

    it("should report correct error messages", () => {
      const data: TestData = { name: "", email: "john@example.com", age: 25 };
      const result = validate(data, [
        {
          field: "name",
          validate: rules.required().validate,
          message: "Name is required",
        },
      ]);
      expect(result.errors.name).toBe("Name is required");
    });

    describe("useValidation hook", () => {
    interface TestForm {
      name: string;
      email: string;
    }

    const validators = [
      {
        field: "name" as const,
        validate: rules.required().validate,
        message: rules.required().message,
      },
      {
        field: "email" as const,
        validate: rules.email().validate,
        message: rules.email().message,
      },
    ];

    it("should initialize with provided data", () => {
      const { result } = renderHook(() =>
        useValidation<TestForm>({ name: "John", email: "john@test.com" }),
      );
      expect(result.current.data.name).toBe("John");
      expect(result.current.data.email).toBe("john@test.com");
      expect(result.current.isValid).toBe(true);
    });

    it("should update a field value", () => {
      const { result } = renderHook(() =>
        useValidation<TestForm>({ name: "", email: "" }),
      );
      act(() => {
        result.current.updateField("name", "John");
      });
      expect(result.current.data.name).toBe("John");
    });

    it("should mark a field as touched", () => {
      const { result } = renderHook(() =>
        useValidation<TestForm>({ name: "", email: "" }),
      );
      act(() => {
        result.current.touchField("name");
      });
      expect(result.current.touched.has("name")).toBe(true);
    });

    it("should return field error only when touched", () => {
      const { result } = renderHook(() =>
        useValidation<TestForm>({ name: "", email: "" }),
      );
      act(() => {
        result.current.validate(validators);
        result.current.touchField("name");
      });
      expect(result.current.getFieldError("name")).toBeDefined();
      expect(result.current.getFieldError("email")).toBeUndefined();
    });

    it("should run validation and set errors", () => {
      const { result } = renderHook(() =>
        useValidation<TestForm>({ name: "", email: "" }),
      );
      act(() => {
        result.current.validate(validators);
      });
      expect(result.current.isValid).toBe(false);
      expect(result.current.errors.name).toBeDefined();
      expect(result.current.errors.email).toBeDefined();
    });

    it("should reset to initial state", () => {
      const { result } = renderHook(() =>
        useValidation<TestForm>({ name: "John", email: "john@test.com" }),
      );
      act(() => {
        result.current.updateField("name", "Jane");
        result.current.touchField("name");
        result.current.validate(validators);
      });
      act(() => {
        result.current.reset();
      });
      expect(result.current.data.name).toBe("John");
      expect(result.current.touched.size).toBe(0);
      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });
  });

  it("should handle multiple fields with same validator", () => {
      const data = { field1: "", field2: "" };
      const result = validate(data, [
        {
          field: "field1",
          validate: rules.required().validate,
          message: "Required",
        },
        {
          field: "field2",
          validate: rules.required().validate,
          message: "Required",
        },
      ]);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(2);
    });
  });
});
