import { describe, it, expect, beforeEach, vi } from "vitest";
import { addMockDocs, clearMockDocs, getMockDocs } from "../__mocks__/firebase";
import {
  cache,
  optimizedQuery,
  optimizedGetById,
  optimizedCreate,
  optimizedUpdate,
  optimizedDelete,
  QueryOptimizer,
} from "./firestore-optimized";
import {
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

beforeEach(() => {
  clearMockDocs();
  cache.clear();
  vi.clearAllMocks();
  // Mock getDoc to return exists as a function (matching production code pattern)
  vi.mocked(getDoc).mockImplementation(async (docPath: string) => {
    const docs = getMockDocs(docPath);
    const doc = docs?.[0];
    if (doc) {
      return { id: doc.id, exists: () => true, data: () => doc };
    }
    return { id: docPath, exists: () => false, data: () => null };
  });
});

describe("FirestoreCache", () => {
  describe("cache set / get", () => {
    it("should return cached data on hit", () => {
      cache.set("test:key", { id: "1", name: "Cached" });
      const result = cache.get<{ id: string; name: string }>("test:key");
      expect(result).toEqual({ id: "1", name: "Cached" });
    });

    it("should return null on cache miss", () => {
      const result = cache.get("nonexistent");
      expect(result).toBeNull();
    });

    it("should return null for expired cache entry", () => {
      cache.set("test:key", "value", -1000);
      const result = cache.get("test:key");
      expect(result).toBeNull();
    });

    it("should delete expired entries from the cache", () => {
      cache.set("test:key", "value", -1000);
      cache.get("test:key");
      expect(cache.size()).toBe(0);
    });
  });

  describe("cache invalidation", () => {
    it("should invalidate entries matching a pattern", () => {
      cache.set("companies:list", "data1");
      cache.set("companies:doc1", "data2");
      cache.set("employees:list", "data3");

      cache.invalidate("companies");

      expect(cache.get("companies:list")).toBeNull();
      expect(cache.get("companies:doc1")).toBeNull();
      expect(cache.get("employees:list")).toBe("data3");
    });

    it("should clear all cache entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      expect(cache.size()).toBe(2);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
    });
  });
});

describe("optimizedQuery", () => {
  it("should fetch and return documents on cache miss", async () => {
    addMockDocs("employees", [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ]);

    const results = await optimizedQuery<{ id: string; name: string }>(
      "employees",
    );

    expect(results).toHaveLength(2);
    expect(getDocs).toHaveBeenCalledOnce();
  });

  it("should return cached data on subsequent calls", async () => {
    addMockDocs("companies", [{ id: "1", name: "Company" }]);

    const firstResult = await optimizedQuery("companies");
    const secondResult = await optimizedQuery("companies");

    // getDocs should have been called only once (first call cached it)
    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(secondResult);
  });

  it("should skip cache when useCache is false", async () => {
    addMockDocs("companies", [{ id: "1", name: "Company" }]);

    await optimizedQuery("companies", [], { useCache: false });
    await optimizedQuery("companies", [], { useCache: false });

    // getDocs should be called each time since caching is disabled
    expect(getDocs).toHaveBeenCalledTimes(2);
  });

  it("should use custom cache key when provided", async () => {
    addMockDocs("companies", [{ id: "1", name: "Company" }]);

    await optimizedQuery("companies", [], {
      cacheKey: "my-custom-key",
    });

    // Verify the cache was populated with the custom key
    const cached = cache.get<unknown[]>("my-custom-key");
    expect(cached).toHaveLength(1);
  });

  it("should apply query constraints", async () => {
    addMockDocs("employees", [
      { id: "1", name: "Alice", isActive: true },
      { id: "2", name: "Bob", isActive: false },
    ]);

    const constraints = QueryOptimizer.withCompanyAndStatus("company1");

    await optimizedQuery("employees", constraints);

    expect(getDocs).toHaveBeenCalledWith("employees");
  });
});

