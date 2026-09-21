import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("VITE_SENTRY_DSN", "");
vi.stubEnv("MODE", "test");
vi.stubEnv("VITE_APP_VERSION", "1.0.0");
vi.stubEnv("PROD", false);
vi.stubEnv("DEV", true);

const { mockInit, mockCaptureException, mockCaptureMessage, mockSetUser } = vi.hoisted(() => ({
  mockInit: vi.fn(),
  mockCaptureException: vi.fn(),
  mockCaptureMessage: vi.fn(),
  mockSetUser: vi.fn(),
}));

vi.mock("@sentry/react", () => ({
  init: mockInit,
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
  setUser: mockSetUser,
  browserTracingIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({})),
}));

import {
  ERROR_GROUPS,
  classifyError,
  initSentry,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
} from "./sentry";

describe("ERROR_GROUPS", () => {
  it("should contain all error group constants", () => {
    expect(ERROR_GROUPS.NETWORK).toBe("network-error");
    expect(ERROR_GROUPS.AUTH).toBe("auth-error");
    expect(ERROR_GROUPS.FIRESTORE).toBe("firestore-error");
    expect(ERROR_GROUPS.PAYROLL).toBe("payroll-error");
    expect(ERROR_GROUPS.PERMISSION).toBe("permission-error");
    expect(ERROR_GROUPS.VALIDATION).toBe("validation-error");
    expect(ERROR_GROUPS.UNKNOWN).toBe("unknown-error");
  });

  it("should have 7 error groups", () => {
    expect(Object.keys(ERROR_GROUPS)).toHaveLength(7);
  });
});

describe("classifyError", () => {
  it("should classify network errors", () => {
    expect(classifyError(new Error("network error"))).toBe(ERROR_GROUPS.NETWORK);
    expect(classifyError(new Error("fetch failed"))).toBe(ERROR_GROUPS.NETWORK);
    expect(classifyError(new Error("offline"))).toBe(ERROR_GROUPS.NETWORK);
    expect(classifyError(new Error("timeout"))).toBe(ERROR_GROUPS.NETWORK);
    expect(classifyError(new Error("abort"))).toBe(ERROR_GROUPS.NETWORK);
  });

  it("should classify auth errors", () => {
    expect(classifyError(new Error("auth/invalid-credential"))).toBe(ERROR_GROUPS.AUTH);
    expect(classifyError(new Error("unauthorized"))).toBe(ERROR_GROUPS.AUTH);
    expect(classifyError(new Error("unauthenticated"))).toBe(ERROR_GROUPS.AUTH);
    expect(classifyError(new Error("permission denied"))).toBe(ERROR_GROUPS.AUTH);
    expect(classifyError(new Error("token expired"))).toBe(ERROR_GROUPS.AUTH);
  });

  it("should classify firestore errors", () => {
    expect(classifyError(new Error("firestore error"), { source: "firestore" })).toBe(ERROR_GROUPS.FIRESTORE);
    expect(classifyError(new Error("firebase error"))).toBe(ERROR_GROUPS.FIRESTORE);
    expect(classifyError(new Error("document not found"))).toBe(ERROR_GROUPS.FIRESTORE);
    expect(classifyError(new Error("collection error"))).toBe(ERROR_GROUPS.FIRESTORE);
  });

  it("should classify payroll errors", () => {
    expect(classifyError(new Error("payroll computation"))).toBe(ERROR_GROUPS.PAYROLL);
    expect(classifyError(new Error("salary error"))).toBe(ERROR_GROUPS.PAYROLL);
    expect(classifyError(new Error("wage error"))).toBe(ERROR_GROUPS.PAYROLL);
    expect(classifyError(new Error("deduction error"))).toBe(ERROR_GROUPS.PAYROLL);
    expect(classifyError(new Error("error"), { source: "payroll" })).toBe(ERROR_GROUPS.PAYROLL);
  });

  it("should classify permission errors", () => {
    expect(classifyError(new Error("rbac error"))).toBe(ERROR_GROUPS.PERMISSION);
    expect(classifyError(new Error("access denied"))).toBe(ERROR_GROUPS.PERMISSION);
    expect(classifyError(new Error("forbidden"))).toBe(ERROR_GROUPS.PERMISSION);
  });

  it("should classify validation errors", () => {
    expect(classifyError(new Error("validation failed"))).toBe(ERROR_GROUPS.VALIDATION);
    expect(classifyError(new Error("invalid input"))).toBe(ERROR_GROUPS.VALIDATION);
    expect(classifyError(new Error("field required"))).toBe(ERROR_GROUPS.VALIDATION);
    expect(classifyError(new Error("malformed data"))).toBe(ERROR_GROUPS.VALIDATION);
    expect(classifyError(new TypeError("type mismatch"))).toBe(ERROR_GROUPS.VALIDATION);
    expect(classifyError(new ReferenceError("ref error"))).toBe(ERROR_GROUPS.VALIDATION);
  });

  it("should classify unknown errors as UNKNOWN", () => {
    expect(classifyError(new Error("something random"))).toBe(ERROR_GROUPS.UNKNOWN);
  });

  it("should handle errors with empty message", () => {
    expect(classifyError(new Error(""))).toBe(ERROR_GROUPS.UNKNOWN);
  });
});

