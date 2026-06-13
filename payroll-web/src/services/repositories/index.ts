/**
 * Domain‑organized repository layer.
 *
 * Sits on top of `@/services/firestore` to provide type‑safe, named accessors
 * for the most common query patterns used throughout the app.
 *
 * Every function delegates to the generic `firestore.ts` service functions
 * (`getAll`, `getById`, `create`, `update`, `remove`) rather than importing
 * Firebase SDK primitives directly.
 */
import {
  getAll,
  getById,
  create,
  update,
} from "@/services/firestore";
import type {
  Employee,
  EmployeeGroup,
  EmployeePosition,
  EmployeeArea,
  EmployeeStatus,
  EmployeeContact,
  EmployeeProfile,
} from "@/types/employee";
import type { Company, CompanyOptions } from "@/types/company";
import type {
  UserAccount,
  UserSettings,
  UserCompany,
} from "@/types/user";
import type {
  Payroll,
  PayrollGroup,
  PayrollEmployee,
  PayrollTemplate,
  PayrollInclusiveDate,
} from "@/types/payroll";

// ──────────────────────────────────────────────
//  Employee repository
// ──────────────────────────────────────────────

export const employeeRepository = {
  /**
   * Fetch all employees that belong to a given company.
   * The most common query pattern in the app.
   */
  getByCompany(companyId: string) {
    return getAll<Employee>("employees", [
      { field: "companyId", op: "==", value: companyId },
    ]);
  },

  /** Fetch a single employee by document ID. */
  getById(id: string) {
    return getById<Employee>("employees", id);
  },

  /**
   * Create a new employee document.
   * @returns The newly created document ID.
   */
  create(data: Omit<Employee, "id" | "createdAt" | "updatedAt">) {
    return create<Employee>("employees", data);
  },

  /**
   * Partially update an existing employee.
   */
  update(id: string, data: Partial<Omit<Employee, "id" | "createdAt">>) {
    return update<Employee>("employees", id, data);
  },

  /**
   * Soft‑delete an employee by setting `isActive = false`.
   * Prefer this over hard removal for data integrity.
   */
  async softDelete(id: string): Promise<void> {
    await update<Employee>("employees", id, {
      isActive: false,
    } as unknown as Partial<Omit<Employee, "id" | "createdAt">>);
  },

  /**
   * Bulk‑update a set of employees sharing the same company.
   *
   * **Note:** Firestore does not support a single `update where` query.
   * This utility performs individual updates in parallel. For large
   * batches consider using a Firestore `WriteBatch` instead.
   */
  async bulkUpdate(
    ids: string[],
    changes: Partial<Omit<Employee, "id" | "createdAt">>,
  ): Promise<void> {
    await Promise.all(
      ids.map((id) => update<Employee>("employees", id, changes)),
    );
  },

  // ── Child / related collections ─────────────

  getGroups() {
    return getAll<EmployeeGroup>("employee_groups");
  },

  getPositions() {
    return getAll<EmployeePosition>("employee_positions");
  },

  getAreas() {
    return getAll<EmployeeArea>("employee_areas");
  },

  getStatuses() {
    return getAll<EmployeeStatus>("employee_statuses");
  },

  getContacts(employeeId: string) {
    return getAll<EmployeeContact>("employee_contacts", [
      { field: "employeeId", op: "==", value: employeeId },
    ]);
  },

  getProfile(employeeId: string) {
    return getAll<EmployeeProfile>("employee_profiles", [
      { field: "employeeId", op: "==", value: employeeId },
    ]);
  },
};

// ──────────────────────────────────────────────
//  Company repository
// ──────────────────────────────────────────────

export const companyRepository = {
  /** Fetch a single company by document ID. */
  getById(id: string) {
    return getById<Company>("companies", id);
  },

  /** Fetch all active companies. */
  getAll() {
    return getAll<Company>("companies", [
      { field: "isActive", op: "==", value: true },
    ]);
  },

  /** Fetch company options / configuration. */
  getOptions(companyId: string) {
    return getAll<CompanyOptions>("company_options", [
      { field: "companyId", op: "==", value: companyId },
    ]);
  },
};

// ──────────────────────────────────────────────
//  User repository
// ──────────────────────────────────────────────

export const userRepository = {
  /** Fetch a single user account by document ID. */
  getByUserId(id: string) {
    return getById<UserAccount>("user_accounts", id);
  },

  /** Fetch the settings document for a given user. */
  getSettings(userId: string) {
    return getAll<UserSettings>("user_settings", [
      { field: "userId", op: "==", value: userId },
    ]);
  },

  /** Fetch company associations for a user. */
  getCompanies(userId: string) {
    return getAll<UserCompany>("user_companies", [
      { field: "userId", op: "==", value: userId },
    ]);
  },
};

// ──────────────────────────────────────────────
//  Payroll repository
// ──────────────────────────────────────────────

export const payrollRepository = {
  /** Fetch all payrolls for a given company, newest first. */
  getByCompany(companyId: string) {
    return getAll<Payroll>("payroll", [
      { field: "companyId", op: "==", value: companyId },
    ]);
  },

  /** Fetch a single payroll by document ID. */
  getById(id: string) {
    return getById<Payroll>("payroll", id);
  },

  // ── Child / related collections ─────────────

  getEmployees(payrollId: string) {
    return getAll<PayrollEmployee>("payroll_employees", [
      { field: "payrollId", op: "==", value: payrollId },
    ]);
  },

  getGroups(payrollId: string) {
    return getAll<PayrollGroup>("payroll_groups", [
      { field: "payrollId", op: "==", value: payrollId },
    ]);
  },

  getInclusiveDates(payrollId: string) {
    return getAll<PayrollInclusiveDate>("payroll_inclusive_dates", [
      { field: "payrollId", op: "==", value: payrollId },
    ]);
  },

  getTemplates(companyId: string) {
    return getAll<PayrollTemplate>("payroll_templates", [
      { field: "companyId", op: "==", value: companyId },
    ]);
  },
};
