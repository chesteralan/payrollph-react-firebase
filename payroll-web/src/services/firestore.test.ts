import { describe, it, expect, beforeEach, vi } from "vitest";
import { addMockDocs, clearMockDocs, getMockDocs } from "../__mocks__/firebase";
import { getById, getAll, create, update, remove } from "./firestore";
import {
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
  query,
  serverTimestamp,
} from "firebase/firestore";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
  // Mock getDoc to return exists as a function (matching the production code pattern)
  vi.mocked(getDoc).mockImplementation(async (docPath: string) => {
    const docs = getMockDocs(docPath);
    const doc = docs?.[0];
    if (doc) {
      return { id: doc.id, exists: () => true, data: () => doc };
    }
    return { id: docPath, exists: () => false, data: () => null };
  });
});

describe("getById", () => {
  it("should return the correct document when found", async () => {
    addMockDocs("companies/doc1", [
      { id: "doc1", name: "Test Company", isActive: true },
    ]);

    const result = await getById<{
      id: string;
      name: string;
      isActive: boolean;
    }>("companies", "doc1");

    expect(result).toEqual({
      id: "doc1",
      name: "Test Company",
      isActive: true,
    });
  });

  it("should return null for a missing document", async () => {
    const result = await getById("companies", "nonexistent-id");
    expect(result).toBeNull();
  });

  it("should return null when document does not exist in empty collection", async () => {
    addMockDocs("companies/doc1", []);
    const result = await getById("companies", "doc1");
    expect(result).toBeNull();
  });

  it("should call getDoc with the correct document reference", async () => {
    addMockDocs("employees/emp1", [{ id: "emp1", name: "Alice" }]);

    await getById("employees", "emp1");

    expect(getDoc).toHaveBeenCalledWith("employees/emp1");
  });
});

describe("getAll", () => {
  it("should return all documents when no filters are applied", async () => {
    addMockDocs("companies", [
      { id: "1", name: "Company A" },
      { id: "2", name: "Company B" },
      { id: "3", name: "Company C" },
    ]);

    const results = await getAll("companies");

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ id: "1", name: "Company A" });
    expect(results[1]).toEqual({ id: "2", name: "Company B" });
    expect(results[2]).toEqual({ id: "3", name: "Company C" });
  });

  it("should return empty array when collection is empty", async () => {
    const results = await getAll("companies");
    expect(results).toEqual([]);
  });

  it("should apply filters when provided", async () => {
    addMockDocs("employees", [
      { id: "1", name: "Alice", isActive: true, department: "Engineering" },
      { id: "2", name: "Bob", isActive: false, department: "Sales" },
      { id: "3", name: "Charlie", isActive: true, department: "Engineering" },
    ]);

    await getAll("employees", [
      { field: "department", op: "==", value: "Engineering" },
    ]);

    expect(where).toHaveBeenCalledWith("department", "==", "Engineering");
    expect(query).toHaveBeenCalled();
  });

  it("should apply ordering when provided", async () => {
    addMockDocs("companies", [
      { id: "1", name: "Alpha" },
      { id: "2", name: "Beta" },
    ]);

    await getAll("companies", undefined, {
      field: "name",
      direction: "asc",
    });

    expect(orderBy).toHaveBeenCalledWith("name", "asc");
  });

  it("should apply pagination limit when provided", async () => {
    addMockDocs("companies", [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
      { id: "3", name: "C" },
      { id: "4", name: "D" },
      { id: "5", name: "E" },
    ]);

    await getAll("companies", undefined, undefined, 2);

    expect(limit).toHaveBeenCalledWith(2);
  });

  it("should combine filters, ordering, and pagination", async () => {
    addMockDocs("employees", [
      { id: "1", name: "Alice", isActive: true },
      { id: "2", name: "Bob", isActive: true },
    ]);

    await getAll(
      "employees",
      [{ field: "isActive", op: "==", value: true }],
      { field: "name", direction: "desc" },
      10,
    );

    expect(where).toHaveBeenCalledWith("isActive", "==", true);
    expect(orderBy).toHaveBeenCalledWith("name", "desc");
    expect(limit).toHaveBeenCalledWith(10);
  });

  it("should apply multiple filters", async () => {
    addMockDocs("employees", [
      { id: "1", name: "Alice", isActive: true, department: "Engineering" },
    ]);

    await getAll("employees", [
      { field: "isActive", op: "==", value: true },
      { field: "department", op: "==", value: "Engineering" },
    ]);

    // where is called for each filter in order
    expect(where).toHaveBeenNthCalledWith(1, "isActive", "==", true);
    expect(where).toHaveBeenNthCalledWith(2, "department", "==", "Engineering");
  });
});

describe("create", () => {
  it("should add a document and return its id", async () => {
    const result = await create("companies", {
      name: "New Company",
      address: "123 Main St",
    });

    expect(result).toBe("mock-id");
    expect(addDoc).toHaveBeenCalledOnce();
  });

  it("should call addDoc with the correct collection path", async () => {
    await create("employees", { name: "Alice", isActive: true });

    expect(addDoc).toHaveBeenCalledWith(
      "employees",
      expect.objectContaining({
        name: "Alice",
        isActive: true,
      }),
    );
  });

  it("should add serverTimestamp for createdAt and updatedAt", async () => {
    await create("companies", { name: "Test" });

    expect(addDoc).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe("update", () => {
  it("should update the document with provided fields", async () => {
    addMockDocs("companies/doc1", [{ id: "doc1", name: "Old Name" }]);

    await update("companies", "doc1", { name: "New Name" });

    expect(updateDoc).toHaveBeenCalledWith(
      "companies/doc1",
      expect.objectContaining({
        name: "New Name",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it("should add serverTimestamp for updatedAt", async () => {
    addMockDocs("companies/doc1", [{ id: "doc1", name: "Test" }]);

    await update("companies", "doc1", { name: "Updated" });

    expect(updateDoc).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        updatedAt: serverTimestamp(),
      }),
    );
  });
});

describe("remove", () => {
  it("should delete the document with the given id", async () => {
    addMockDocs("companies/doc1", [{ id: "doc1", name: "To Delete" }]);

    await remove("companies", "doc1");

    expect(deleteDoc).toHaveBeenCalledWith("companies/doc1");
  });

  it("should not throw when deleting a non-existent document", async () => {
    await expect(remove("companies", "nonexistent")).resolves.toBeUndefined();
  });
});
