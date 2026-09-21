import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  RateLimiter,
  authRateLimiter,
  apiRateLimiter,
  searchRateLimiter,
  importRateLimiter,
} from "./rateLimiter";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new RateLimiter(3, 1000); // 3 requests per 1s window
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("constructor", () => {
    it("should create with default values", () => {
      const defaultLimiter = new RateLimiter();
      // Default: 100 requests per 60s, so first request should be allowed
      expect(defaultLimiter.isAllowed("key")).toBe(true);
    });

    it("should create with custom values", () => {
      const customLimiter = new RateLimiter(5, 30000);
      for (let i = 0; i < 5; i++) {
        expect(customLimiter.isAllowed("key")).toBe(true);
      }
      expect(customLimiter.isAllowed("key")).toBe(false);
    });
  });

  describe("isAllowed", () => {
    it("should allow requests within limit", () => {
      expect(limiter.isAllowed("key1")).toBe(true);
      expect(limiter.isAllowed("key1")).toBe(true);
      expect(limiter.isAllowed("key1")).toBe(true);
    });

    it("should deny requests over limit", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      expect(limiter.isAllowed("key1")).toBe(false);
    });

    it("should track different keys separately", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      expect(limiter.isAllowed("key1")).toBe(false);
      expect(limiter.isAllowed("key2")).toBe(true);
    });

    it("should allow request for new key after hitting limit on another", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      expect(limiter.isAllowed("key1")).toBe(false);
      expect(limiter.isAllowed("key2")).toBe(true);
    });

    it("should handle string keys with special characters", () => {
      expect(limiter.isAllowed("")).toBe(true);
      expect(limiter.isAllowed("key/with/slashes")).toBe(true);
      expect(limiter.isAllowed("key with spaces")).toBe(true);
      expect(limiter.isAllowed("key:with:colons")).toBe(true);
    });

    it("should deny second request with 0 max requests", () => {
      const zeroLimiter = new RateLimiter(0, 60000);
      // First request creates entry (always allowed), then count >= max blocks further
      expect(zeroLimiter.isAllowed("key")).toBe(true);
      expect(zeroLimiter.isAllowed("key")).toBe(false);
    });
  });

  describe("window reset", () => {
    it("should reset after window expires", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      expect(limiter.isAllowed("key1")).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(limiter.isAllowed("key1")).toBe(true);
    });

    it("should not reset before window expires", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");

      vi.advanceTimersByTime(500);
      expect(limiter.isAllowed("key1")).toBe(false);

      vi.advanceTimersByTime(499);
      expect(limiter.isAllowed("key1")).toBe(false);
    });

    it("should reset each key independently", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key2");
      limiter.isAllowed("key2");

      vi.advanceTimersByTime(1001);

      // key1 and key2 should both be reset
      expect(limiter.isAllowed("key1")).toBe(true);
      expect(limiter.isAllowed("key2")).toBe(true);
    });

    it("should start fresh count after window reset", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      expect(limiter.isAllowed("key1")).toBe(false);

      vi.advanceTimersByTime(1001);

      // Should be able to make 3 requests again
      expect(limiter.isAllowed("key1")).toBe(true);
      expect(limiter.isAllowed("key1")).toBe(true);
      expect(limiter.isAllowed("key1")).toBe(true);
      expect(limiter.isAllowed("key1")).toBe(false);
    });
  });

  describe("getRemainingRequests", () => {
    it("should return max requests for unknown key", () => {
      expect(limiter.getRemainingRequests("unknown")).toBe(3);
    });

    it("should return correct remaining count", () => {
      expect(limiter.getRemainingRequests("key1")).toBe(3);
      limiter.isAllowed("key1");
      expect(limiter.getRemainingRequests("key1")).toBe(2);
      limiter.isAllowed("key1");
      expect(limiter.getRemainingRequests("key1")).toBe(1);
      limiter.isAllowed("key1");
      expect(limiter.getRemainingRequests("key1")).toBe(0);
    });

    it("should return max requests after window expires", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      expect(limiter.getRemainingRequests("key1")).toBe(1);

      vi.advanceTimersByTime(1001);

      expect(limiter.getRemainingRequests("key1")).toBe(3);
    });

    it("should never return negative", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      expect(limiter.getRemainingRequests("key1")).toBe(0);
    });
  });

  describe("reset", () => {
    it("should allow requests after reset", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      expect(limiter.isAllowed("key1")).toBe(false);

      limiter.reset("key1");
      expect(limiter.isAllowed("key1")).toBe(true);
    });

    it("should reset count to zero", () => {
      limiter.isAllowed("key1");
      limiter.reset("key1");
      expect(limiter.getRemainingRequests("key1")).toBe(3);
    });

    it("should only affect specified key", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key2");

      limiter.reset("key1");

      // After reset, key1 is fresh; isAllowed creates new entry (count=1), so remaining=2
      expect(limiter.isAllowed("key1")).toBe(true);
      expect(limiter.getRemainingRequests("key1")).toBe(2);
      // key2 unchanged: count=1, remaining=2
      expect(limiter.isAllowed("key2")).toBe(true);
      expect(limiter.getRemainingRequests("key2")).toBe(1);
    });

    it("should not throw on non-existent key", () => {
      expect(() => limiter.reset("nonexistent")).not.toThrow();
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key2");
      limiter.isAllowed("key3");

      limiter.clear();

      expect(limiter.getRemainingRequests("key1")).toBe(3);
      expect(limiter.getRemainingRequests("key2")).toBe(3);
      expect(limiter.getRemainingRequests("key3")).toBe(3);
    });

    it("should allow requests again after clear", () => {
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      limiter.isAllowed("key1");
      expect(limiter.isAllowed("key1")).toBe(false);

      limiter.clear();

      expect(limiter.isAllowed("key1")).toBe(true);
    });

    it("should not throw on empty limiter", () => {
      expect(() => limiter.clear()).not.toThrow();
    });
  });
});

