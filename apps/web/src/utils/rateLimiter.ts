interface RateLimitEntry {
  count: number;
  timestamp: number;
}

export class RateLimiter {
  private storage: Map<string, RateLimitEntry>;
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.storage = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry) {
      this.storage.set(key, { count: 1, timestamp: now });
      return true;
    }

    if (now - entry.timestamp > this.windowMs) {
      this.storage.set(key, { count: 1, timestamp: now });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(key: string): number {
    const entry = this.storage.get(key);
    if (!entry || Date.now() - entry.timestamp > this.windowMs) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  reset(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

// Pre-configured limiters for different operations
export const authRateLimiter = new RateLimiter(5, 60000); // 5 attempts per minute
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
export const searchRateLimiter = new RateLimiter(30, 60000); // 30 searches per minute
export const importRateLimiter = new RateLimiter(10, 300000); // 10 imports per 5 minutes

export default RateLimiter;
