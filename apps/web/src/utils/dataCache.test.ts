import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { cache, useCache, useMultiCache } from "./dataCache";

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

    it("should overwrite existing key", () => {
      cache.set("key1", "first");
      expect(cache.get("key1")).toBe("first");
      cache.set("key1", "second");
      expect(cache.get("key1")).toBe("second");
      expect(cache.size()).toBe(1);
    });

    it("should store and retrieve undefined", () => {
      cache.set("undef", undefined);
      expect(cache.has("undef")).toBe(true);
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

    it("should not expire entries before TTL", () => {
      cache.set("key1", "value1", 5000);
      vi.advanceTimersByTime(4999);
      expect(cache.get("key1")).toBe("value1");
    });

    it("should expire at exactly TTL boundary", () => {
      cache.set("key1", "value1", 1000);
      vi.advanceTimersByTime(1000);
      // Date.now() > expiresAt is strictly greater, so at exactly TTL it's still valid
      expect(cache.get("key1")).toBe("value1");
      vi.advanceTimersByTime(1);
      expect(cache.get("key1")).toBeNull();
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

    it("should reduce size after deletion", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      expect(cache.size()).toBe(2);
      cache.delete("key1");
      expect(cache.size()).toBe(1);
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

    it("should not return true after TTL with has", () => {
      cache.set("key1", "value1", 500);
      vi.advanceTimersByTime(501);
      expect(cache.has("key1")).toBe(false);
      expect(cache.size()).toBe(0);
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

    it("should return empty array for keys on empty cache", () => {
      expect(cache.keys()).toEqual([]);
    });

    it("should not include expired keys after cleanup", () => {
      cache.set("a", "1", 1000);
      cache.set("b", "2", 5000);
      vi.advanceTimersByTime(2000);
      // get triggers cleanup of expired entries
      cache.get("a");
      const keys = cache.keys();
      expect(keys).not.toContain("a");
      expect(keys).toContain("b");
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

    it("should evict multiple entries when adding many over capacity", () => {
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      cache.set("extra1", "a");
      cache.set("extra2", "b");
      expect(cache.get("key0")).toBeNull();
      expect(cache.get("key1")).toBeNull();
      expect(cache.size()).toBe(100);
    });
  });

  describe("set overwrites and timestamp", () => {
    it("should refresh expiry on overwrite", () => {
      cache.set("key1", "first", 1000);
      vi.advanceTimersByTime(800);
      cache.set("key1", "second", 1000);
      // 800 + 1000 = 1800ms from start, but entry was refreshed at 800ms
      vi.advanceTimersByTime(999);
      expect(cache.get("key1")).toBe("second");
      vi.advanceTimersByTime(2);
      expect(cache.get("key1")).toBeNull();
    });
  });
});

describe("useCache hook", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("should return cached data when available", async () => {
    cache.set("test-key", "cached-value");
    const fetchFn = vi.fn().mockResolvedValue("fresh-value");

    const { result } = renderHook(() => useCache("test-key", fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("cached-value");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("should call fetchFn when cache miss", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fresh-value");

    const { result } = renderHook(() => useCache("miss-key", fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("fresh-value");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("should handle fetch error", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("Fetch failed"));

    const { result } = renderHook(() => useCache("error-key", fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe("Fetch failed");
    expect(result.current.data).toBeNull();
  });

  it("should refresh data on demand", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fresh-value");

    const { result } = renderHook(() => useCache("refresh-key", fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("fresh-value");

    fetchFn.mockResolvedValue("updated-value");
    cache.delete("refresh-key");
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.data).toBe("updated-value"));
  });

  it("should store fetched result in cache", async () => {
    const fetchFn = vi.fn().mockResolvedValue("fetched-value");

    const { result } = renderHook(() => useCache("cache-store-key", fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(cache.get("cache-store-key")).toBe("fetched-value");
  });

  it("should use cached data on refresh", async () => {
    cache.set("refresh-cached", "cached");
    const fetchFn = vi.fn().mockResolvedValue("fresh");

    const { result } = renderHook(() => useCache("refresh-cached", fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("cached");

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("cached");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("should handle refresh error", async () => {
    const fetchFn = vi.fn().mockResolvedValue("initial");

    const { result } = renderHook(() => useCache("refresh-error", fetchFn));
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchFn.mockRejectedValue(new Error("Refresh failed"));
    cache.delete("refresh-error");

    await act(async () => {
      try {
        await result.current.refresh();
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
  });

  it("should pass ttl option to cache.set", async () => {
    const fetchFn = vi.fn().mockResolvedValue("ttl-value");

    const { result } = renderHook(() =>
      useCache("ttl-key", fetchFn, { ttl: 2000 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(cache.get("ttl-key")).toBe("ttl-value");
  });
});

describe("useMultiCache hook", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("should fetch all keys", async () => {
    const fetchFn = vi
      .fn()
      .mockImplementation(async (key: string) => `${key}-value`);

    const { result } = renderHook(() => useMultiCache(["a", "b"], fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results).toEqual({ a: "a-value", b: "b-value" });
  });

  it("should use cached values when available", async () => {
    cache.set("a", "cached-a");
    const fetchFn = vi
      .fn()
      .mockImplementation(async (key: string) => `${key}-fetched`);

    const { result } = renderHook(() => useMultiCache(["a", "b"], fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results.a).toBe("cached-a");
    expect(result.current.results.b).toBe("b-fetched");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("should handle fetch failures gracefully", async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Fail"))
      .mockResolvedValueOnce("ok");

    const { result } = renderHook(() => useMultiCache(["a", "b"], fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results.a).toBeNull();
    expect(result.current.results.b).toBe("ok");
  });

  it("should handle empty keys array", async () => {
    const fetchFn = vi.fn();

    const { result } = renderHook(() => useMultiCache([], fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results).toEqual({});
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("should cache fetched results", async () => {
    const fetchFn = vi
      .fn()
      .mockImplementation(async (key: string) => `${key}-val`);

    const { result } = renderHook(() => useMultiCache(["x", "y"], fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(cache.get("x")).toBe("x-val");
    expect(cache.get("y")).toBe("y-val");
  });

  it("should pass ttl option to cache.set", async () => {
    const fetchFn = vi
      .fn()
      .mockImplementation(async (key: string) => `${key}-ttl`);

    const { result } = renderHook(() =>
      useMultiCache(["m"], fetchFn, { ttl: 3000 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(cache.get("m")).toBe("m-ttl");
  });

  it("should handle all keys from cache", async () => {
    cache.set("a", "cached-a");
    cache.set("b", "cached-b");
    const fetchFn = vi.fn();

    const { result } = renderHook(() => useMultiCache(["a", "b"], fetchFn));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.results).toEqual({ a: "cached-a", b: "cached-b" });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
