import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { usePermissions } from "./usePermissions";
import * as useAuthModule from "./useAuth";
import type { Department, Section } from "../types";

// ── Pure permission check function extracted from AuthContext ──────────────
//
// The original permission logic lives inside AuthContext.tsx's hasPermission.
// By extracting it into this pure function we can test every Department/Section
// combination without needing a full context render tree.
//
interface PermissionEntry {
  department: string;
  section: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function checkPermission(
  restrictions: PermissionEntry[],
  department: Department,
  section: Section,
  action: "view" | "add" | "edit" | "delete",
): boolean {
  const restriction = restrictions.find(
    (r) => r.department === department && r.section === section,
  );
  if (!restriction) return false;
  if (action === "view") return restriction.canView;
  if (action === "add") return restriction.canAdd;
  if (action === "edit") return restriction.canEdit;
  if (action === "delete") return restriction.canDelete;
  return false;
}

// ── Departments & Sections from types ─────────────────────────────────────
const ALL_DEPARTMENTS: Department[] = [
  "payroll",
  "employees",
  "lists",
  "reports",
  "system",
];

const ALL_SECTIONS: Section[] = [
  "payroll",
  "templates",
  "employees",
  "calendar",
  "groups",
  "positions",
  "areas",
  "names",
  "benefits",
  "earnings",
  "deductions",
  "13month",
  "companies",
  "terms",
  "users",
  "audit",
  "database",
];

// ── Tests for pure permission check function ──────────────────────────────
describe("checkPermission (pure function)", () => {
  const makeEntry = (
    department: string,
    section: string,
    perms?: Partial<PermissionEntry>,
  ): PermissionEntry => ({
    department,
    section,
    canView: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    ...perms,
  });

  it("returns false when no matching restriction exists", () => {
    expect(checkPermission([], "payroll", "payroll", "view")).toBe(false);
  });

  it("returns false when restriction exists but requested permission is false", () => {
    const restrictions = [makeEntry("payroll", "payroll", { canView: false })];
    expect(checkPermission(restrictions, "payroll", "payroll", "view")).toBe(
      false,
    );
  });

  it("returns true for view permission when canView is true", () => {
    const restrictions = [makeEntry("payroll", "payroll", { canView: true })];
    expect(checkPermission(restrictions, "payroll", "payroll", "view")).toBe(
      true,
    );
  });

  it("returns true for add permission when canAdd is true", () => {
    const restrictions = [
      makeEntry("employees", "employees", { canAdd: true }),
    ];
    expect(checkPermission(restrictions, "employees", "employees", "add")).toBe(
      true,
    );
  });

  it("returns true for edit permission when canEdit is true", () => {
    const restrictions = [makeEntry("reports", "audit", { canEdit: true })];
    expect(checkPermission(restrictions, "reports", "audit", "edit")).toBe(
      true,
    );
  });

  it("returns true for delete permission when canDelete is true", () => {
    const restrictions = [makeEntry("system", "users", { canDelete: true })];
    expect(checkPermission(restrictions, "system", "users", "delete")).toBe(
      true,
    );
  });

  it("distinguishes between different actions on the same restriction", () => {
    const restrictions = [
      makeEntry("payroll", "payroll", {
        canView: true,
        canAdd: false,
        canEdit: true,
        canDelete: false,
      }),
    ];
    expect(checkPermission(restrictions, "payroll", "payroll", "view")).toBe(
      true,
    );
    expect(checkPermission(restrictions, "payroll", "payroll", "add")).toBe(
      false,
    );
    expect(checkPermission(restrictions, "payroll", "payroll", "edit")).toBe(
      true,
    );
    expect(checkPermission(restrictions, "payroll", "payroll", "delete")).toBe(
      false,
    );
  });

  it("does not match on different departments with same section", () => {
    const restrictions = [makeEntry("payroll", "employees", { canView: true })];
    expect(
      checkPermission(restrictions, "employees", "employees", "view"),
    ).toBe(false);
  });

  it("does not match on same department with different section", () => {
    const restrictions = [makeEntry("payroll", "payroll", { canView: true })];
    expect(checkPermission(restrictions, "payroll", "templates", "view")).toBe(
      false,
    );
  });

  it("handles multiple restrictions and finds the right one", () => {
    const restrictions: PermissionEntry[] = [
      makeEntry("payroll", "payroll", { canView: true, canEdit: true }),
      makeEntry("employees", "employees", { canView: true, canDelete: true }),
      makeEntry("system", "users", { canView: false }),
      makeEntry("reports", "audit", { canView: true, canAdd: true }),
    ];

    expect(
      checkPermission(restrictions, "employees", "employees", "delete"),
    ).toBe(true);
    expect(
      checkPermission(restrictions, "employees", "employees", "edit"),
    ).toBe(false);
    expect(checkPermission(restrictions, "system", "users", "view")).toBe(
      false,
    );
    expect(checkPermission(restrictions, "reports", "audit", "add")).toBe(true);
    expect(checkPermission(restrictions, "payroll", "templates", "view")).toBe(
      false,
    );
  });
});

// ── Tests for usePermissions hook ─────────────────────────────────────────
describe("usePermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupHook(
    hasPermissionImpl?: (
      department: Department,
      section: Section,
      action: "view" | "add" | "edit" | "delete",
    ) => boolean,
  ) {
    const mockHasPermission = hasPermissionImpl ?? vi.fn(() => true);
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      hasPermission: mockHasPermission,
    } as any);

    return renderHook(() => usePermissions());
  }

  it("should return can, canView, canAdd, canEdit, canDelete functions", () => {
    const { result } = setupHook();
    expect(typeof result.current.can).toBe("function");
    expect(typeof result.current.canView).toBe("function");
    expect(typeof result.current.canAdd).toBe("function");
    expect(typeof result.current.canEdit).toBe("function");
    expect(typeof result.current.canDelete).toBe("function");
  });

  it("should delegate canView to hasPermission with 'view' action", () => {
    const hasPermission = vi.fn(() => true);
    const { result } = setupHook(hasPermission);

    const canView = result.current.canView("payroll", "payroll");
    expect(hasPermission).toHaveBeenCalledWith("payroll", "payroll", "view");
    expect(canView).toBe(true);
  });

  it("should delegate canAdd to hasPermission with 'add' action", () => {
    const hasPermission = vi.fn(() => false);
    const { result } = setupHook(hasPermission);

    const canAdd = result.current.canAdd("employees", "employees");
    expect(hasPermission).toHaveBeenCalledWith("employees", "employees", "add");
    expect(canAdd).toBe(false);
  });

  it("should delegate canEdit to hasPermission with 'edit' action", () => {
    const hasPermission = vi.fn(() => true);
    const { result } = setupHook(hasPermission);

    const canEdit = result.current.canEdit("reports", "audit");
    expect(hasPermission).toHaveBeenCalledWith("reports", "audit", "edit");
    expect(canEdit).toBe(true);
  });

  it("should delegate canDelete to hasPermission with 'delete' action", () => {
    const hasPermission = vi.fn(() => true);
    const { result } = setupHook(hasPermission);

    const canDelete = result.current.canDelete("system", "users");
    expect(hasPermission).toHaveBeenCalledWith("system", "users", "delete");
    expect(canDelete).toBe(true);
  });

  it("should delegate can() with a custom action", () => {
    const hasPermission = vi.fn(() => true);
    const { result } = setupHook(hasPermission);

    const can = result.current.can("lists", "names", "view");
    expect(hasPermission).toHaveBeenCalledWith("lists", "names", "view");
    expect(can).toBe(true);
  });

  it("should default can() action to 'view'", () => {
    const hasPermission = vi.fn(() => true);
    const { result } = setupHook(hasPermission);

    result.current.can("payroll", "payroll");
    expect(hasPermission).toHaveBeenCalledWith("payroll", "payroll", "view");
  });

  it("should throw if useAuth throws (outside provider)", () => {
    vi.spyOn(useAuthModule, "useAuth").mockImplementation(() => {
      throw new Error("useAuth must be used within AuthProvider");
    });

    expect(() => {
      renderHook(() => usePermissions());
    }).toThrow("useAuth must be used within AuthProvider");
  });
});
