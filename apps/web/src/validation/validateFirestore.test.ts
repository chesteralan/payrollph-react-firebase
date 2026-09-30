import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { addMockDocs, clearMockDocs, getMockDocs } from "../__mocks__/firebase";
import { getDoc, getDocs, collection, query, where } from "firebase/firestore";
import {
  hasSchema,
  getByIdValidated,
  getAllValidated,
  tryParseDoc,
} from "./validateFirestore";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.mocked(getDoc).mockImplementation(async (docPath: string) => {
    const docs = getMockDocs(docPath);
    const doc = docs?.[0];
    if (doc) {
      return { id: doc.id, exists: () => true, data: () => doc };
    }
    return { id: docPath, exists: () => false, data: () => null };
  });
});

describe("hasSchema", () => {
  it("returns true for payroll", () => {
    expect(hasSchema("payroll")).toBe(true);
  });

  it("returns true for payroll_employees", () => {
    expect(hasSchema("payroll_employees")).toBe(true);
  });

  it("returns true for employees", () => {
    expect(hasSchema("employees")).toBe(true);
  });

  it("returns true for calendar", () => {
    expect(hasSchema("calendar")).toBe(true);
  });

  it("returns false for companies", () => {
    expect(hasSchema("companies")).toBe(false);
  });

  it("returns false for attendance", () => {
    expect(hasSchema("attendance")).toBe(false);
  });

  it("returns false for names", () => {
    expect(hasSchema("names")).toBe(false);
  });
});

describe("tryParseDoc", () => {
  const schema = z.object({
    id: z.string(),
    name: z.string().min(1),
    age: z.number().min(0),
  });

  it("returns data on valid input", () => {
    const result = tryParseDoc(schema, "doc1", {
      id: "doc1",
      name: "Alice",
      age: 30,
    });
    expect(result).toEqual({
      data: { id: "doc1", name: "Alice", age: 30 },
    });
  });

  it("returns error on invalid input", () => {
    const result = tryParseDoc(schema, "doc1", {
      id: "doc1",
      name: "",
      age: -5,
    });
    expect(result).toHaveProperty("error");
    expect(result).not.toHaveProperty("data");
  });

  it("returns error on missing fields", () => {
    const result = tryParseDoc(schema, "doc1", { id: "doc1" });
    expect(result).toHaveProperty("error");
  });

  it("returns data with extra fields stripped", () => {
    const result = tryParseDoc(schema, "doc1", {
      id: "doc1",
      name: "Bob",
      age: 25,
      extra: "ignored",
    });
    expect(result).toEqual({
      data: { id: "doc1", name: "Bob", age: 25 },
    });
  });

  it("ignores the _id parameter", () => {
    const result = tryParseDoc(schema, "any-id", {
      id: "doc1",
      name: "Test",
      age: 20,
    });
    expect(result).toEqual({
      data: { id: "doc1", name: "Test", age: 20 },
    });
  });
});

describe("getByIdValidated", () => {
  const validPayroll = {
    id: "payroll-1",
    companyId: "company-1",
    name: "January 2026 Payroll",
    month: 1,
    year: 2026,
    status: "draft",
    isActive: true,
    isLocked: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    createdBy: "user-1",
  };

  it("returns validated data when document exists and matches schema", async () => {
    addMockDocs("payroll/payroll-1", [validPayroll]);

    const result = await getByIdValidated("payroll", "payroll-1");

    expect(result).toEqual(validPayroll);
  });

  it("returns null when document does not exist", async () => {
    const result = await getByIdValidated("payroll", "nonexistent");
    expect(result).toBeNull();
  });

  it("throws ValidationFailure when document fails schema validation", async () => {
    addMockDocs("payroll/bad-doc", [{ id: "bad-doc", name: "", month: 13 }]);

    await expect(getByIdValidated("payroll", "bad-doc")).rejects.toHaveProperty(
      "collection",
      "payroll",
    );
  });

  it("passes through data for collections without a schema", async () => {
    addMockDocs("companies/company-1", [
      { id: "company-1", name: "Acme Corp" },
    ]);

    const result = await getByIdValidated("companies", "company-1");

    expect(result).toEqual({ id: "company-1", name: "Acme Corp" });
  });

  it("calls getDoc with the correct document reference", async () => {
    addMockDocs("payroll/p1", [validPayroll]);

    await getByIdValidated("payroll", "p1");

    expect(getDoc).toHaveBeenCalledWith("payroll/p1");
  });
});

describe("getAllValidated", () => {
  const validPayroll = {
    id: "payroll-1",
    companyId: "company-1",
    name: "January 2026 Payroll",
    month: 1,
    year: 2026,
    status: "draft",
    isActive: true,
    isLocked: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    createdBy: "user-1",
  };

  it("returns all valid documents", async () => {
    addMockDocs("payroll", [
      validPayroll,
      { ...validPayroll, id: "payroll-2", name: "February 2026 Payroll" },
    ]);

    const result = await getAllValidated("payroll");

    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty collection", async () => {
    const result = await getAllValidated("payroll");
    expect(result).toEqual([]);
  });

  it("skips invalid documents and returns only valid ones", async () => {
    addMockDocs("payroll", [validPayroll, { id: "bad-doc", name: "" }]);

    const result = await getAllValidated("payroll");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(validPayroll);
    expect(console.warn).toHaveBeenCalled();
  });

  it("passes through data for collections without a schema", async () => {
    addMockDocs("companies", [
      { id: "c1", name: "Acme" },
      { id: "c2", name: "Globex" },
    ]);

    const result = await getAllValidated("companies");

    expect(result).toHaveLength(2);
  });

  it("applies filters when provided", async () => {
    addMockDocs("payroll", [
      validPayroll,
      { ...validPayroll, id: "payroll-2", status: "published" },
    ]);

    await getAllValidated("payroll", [
      { field: "status", op: "==", value: "draft" },
    ]);

    expect(where).toHaveBeenCalledWith("status", "==", "draft");
    expect(query).toHaveBeenCalled();
  });

  it("applies multiple filters", async () => {
    addMockDocs("payroll", [validPayroll]);

    await getAllValidated("payroll", [
      { field: "status", op: "==", value: "draft" },
      { field: "isActive", op: "==", value: true },
    ]);

    expect(where).toHaveBeenNthCalledWith(1, "status", "==", "draft");
    expect(where).toHaveBeenNthCalledWith(2, "isActive", "==", true);
  });

  it("skips all invalid documents and returns empty array", async () => {
    addMockDocs("payroll", [
      { id: "bad1", name: "" },
      { id: "bad2", month: 99 },
    ]);

    const result = await getAllValidated("payroll");

    expect(result).toHaveLength(0);
  });
});