describe("initSentry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not call Sentry.init when DSN is not set", () => {
    initSentry();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it("should call Sentry.init when DSN is set", () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://examplePublicKey@o0.ingest.sentry.io/0");
    vi.stubEnv("PROD", true);
    vi.stubEnv("DEV", false);

    // Re-import to pick up the new env values
    vi.resetModules();
    return import("./sentry").then(({ initSentry }) => {
      initSentry();
      expect(mockInit).toHaveBeenCalledTimes(1);
      const config = mockInit.mock.calls[0][0];
      expect(config.dsn).toBe("https://examplePublicKey@o0.ingest.sentry.io/0");
      expect(config.environment).toBe("test");
      expect(config.release).toBe("1.0.0");
      vi.stubEnv("VITE_SENTRY_DSN", "");
      vi.stubEnv("PROD", false);
      vi.stubEnv("DEV", true);
    });
  });
});

describe("captureException", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call Sentry.captureException with error", () => {
    const error = new Error("test error");
    captureException(error);

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(error, expect.objectContaining({
      extra: expect.objectContaining({ error_group: "unknown-error" }),
      tags: { error_group: "unknown-error" },
    }));
  });

  it("should classify error and include group in tags", () => {
    const error = new Error("network timeout");
    captureException(error);

    expect(mockCaptureException).toHaveBeenCalledWith(error, expect.objectContaining({
      tags: { error_group: "network-error" },
    }));
  });

  it("should merge context into extra", () => {
    const error = new Error("test");
    captureException(error, { userId: "123" });

    expect(mockCaptureException).toHaveBeenCalledWith(error, expect.objectContaining({
      extra: expect.objectContaining({ userId: "123", error_group: "unknown-error" }),
    }));
  });
});

describe("captureMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call Sentry.captureMessage with default level", () => {
    captureMessage("hello");
    expect(mockCaptureMessage).toHaveBeenCalledWith("hello", "info");
  });

  it("should call Sentry.captureMessage with specified level", () => {
    captureMessage("warning", "warning");
    expect(mockCaptureMessage).toHaveBeenCalledWith("warning", "warning");
  });
});

describe("setUserContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call Sentry.setUser with user data", () => {
    setUserContext({ id: "u1", email: "a@b.com", username: "admin" });
    expect(mockSetUser).toHaveBeenCalledWith({ id: "u1", email: "a@b.com", username: "admin" });
  });
});

describe("clearUserContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call Sentry.setUser with null", () => {
    clearUserContext();
    expect(mockSetUser).toHaveBeenCalledWith(null);
  });
});
