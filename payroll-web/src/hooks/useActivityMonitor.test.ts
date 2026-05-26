import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActivityMonitor } from "./useActivityMonitor";
import type { UserActivity } from "./useActivityMonitor";

describe("useActivityMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("should initialize with empty activities", () => {
    const { result } = renderHook(() => useActivityMonitor());

    expect(result.current.activities).toEqual([]);
    expect(result.current.activityCount).toBe(0);
    expect(result.current.lastActivity).toBeNull();
  });

  it("should log a new activity", () => {
    const { result } = renderHook(() => useActivityMonitor());

    act(() => {
      result.current.logActivity({
        action: "create",
        entityType: "employee",
        entityId: "emp-1",
      });
    });

    expect(result.current.activityCount).toBe(1);
    expect(result.current.activities).toHaveLength(1);
    expect(result.current.lastActivity).not.toBeNull();
    expect(result.current.lastActivity?.action).toBe("create");
    expect(result.current.lastActivity?.entityType).toBe("employee");
    expect(result.current.lastActivity?.entityId).toBe("emp-1");
  });

  it("should assign a unique id and timestamp to each activity", () => {
    const { result } = renderHook(() => useActivityMonitor());

    act(() => {
      result.current.logActivity({
        action: "edit",
        entityType: "payroll",
      });
    });

    const activity = result.current.activities[0];
    expect(activity.id).toMatch(/^activity-/);
    expect(activity.timestamp).toBeInstanceOf(Date);
  });

  it("should log multiple activities in order", () => {
    const { result } = renderHook(() => useActivityMonitor());

    act(() => {
      result.current.logActivity({
        action: "create",
        entityType: "employee",
        entityId: "emp-1",
      });
    });

    act(() => {
      result.current.logActivity({
        action: "update",
        entityType: "employee",
        entityId: "emp-1",
      });
    });

    act(() => {
      result.current.logActivity({
        action: "delete",
        entityType: "employee",
        entityId: "emp-1",
        details: { reason: "test" },
      });
    });

    expect(result.current.activityCount).toBe(3);
    expect(result.current.activities[0].action).toBe("create");
    expect(result.current.activities[1].action).toBe("update");
    expect(result.current.activities[2].action).toBe("delete");
    expect(result.current.lastActivity?.action).toBe("delete");
  });

  it("should log activity with details", () => {
    const { result } = renderHook(() => useActivityMonitor());

    act(() => {
      result.current.logActivity({
        action: "update",
        entityType: "settings",
        details: { field: "theme", oldValue: "light", newValue: "dark" },
      });
    });

    expect(result.current.activities[0].details).toEqual({
      field: "theme",
      oldValue: "light",
      newValue: "dark",
    });
  });

  it("should enforce maxActivities limit", () => {
    const maxActivities = 3;
    const { result } = renderHook(() => useActivityMonitor(maxActivities));

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.logActivity({
          action: `action-${i}`,
          entityType: "test",
        });
      }
    });

    expect(result.current.activities).toHaveLength(maxActivities);
    expect(result.current.activityCount).toBe(maxActivities);
    // Should keep the last 3 activities
    expect(result.current.activities[0].action).toBe("action-2");
    expect(result.current.activities[1].action).toBe("action-3");
    expect(result.current.activities[2].action).toBe("action-4");
  });

  it("should get recent activities with default limit", () => {
    const { result } = renderHook(() => useActivityMonitor());

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.logActivity({
          action: `action-${i}`,
          entityType: "test",
        });
      }
    });

    const recent = result.current.getRecentActivities();
    expect(recent).toHaveLength(5);
    // Most recent first (reversed)
    expect(recent[0].action).toBe("action-4");
    expect(recent[4].action).toBe("action-0");
  });

  it("should get recent activities with custom limit", () => {
    const { result } = renderHook(() => useActivityMonitor());

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.logActivity({
          action: `action-${i}`,
          entityType: "test",
        });
      }
    });

    const recent = result.current.getRecentActivities(3);
    expect(recent).toHaveLength(3);
    expect(recent[0].action).toBe("action-9");
    expect(recent[2].action).toBe("action-7");
  });

  it("should filter activities by entity type", () => {
    const { result } = renderHook(() => useActivityMonitor());

    act(() => {
      result.current.logActivity({ action: "create", entityType: "employee" });
      result.current.logActivity({ action: "update", entityType: "payroll" });
      result.current.logActivity({ action: "delete", entityType: "employee" });
      result.current.logActivity({ action: "create", entityType: "company" });
    });

    const employeeActivities = result.current.getActivitiesByType("employee");
    expect(employeeActivities).toHaveLength(2);
    expect(employeeActivities[0].action).toBe("create");
    expect(employeeActivities[1].action).toBe("delete");

    const payrollActivities = result.current.getActivitiesByType("payroll");
    expect(payrollActivities).toHaveLength(1);
    expect(payrollActivities[0].action).toBe("update");
  });

  it("should filter activities by action", () => {
    const { result } = renderHook(() => useActivityMonitor());

    act(() => {
      result.current.logActivity({ action: "create", entityType: "employee" });
      result.current.logActivity({ action: "create", entityType: "payroll" });
      result.current.logActivity({ action: "update", entityType: "employee" });
    });

    const createActivities = result.current.getActivitiesByAction("create");
    expect(createActivities).toHaveLength(2);
    expect(createActivities[0].entityType).toBe("employee");
    expect(createActivities[1].entityType).toBe("payroll");

    const updateActivities = result.current.getActivitiesByAction("update");
    expect(updateActivities).toHaveLength(1);
  });

  it("should clear all activities", () => {
    const { result } = renderHook(() => useActivityMonitor());

    act(() => {
      result.current.logActivity({ action: "create", entityType: "employee" });
      result.current.logActivity({ action: "update", entityType: "payroll" });
    });

    expect(result.current.activityCount).toBe(2);

    act(() => {
      result.current.clearActivities();
    });

    expect(result.current.activities).toEqual([]);
    expect(result.current.activityCount).toBe(0);
    expect(result.current.lastActivity).toBeNull();
  });

  it("should return empty arrays for filter functions when no activities exist", () => {
    const { result } = renderHook(() => useActivityMonitor());

    expect(result.current.getRecentActivities()).toEqual([]);
    expect(result.current.getActivitiesByType("employee")).toEqual([]);
    expect(result.current.getActivitiesByAction("create")).toEqual([]);
  });

  it("should handle default maxActivities of 100", () => {
    const { result } = renderHook(() => useActivityMonitor());

    act(() => {
      for (let i = 0; i < 150; i++) {
        result.current.logActivity({
          action: `action-${i}`,
          entityType: "bulk",
        });
      }
    });

    expect(result.current.activities).toHaveLength(100);
    expect(result.current.activities[0].action).toBe("action-50");
    expect(result.current.activities[99].action).toBe("action-149");
  });

  it("should provide identity stability for callbacks", () => {
    const { result, rerender } = renderHook(() => useActivityMonitor());

    const logActivity1 = result.current.logActivity;
    const clearActivities1 = result.current.clearActivities;
    const getRecent1 = result.current.getRecentActivities;
    const getByType1 = result.current.getActivitiesByType;
    const getByAction1 = result.current.getActivitiesByAction;

    // Rerender should keep same function references (stable useCallback)
    rerender();

    expect(result.current.logActivity).toBe(logActivity1);
    expect(result.current.clearActivities).toBe(clearActivities1);
  });
});
