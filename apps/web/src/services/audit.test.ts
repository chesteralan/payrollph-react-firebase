import { describe, it, expect, beforeEach, vi } from "vitest";
import { addMockDocs, clearMockDocs } from "../__mocks__/firebase";
import { addDoc, getDocs, where, query } from "firebase/firestore";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

import {
  logAudit,
  fetchAuditLogs,
  getAuditStats,
  auditCreate,
  auditUpdate,
  auditDelete,
  auditLogin,
  auditLogout,
  auditSessionTimeout,
  auditPermissionDenied,
  auditBulkOperation,
} from "./audit";
import type { UserAccount } from "../types";

const mockUser: UserAccount = {
  id: "user-1",
  email: "admin@example.com",
  username: "admin",
  displayName: "Admin User",
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("logAudit", () => {
  it("should call addDoc with the correct collection and data", async () => {
    await logAudit({
      userId: "user-1",
      userName: "Admin User",
      action: "create",
      module: "employees",
      description: "Created employee (emp-1)",
      entityId: "emp-1",
      entityType: "employee",
    });

    expect(addDoc).toHaveBeenCalledTimes(1);
    const [collectionPath, data] = (addDoc as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(collectionPath).toBe("system_audit");
    expect(data).toMatchObject({
      userId: "user-1",
      action: "create",
      module: "employees",
      description: "Created employee (emp-1)",
    });
  });

  it("should include metadata with userAgent and timestamp_ms", async () => {
    await logAudit({
      userId: "user-1",
      userName: "Admin",
      action: "login",
      module: "auth",
      description: "User logged in",
    });

    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.metadata).toBeDefined();
    expect(data.metadata).toHaveProperty("userAgent");
    expect(data.metadata).toHaveProperty("timestamp_ms");
    expect(typeof data.metadata.timestamp_ms).toBe("number");
  });

  it("should merge user-provided metadata", async () => {
    await logAudit({
      userId: "user-1",
      userName: "Admin",
      action: "update",
      module: "employees",
      description: "Updated employee",
      metadata: { companyId: "comp-1", customField: "test" },
    });

    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.metadata.companyId).toBe("comp-1");
    expect(data.metadata.customField).toBe("test");
  });

  it("should handle errors gracefully without throwing", async () => {
    vi.mocked(addDoc).mockRejectedValueOnce(new Error("Firestore unavailable"));

    await expect(
      logAudit({
        userId: "user-1",
        userName: "Admin",
        action: "create",
        module: "test",
        description: "Test",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("fetchAuditLogs", () => {
  const baseLog = (overrides: Record<string, unknown> = {}) => ({
    id: "log-1",
    userId: "user-1",
    userName: "Admin",
    action: "create",
    module: "employees",
    description: "Created employee",
    entityId: "emp-1",
    entityType: "employee",
    timestamp: new Date("2024-06-01"),
    ...overrides,
  });

  it("should return all audit logs when no filters are provided", async () => {
    addMockDocs("system_audit", [
      baseLog({ id: "log-1" }),
      baseLog({ id: "log-2", action: "update" }),
    ]);

    const logs = await fetchAuditLogs();

    expect(logs).toHaveLength(2);
  });

  it("should return empty array when no logs exist", async () => {
    const logs = await fetchAuditLogs();
    expect(logs).toEqual([]);
  });

  it("should filter by module", async () => {
    addMockDocs("system_audit", [
      baseLog({ id: "log-1", module: "employees" }),
      baseLog({ id: "log-2", module: "auth" }),
      baseLog({ id: "log-3", module: "payroll" }),
    ]);

    const logs = await fetchAuditLogs({ module: "auth" });

    expect(logs).toHaveLength(1);
    expect(logs[0].module).toBe("auth");
  });

  it("should filter by userId", async () => {
    addMockDocs("system_audit", [
      baseLog({ id: "log-1", userId: "user-1" }),
      baseLog({ id: "log-2", userId: "user-2" }),
    ]);

    const logs = await fetchAuditLogs({ userId: "user-2" });

    expect(logs).toHaveLength(1);
    expect(logs[0].userId).toBe("user-2");
  });

  it("should filter by action", async () => {
    addMockDocs("system_audit", [
      baseLog({ id: "log-1", action: "create" }),
      baseLog({ id: "log-2", action: "update" }),
      baseLog({ id: "log-3", action: "delete" }),
    ]);

    const logs = await fetchAuditLogs({ action: "delete" });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe("delete");
  });

  it("should filter by entityId", async () => {
    addMockDocs("system_audit", [
      baseLog({ id: "log-1", entityId: "emp-1" }),
      baseLog({ id: "log-2", entityId: "emp-2" }),
    ]);

    const logs = await fetchAuditLogs({ entityId: "emp-1" });

    expect(logs).toHaveLength(1);
    expect(logs[0].entityId).toBe("emp-1");
  });

  it("should filter by date range", async () => {
    addMockDocs("system_audit", [
      baseLog({ id: "log-1", timestamp: new Date("2024-06-01") }),
      baseLog({ id: "log-2", timestamp: new Date("2024-07-01") }),
      baseLog({ id: "log-3", timestamp: new Date("2024-08-01") }),
    ]);

    const logs = await fetchAuditLogs({
      startDate: new Date("2024-06-15"),
      endDate: new Date("2024-07-15"),
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe("log-2");
  });

  it("should apply limit option to the Firestore query", async () => {
    addMockDocs("system_audit", [
      baseLog({ id: "log-1" }),
      baseLog({ id: "log-2" }),
    ]);

    await fetchAuditLogs({ limit: 5 });

    // Verify query was called with the limit — the mock's limit() returns the value
    const { limit: limitFn } = await import("firebase/firestore");
    expect(limitFn).toHaveBeenCalledWith(5);
  });
});

describe("getAuditStats", () => {
  it("should return aggregated counts by action type", async () => {
    addMockDocs("system_audit", [
      {
        id: "1",
        userId: "user-1",
        userName: "A",
        action: "create",
        module: "employees",
        description: "c",
        timestamp: new Date(),
      },
      {
        id: "2",
        userId: "user-1",
        userName: "A",
        action: "create",
        module: "employees",
        description: "c",
        timestamp: new Date(),
      },
      {
        id: "3",
        userId: "user-1",
        userName: "A",
        action: "update",
        module: "employees",
        description: "u",
        timestamp: new Date(),
      },
      {
        id: "4",
        userId: "user-1",
        userName: "A",
        action: "delete",
        module: "employees",
        description: "d",
        timestamp: new Date(),
      },
    ]);

    const stats = await getAuditStats();

    expect(stats.create).toBe(2);
    expect(stats.update).toBe(1);
    expect(stats.delete).toBe(1);
  });

  it("should return zero counts when no logs exist", async () => {
    const stats = await getAuditStats();
    // When no logs exist, the stats object is empty (undefined for each action)
    expect(Object.keys(stats).length).toBe(0);
  });

  it("should filter by module when provided", async () => {
    addMockDocs("system_audit", [
      {
        id: "1",
        userId: "user-1",
        userName: "A",
        action: "create",
        module: "employees",
        description: "c",
        timestamp: new Date(),
      },
      {
        id: "2",
        userId: "user-1",
        userName: "A",
        action: "create",
        module: "auth",
        description: "c",
        timestamp: new Date(),
      },
    ]);

    const stats = await getAuditStats("auth");

    expect(stats.create).toBe(1);
  });
});

describe("auditCreate", () => {
  it("should call logAudit with create action", async () => {
    await auditCreate(mockUser, "employees", "emp-1", "employee");

    expect(addDoc).toHaveBeenCalledWith(
      "system_audit",
      expect.objectContaining({
        userId: "user-1",
        action: "create",
        module: "employees",
        entityId: "emp-1",
        entityType: "employee",
      }),
    );
  });

  it("should handle null user", async () => {
    await auditCreate(null, "system", "res-1", "resource");

    expect(addDoc).toHaveBeenCalledWith(
      "system_audit",
      expect.objectContaining({
        userId: "unknown",
        action: "create",
      }),
    );
  });

  it("should use custom description when provided", async () => {
    await auditCreate(
      mockUser,
      "employees",
      "emp-1",
      "employee",
      "Custom desc",
      { source: "import" },
    );

    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.description).toBe("Custom desc");
    expect(data.metadata.source).toBe("import");
  });
});

describe("auditUpdate", () => {
  it("should call logAudit with update action and previous/new values", async () => {
    await auditUpdate(
      mockUser,
      "employees",
      "emp-1",
      "employee",
      { name: "Old" },
      { name: "New" },
    );

    expect(addDoc).toHaveBeenCalledWith(
      "system_audit",
      expect.objectContaining({
        userId: "user-1",
        action: "update",
        entityId: "emp-1",
      }),
    );

    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.metadata.previousValue).toEqual({ name: "Old" });
    expect(data.metadata.newValue).toEqual({ name: "New" });
  });

  it("should handle null user gracefully", async () => {
    await auditUpdate(null, "test", "t1", "test", null, null);
    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.userId).toBe("unknown");
  });
});

describe("auditDelete", () => {
  it("should call logAudit with delete action", async () => {
    await auditDelete(mockUser, "employees", "emp-1", "employee");

    expect(addDoc).toHaveBeenCalledWith(
      "system_audit",
      expect.objectContaining({
        userId: "user-1",
        action: "delete",
        description: expect.stringContaining("Deleted"),
      }),
    );
  });
});

describe("auditLogin", () => {
  it("should call logAudit with login action and default method", async () => {
    await auditLogin(mockUser);

    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.action).toBe("login");
    expect(data.module).toBe("auth");
    expect(data.metadata.method).toBe("email/password");
  });

  it("should use custom login method when provided", async () => {
    await auditLogin(mockUser, "google");

    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.metadata.method).toBe("google");
  });
});

describe("auditLogout", () => {
  it("should call logAudit with logout action", async () => {
    await auditLogout(mockUser);

    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.action).toBe("logout");
    expect(data.module).toBe("auth");
    expect(data.description).toBe("User logged out");
  });
});

describe("auditSessionTimeout", () => {
  it("should call logAudit with session_timeout action", async () => {
    await auditSessionTimeout(mockUser);

    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.action).toBe("session_timeout");
    expect(data.module).toBe("auth");
    expect(data.description).toContain("Session timed out");
  });
});

describe("auditPermissionDenied", () => {
  it("should call logAudit with permission_denied action", async () => {
    await auditPermissionDenied(mockUser, "employees", "delete");

    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.action).toBe("permission_denied");
    expect(data.module).toBe("employees");
    expect(data.metadata.attemptedAction).toBe("delete");
    expect(data.description).toContain("delete");
    expect(data.description).toContain("employees");
  });
});

describe("auditBulkOperation", () => {
  it("should call logAudit with bulk_update action", async () => {
    await auditBulkOperation(
      mockUser,
      "employees",
      "bulk_update",
      5,
      "employee",
    );

    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.action).toBe("bulk_update");
    expect(data.metadata.count).toBe(5);
    expect(data.metadata.entityType).toBe("employee");
    expect(data.description).toContain("Updated");
    expect(data.description).toContain("5");
  });

  it("should call logAudit with bulk_delete action", async () => {
    await auditBulkOperation(
      mockUser,
      "employees",
      "bulk_delete",
      3,
      "timesheet",
    );

    const [, data] = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.action).toBe("bulk_delete");
    expect(data.metadata.count).toBe(3);
    expect(data.description).toContain("Deleted");
    expect(data.description).toContain("3");
  });
});