describe("Pre-configured limiters", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    authRateLimiter.clear();
    apiRateLimiter.clear();
    searchRateLimiter.clear();
    importRateLimiter.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("authRateLimiter (5 requests per 60s)", () => {
    it("should allow up to 5 requests", () => {
      for (let i = 0; i < 5; i++) {
        expect(authRateLimiter.isAllowed("login")).toBe(true);
      }
      expect(authRateLimiter.isAllowed("login")).toBe(false);
    });

    it("should reset after 60 seconds", () => {
      for (let i = 0; i < 5; i++) {
        authRateLimiter.isAllowed("login");
      }
      expect(authRateLimiter.isAllowed("login")).toBe(false);

      vi.advanceTimersByTime(60001);

      expect(authRateLimiter.isAllowed("login")).toBe(true);
    });

    it("should report correct remaining requests", () => {
      expect(authRateLimiter.getRemainingRequests("login")).toBe(5);
      authRateLimiter.isAllowed("login");
      expect(authRateLimiter.getRemainingRequests("login")).toBe(4);
    });
  });

  describe("apiRateLimiter (100 requests per 60s)", () => {
    it("should allow up to 100 requests", () => {
      for (let i = 0; i < 100; i++) {
        expect(apiRateLimiter.isAllowed("api")).toBe(true);
      }
      expect(apiRateLimiter.isAllowed("api")).toBe(false);
    });

    it("should reset after 60 seconds", () => {
      for (let i = 0; i < 100; i++) {
        apiRateLimiter.isAllowed("api");
      }
      expect(apiRateLimiter.isAllowed("api")).toBe(false);

      vi.advanceTimersByTime(60001);

      expect(apiRateLimiter.isAllowed("api")).toBe(true);
    });
  });

  describe("searchRateLimiter (30 requests per 60s)", () => {
    it("should allow up to 30 requests", () => {
      for (let i = 0; i < 30; i++) {
        expect(searchRateLimiter.isAllowed("search")).toBe(true);
      }
      expect(searchRateLimiter.isAllowed("search")).toBe(false);
    });

    it("should reset after 60 seconds", () => {
      for (let i = 0; i < 30; i++) {
        searchRateLimiter.isAllowed("search");
      }
      expect(searchRateLimiter.isAllowed("search")).toBe(false);

      vi.advanceTimersByTime(60001);

      expect(searchRateLimiter.isAllowed("search")).toBe(true);
    });
  });

  describe("importRateLimiter (10 requests per 5min)", () => {
    it("should allow up to 10 requests", () => {
      for (let i = 0; i < 10; i++) {
        expect(importRateLimiter.isAllowed("import")).toBe(true);
      }
      expect(importRateLimiter.isAllowed("import")).toBe(false);
    });

    it("should reset after 300 seconds", () => {
      for (let i = 0; i < 10; i++) {
        importRateLimiter.isAllowed("import");
      }
      expect(importRateLimiter.isAllowed("import")).toBe(false);

      vi.advanceTimersByTime(300001);

      expect(importRateLimiter.isAllowed("import")).toBe(true);
    });

    it("should not reset before 300 seconds", () => {
      for (let i = 0; i < 10; i++) {
        importRateLimiter.isAllowed("import");
      }

      vi.advanceTimersByTime(299999);
      expect(importRateLimiter.isAllowed("import")).toBe(false);
    });
  });
});

describe("Default export", () => {
  it("should export RateLimiter as default", async () => {
    const mod = await import("./rateLimiter");
    expect(mod.default).toBe(RateLimiter);
  });
});
