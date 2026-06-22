import { useCallback } from "react";
import { useAuth } from "./useAuth";
import type { Department, Section } from "../types";

/**
 * Hook providing role-based permission helpers for the current user.
 * Wraps the `hasPermission` function from AuthContext with shorthand methods.
 * All returned functions are memoized with useCallback to prevent unnecessary re-renders.
 *
 * @returns An object containing:
 *  - `can(department, section, action)` — Check arbitrary permission
 *  - `canView(department, section)` — Shorthand for "view" action
 *  - `canAdd(department, section)` — Shorthand for "add" action
 *  - `canEdit(department, section)` — Shorthand for "edit" action
 *  - `canDelete(department, section)` — Shorthand for "delete" action
 *
 * @example
 * ```tsx
 * const { canView, canEdit } = usePermissions();
 * if (canView('payroll', 'reports')) return <ReportViewer />;
 * if (canEdit('employees', 'profile')) return <EditButton />;
 * ```
 */
export function usePermissions() {
  const { hasPermission } = useAuth();

  const can = useCallback(
    (
      department: Department,
      section: Section,
      action: "view" | "add" | "edit" | "delete" = "view",
    ) => {
      return hasPermission(department, section, action);
    },
    [hasPermission],
  );

  const canView = useCallback(
    (department: Department, section: Section) => can(department, section, "view"),
    [can],
  );
  const canAdd = useCallback(
    (department: Department, section: Section) => can(department, section, "add"),
    [can],
  );
  const canEdit = useCallback(
    (department: Department, section: Section) => can(department, section, "edit"),
    [can],
  );
  const canDelete = useCallback(
    (department: Department, section: Section) => can(department, section, "delete"),
    [can],
  );

  return { can, canView, canAdd, canEdit, canDelete };
}