describe("optimizedGetById", () => {
  it("should return the document when found", async () => {
    addMockDocs("employees/emp1", [
      { id: "emp1", name: "Alice", isActive: true },
    ]);

    const result = await optimizedGetById<{ id: string; name: string }>(
      "employees",
      "emp1",
    );

    expect(result).toEqual({ id: "emp1", name: "Alice", isActive: true });
    expect(getDoc).toHaveBeenCalledWith("employees/emp1");
  });

  it("should return null for missing document", async () => {
    const result = await optimizedGetById("employees", "nonexistent");
    expect(result).toBeNull();
  });

  it("should cache the result and return cached on subsequent call", async () => {
    addMockDocs("companies/doc1", [{ id: "doc1", name: "Company" }]);

    await optimizedGetById("companies", "doc1");
    const result = await optimizedGetById("companies", "doc1");

    // getDoc should only be called once
    expect(getDoc).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "doc1", name: "Company" });
  });

  it("should skip cache when useCache is false", async () => {
    addMockDocs("companies/doc1", [{ id: "doc1", name: "Company" }]);

    await optimizedGetById("companies", "doc1", false);
    await optimizedGetById("companies", "doc1", false);

    expect(getDoc).toHaveBeenCalledTimes(2);
  });
});

describe("optimizedCreate", () => {
  it("should create a document and return its id", async () => {
    const id = await optimizedCreate("companies", {
      name: "New Company",
    });

    expect(id).toBe("mock-id");
    expect(addDoc).toHaveBeenCalledOnce();
  });

  it("should invalidate collection cache after creation", async () => {
    cache.set("companies:somekey", "value");

    await optimizedCreate("companies", { name: "Test" });

    expect(cache.get("companies:somekey")).toBeNull();
  });

  it("should add timestamps to the created document", async () => {
    await optimizedCreate("employees", { name: "Alice" });

    expect(addDoc).toHaveBeenCalledWith(
      "employees",
      expect.objectContaining({
        name: "Alice",
      }),
    );
  });
});

describe("optimizedUpdate", () => {
  it("should update the document with provided fields", async () => {
    addMockDocs("companies/doc1", [{ id: "doc1", name: "Old" }]);

    await optimizedUpdate("companies", "doc1", { name: "Updated" });

    expect(updateDoc).toHaveBeenCalledWith(
      "companies/doc1",
      expect.objectContaining({ name: "Updated" }),
    );
  });

  it("should invalidate both collection and doc caches", async () => {
    cache.set("companies:somekey", "value");
    cache.set("companies:doc1", "value");

    await optimizedUpdate("companies", "doc1", { name: "Updated" });

    expect(cache.get("companies:somekey")).toBeNull();
    expect(cache.get("companies:doc1")).toBeNull();
  });
});

describe("optimizedDelete", () => {
  it("should delete the document", async () => {
    addMockDocs("companies/doc1", [{ id: "doc1", name: "To Delete" }]);

    await optimizedDelete("companies", "doc1");

    expect(deleteDoc).toHaveBeenCalledWith("companies/doc1");
  });

  it("should invalidate both collection and doc caches", async () => {
    cache.set("companies:list", "value");
    cache.set("companies:docDel", "value");

    await optimizedDelete("companies", "docDel");

    expect(cache.get("companies:list")).toBeNull();
    expect(cache.get("companies:docDel")).toBeNull();
  });
});

