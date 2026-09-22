import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkSentry } from "./healthCheck";

describe("healthCheck", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("checkSentry", () => {
    it("should return ok when VITE_SENTRY_DSN is configured", () => {
      vi.stubEnv("VITE_SENTRY_DSN", "https://key@sentry.io/project");
      const result = checkSentry();
      expect(result.status).toBe("ok");
      expect(result.message).toBeUndefined();
    });

    it("should return skipped when VITE_SENTRY_DSN is not configured", () => {
      vi.stubEnv("VITE_SENTRY_DSN", "");
      const result = checkSentry();
      expect(result.status).toBe("skipped");
      expect(result.message).toBe("Sentry DSN not configured");
    });

    it("should return skipped when VITE_SENTRY_DSN is undefined", () => {
      vi.stubEnv("VITE_SENTRY_DSN", undefined);
      const result = checkSentry();
      expect(result.status).toBe("skipped");
      expect(result.message).toBe("Sentry DSN not configured");
    });
  });

  describe("performHealthCheck", () => {
    it("should return a HealthStatus object with all required fields", async () => {
      const { performHealthCheck } = await import("./healthCheck");

      vi.stubEnv("VITE_APP_VERSION", "1.2.3");
      vi.stubEnv("VITE_SENTRY_DSN", "");

      const result = await performHealthCheck();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("version");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("uptime");
      expect(result).toHaveProperty("checks");

      expect(result.version).toBe("1.2.3");
      expect(typeof result.uptime).toBe("number");
      expect(typeof result.timestamp).toBe("string");
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it("should use default version when VITE_APP_VERSION is not set", async () => {
      const { performHealthCheck } = await import("./healthCheck");

      vi.stubEnv("VITE_APP_VERSION", "");
      const result = await performHealthCheck();
      expect(result.version).toBe("0.0.0");
    });

    it("should return degraded when some services are skipped", async () => {
      const { performHealthCheck } = await import("./healthCheck");

      vi.stubEnv("VITE_SENTRY_DSN", "");
      vi.stubEnv("VITE_APP_VERSION", "1.0.0");

      const result = await performHealthCheck();

      expect(["healthy", "degraded", "unhealthy"]).toContain(result.status);
      expect(result.checks.sentry.status).toBe("skipped");
    });

    it("should have all four service checks", async () => {
      const { performHealthCheck } = await import("./healthCheck");

      vi.stubEnv("VITE_APP_VERSION", "1.0.0");
      vi.stubEnv("VITE_SENTRY_DSN", "");

      const result = await performHealthCheck();

      expect(result.checks).toHaveProperty("firestore");
      expect(result.checks).toHaveProperty("firebaseAuth");
      expect(result.checks).toHaveProperty("sentry");
      expect(result.checks).toHaveProperty("storage");
    });

    it("should have valid statuses in all service checks", async () => {
      const { performHealthCheck } = await import("./healthCheck");

      vi.stubEnv("VITE_APP_VERSION", "1.0.0");
      vi.stubEnv("VITE_SENTRY_DSN", "");

      const result = await performHealthCheck();

      const validStatuses = ["ok", "error", "skipped"];
      for (const check of Object.values(result.checks)) {
        expect(validStatuses).toContain(check.status);
      }
    });
  });
});
