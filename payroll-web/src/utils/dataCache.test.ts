import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { cache } from "./dataCache";

describe("DataCache (singleton)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cache.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("get and set", () => {
    it("should store and retrieve a value", () => {
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
    });

    it("should handle different data types", () => {
      cache.set("str", "hello");
      cache.set("num", 42);
      cache.set("bool", true);
      cache.set("obj", { a: 1, b: [2, 3] });
      cache.set("arr", [1, 2, 3]);
      cache.set("nullVal", null);

      expect(cache.get<string>("str")).toBe("hello");
      expect(cache.get<number>("num")).toBe(42);
      expect(cache.get<boolean>("bool")).toBe(true);
      expect(cache.get<object>("obj")).toEqual({ a: 1, b: [2, 3] });
      expect(cache.get<number[]>("arr")).toEqual([1, 2, 3]);
      expect(cache.get<null>("nullVal")).toBeNull();
    });

    it("should return null for missing key", () => {
      expect(cache.get("nonexistent")).toBeNull();
    });
  });

  describe("TTL expiry", () => {
    it("should expire entries after default TTL", () => {
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");

      // Default TTL is 5 minutes = 300000ms
      vi.advanceTimersByTime(300001);
      expect(cache.get("key1")).toBeNull();
    });

    it("should support custom TTL per entry", () => {
      cache.set("short", "short-lived", 1000);
      cache.set("long", "long-lived", 10000);

      vi.advanceTimersByTime(1001);
      expect(cache.get("short")).toBeNull();
      expect(cache.get("long")).toBe("long-lived");

      vi.advanceTimersByTime(9000);
      expect(cache.get("long")).toBeNull();
    });

    it("should clean up expired entries on get", () => {
      cache.set("key1", "value1", 1000);
      vi.advanceTimersByTime(2000);
      cache.get("key1"); // triggers cleanup

      // The entry should have been deleted from the store
      expect(cache.keys()).not.toContain("key1");
    });
  });

  describe("delete", () => {
    it("should remove a specific key", () => {
      cache.set("key1", "value1");
      expect(cache.delete("key1")).toBe(true);
      expect(cache.get("key1")).toBeNull();
    });

    it("should return false for non-existent key", () => {
      expect(cache.delete("nonexistent")).toBe(false);
    });

    it("should not affect other entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.delete("key1");
      expect(cache.get("key2")).toBe("value2");
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get("key1")).toBeNull();
    });

    it("should work on empty cache", () => {
      expect(() => cache.clear()).not.toThrow();
    });
  });

  describe("has", () => {
    it("should return true for existing unexpired entry", () => {
      cache.set("key1", "value1");
      expect(cache.has("key1")).toBe(true);
    });

    it("should return false for non-existent key", () => {
      expect(cache.has("nonexistent")).toBe(false);
    });

    it("should return false for expired entry", () => {
      cache.set("key1", "value1", 1000);
      vi.advanceTimersByTime(2000);
      expect(cache.has("key1")).toBe(false);
    });

    it("should clean up expired entry on has", () => {
      cache.set("key1", "value1", 1000);
      vi.advanceTimersByTime(2000);
      cache.has("key1");
      expect(cache.keys()).not.toContain("key1");
    });
  });

  describe("keys and size", () => {
    it("should return all keys", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      const keys = cache.keys();
      expect(keys).toContain("key1");
      expect(keys).toContain("key2");
      expect(keys).toHaveLength(2);
    });

    it("should return correct size", () => {
      expect(cache.size()).toBe(0);
      cache.set("key1", "value1");
      expect(cache.size()).toBe(1);
      cache.set("key2", "value2");
      expect(cache.size()).toBe(2);
      cache.delete("key1");
      expect(cache.size()).toBe(1);
    });
  });

  describe("max entries eviction", () => {
    it("should evict oldest entry when max entries exceeded", () => {
      // Default maxEntries is 100, fill it up
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      // All 100 slots are now taken
      expect(cache.size()).toBe(100);

      // Adding one more should evict the oldest (key0)
      cache.set("overflow", "last");
      expect(cache.get("key0")).toBeNull();
      expect(cache.get("overflow")).toBe("last");
      expect(cache.size()).toBe(100);
    });
  });
});