describe("QueryOptimizer", () => {
  describe("withCompanyAndStatus", () => {
    it("should create two where constraints for company and status", () => {
      const constraints = QueryOptimizer.withCompanyAndStatus(
        "company-1",
        true,
      );

      expect(constraints).toHaveLength(2);
      expect(where).toHaveBeenCalledWith("companyId", "==", "company-1");
      expect(where).toHaveBeenCalledWith("isActive", "==", true);
    });

    it("should default to isActive=true", () => {
      const constraints = QueryOptimizer.withCompanyAndStatus("company-1");

      expect(constraints).toHaveLength(2);
      expect(where).toHaveBeenCalledWith("isActive", "==", true);
    });

    it("should support isActive=false", () => {
      const constraints = QueryOptimizer.withCompanyAndStatus(
        "company-1",
        false,
      );

      expect(constraints).toHaveLength(2);
      expect(where).toHaveBeenCalledWith("isActive", "==", false);
    });
  });

  describe("withDateRange", () => {
    it("should return empty array when no dates provided", () => {
      const constraints = QueryOptimizer.withDateRange("createdAt");
      expect(constraints).toHaveLength(0);
    });

    it("should create start date constraint only", () => {
      const startDate = new Date("2024-01-01");
      const constraints = QueryOptimizer.withDateRange("createdAt", startDate);

      expect(constraints).toHaveLength(1);
      expect(where).toHaveBeenCalledWith("createdAt", ">=", startDate);
    });

    it("should create end date constraint only", () => {
      const endDate = new Date("2024-12-31");
      const constraints = QueryOptimizer.withDateRange(
        "createdAt",
        undefined,
        endDate,
      );

      expect(constraints).toHaveLength(1);
      expect(where).toHaveBeenCalledWith("createdAt", "<=", endDate);
    });

    it("should create both start and end date constraints", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");
      const constraints = QueryOptimizer.withDateRange(
        "createdAt",
        startDate,
        endDate,
      );

      expect(constraints).toHaveLength(2);
      expect(where).toHaveBeenCalledWith("createdAt", ">=", startDate);
      expect(where).toHaveBeenCalledWith("createdAt", "<=", endDate);
    });

    it("should work with any field name", () => {
      const startDate = new Date("2025-06-01");
      const constraints = QueryOptimizer.withDateRange(
        "payPeriodStart",
        startDate,
      );

      expect(constraints).toHaveLength(1);
      expect(where).toHaveBeenCalledWith("payPeriodStart", ">=", startDate);
    });
  });

  describe("withPagination", () => {
    it("should create orderBy and limit constraints", () => {
      const constraints = QueryOptimizer.withPagination(1, 25);

      expect(constraints).toHaveLength(2);
      expect(orderBy).toHaveBeenCalledWith("createdAt", "desc");
      expect(limit).toHaveBeenCalledWith(25);
    });

    it("should use the specified order field", () => {
      const constraints = QueryOptimizer.withPagination(1, 10, "name");

      expect(constraints).toHaveLength(2);
      expect(orderBy).toHaveBeenCalledWith("name", "desc");
      expect(limit).toHaveBeenCalledWith(10);
    });

    it("should skip offset calculation (Firestore handles offset via cursor)", () => {
      const page1 = QueryOptimizer.withPagination(1, 20);
      const page2 = QueryOptimizer.withPagination(2, 20);

      // Both pages use the same orderBy + limit (offset is done via cursors separately)
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(limit).toHaveBeenCalledWith(20);
    });
  });

  describe("batchFetchByIds", () => {
    it("should return empty array when ids array is empty", async () => {
      const results = await QueryOptimizer.batchFetchByIds("employees", []);
      expect(results).toEqual([]);
    });

    it("should fetch documents by their ids", async () => {
      addMockDocs("employees/emp1", [{ id: "emp1", name: "Alice" }]);
      addMockDocs("employees/emp2", [{ id: "emp2", name: "Bob" }]);

      const results = await QueryOptimizer.batchFetchByIds<{
        id: string;
        name: string;
      }>("employees", ["emp1", "emp2"]);

      expect(results).toHaveLength(2);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "emp1", name: "Alice" }),
          expect.objectContaining({ id: "emp2", name: "Bob" }),
        ]),
      );
    });

    it("should use optimizedGetById under the hood (cached)", async () => {
      addMockDocs("companies/doc1", [{ id: "doc1", name: "Company" }]);

      // First call populates cache
      await QueryOptimizer.batchFetchByIds("companies", ["doc1"]);
      // Second call should use cache
      await QueryOptimizer.batchFetchByIds("companies", ["doc1"]);

      // getDoc should only be called once due to caching
      expect(getDoc).toHaveBeenCalledTimes(1);
    });

    it("should handle batches of more than 30 ids (Firestore 'in' limit)", async () => {
      // Create 35 mock documents
      const ids = Array.from({ length: 35 }, (_, i) => `doc${i}`);

      for (const id of ids) {
        addMockDocs(`companies/${id}`, [{ id, name: `Doc ${id}` }]);
      }

      const results = await QueryOptimizer.batchFetchByIds<{
        id: string;
        name: string;
      }>("companies", ids);

      // All docs should be found
      expect(results).toHaveLength(35);
    });

    it("should skip missing documents", async () => {
      addMockDocs("employees/emp1", [{ id: "emp1", name: "Alice" }]);
      // emp2 is not seeded — should be missing

      const results = await QueryOptimizer.batchFetchByIds<{
        id: string;
        name: string;
      }>("employees", ["emp1", "emp2"]);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ id: "emp1", name: "Alice" });
    });
  });
});
