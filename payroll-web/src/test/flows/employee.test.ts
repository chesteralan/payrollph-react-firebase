import { describe, it, expect, beforeEach, vi } from "vitest";
import { addMockDocs, clearMockDocs } from "../../__mocks__/firebase";
import {
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  query,
  collection,
} from "firebase/firestore";
import {
  getById,
  getAll,
  create,
  update,
  remove,
} from "../../services/firestore";
import { auditCreate, auditUpdate, auditDelete } from "../../services/audit";
import { fetchPayrollEmployees } from "../../services/payroll";
import type { Employee, EmployeeProfile, EmployeeContact } from "../../types";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

const mockUser = {
  id: "user-1",
  displayName: "Admin User",
  email: "admin@example.com",
};

describe("Employee Flow — Create → Update → List → View Profile", () => {
  // ── Create ────────────────────────────────────────────────────────────
  describe("Create employee", () => {
    it("should create an employee document in firestore", async () => {
      const empId = await create("employees", {
        nameId: "name-1",
        companyId: "company-1",
        employeeCode: "EMP001",
        statusId: "status-active",
        isActive: true,
      });

      expect(empId).toBe("mock-id");
      expect(addDoc).toHaveBeenCalledWith(
        "employees",
        expect.objectContaining({
          nameId: "name-1",
          employeeCode: "EMP001",
          isActive: true,
        }),
      );
    });

    it("should include timestamps on creation", async () => {
      await create("employees", {
        nameId: "name-2",
        companyId: "company-1",
        employeeCode: "EMP002",
        statusId: "status-active",
        isActive: true,
      });

      expect(addDoc).toHaveBeenCalledWith(
        "employees",
        expect.objectContaining({
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
    });

    it("should create employee profile with government numbers", async () => {
      await create<Record<string, unknown>>("employee_profiles", {
        employeeId: "emp-1",
        sss: "12-345-6789-0",
        tin: "123-456-789-000",
        philhealth: "12-3456789123-4",
        hdmf: "1234-5678-9012",
      });

      expect(addDoc).toHaveBeenCalledWith(
        "employee_profiles",
        expect.objectContaining({
          employeeId: "emp-1",
          sss: "12-345-6789-0",
          tin: "123-456-789-000",
        }),
      );
    });

    it("should log audit on employee creation", async () => {
      await auditCreate(
        mockUser as never,
        "employees",
        "EMP001",
        "Employee",
        "Created employee EMP001",
        { companyId: "company-1" },
      );

      expect(addDoc).toHaveBeenCalledWith(
        "system_audit",
        expect.objectContaining({
          userId: "user-1",
          action: "create",
          module: "employees",
          entityId: "EMP001",
        }),
      );
    });
  });

  // ── Update ────────────────────────────────────────────────────────────
  describe("Update employee", () => {
    it("should update employee status", async () => {
      addMockDocs("employees/emp-1", [
        {
          id: "emp-1",
          nameId: "name-1",
          statusId: "status-active",
          isActive: true,
        },
      ]);

      await update("employees", "emp-1", {
        statusId: "status-inactive",
      });

      expect(updateDoc).toHaveBeenCalledWith(
        "employees/emp-1",
        expect.objectContaining({
          statusId: "status-inactive",
          updatedAt: expect.any(Date),
        }),
      );
    });

    it("should update employee personal info", async () => {
      addMockDocs("names/name-1", [
        { id: "name-1", firstName: "John", lastName: "Doe" },
      ]);

      await update("names", "name-1", {
        firstName: "Jonathan",
        lastName: "Doe",
      });

      expect(updateDoc).toHaveBeenCalledWith(
        "names/name-1",
        expect.objectContaining({
          firstName: "Jonathan",
          lastName: "Doe",
        }),
      );
    });

    it("should log audit on employee update", async () => {
      const previousValue = { statusId: "status-active", isActive: true };
      const newValue = { statusId: "status-inactive", isActive: false };

      await auditUpdate(
        mockUser as never,
        "employees",
        "emp-1",
        "Employee",
        previousValue,
        newValue,
        "Deactivated employee",
      );

      expect(addDoc).toHaveBeenCalledWith(
        "system_audit",
        expect.objectContaining({
          action: "update",
          entityId: "emp-1",
        }),
      );
    });

    it("should handle update of non-existent employee without error", async () => {
      // No mock data means the doc doesn't exist — update should still resolve
      // since the mock doesn't check existence
      await expect(
        update("employees", "nonexistent-id", { employeeCode: "NEW" }),
      ).resolves.toBeUndefined();
    });
  });

  // ── List ──────────────────────────────────────────────────────────────
  describe("List employees", () => {
    it("should return all employees when no filters applied", async () => {
      addMockDocs("employees", [
        {
          id: "emp-1",
          nameId: "name-1",
          employeeCode: "EMP001",
          isActive: true,
        },
        {
          id: "emp-2",
          nameId: "name-2",
          employeeCode: "EMP002",
          isActive: true,
        },
        {
          id: "emp-3",
          nameId: "name-3",
          employeeCode: "EMP003",
          isActive: false,
        },
      ]);

      const results = await getAll("employees");

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty("employeeCode");
    });

    it("should filter employees by active status", async () => {
      addMockDocs("employees", [
        {
          id: "emp-1",
          nameId: "name-1",
          employeeCode: "EMP001",
          isActive: true,
        },
        {
          id: "emp-2",
          nameId: "name-2",
          employeeCode: "EMP002",
          isActive: false,
        },
      ]);

      await getAll("employees", [{ field: "isActive", op: "==", value: true }]);

      expect(where).toHaveBeenCalledWith("isActive", "==", true);
    });

    it("should filter employees by company", async () => {
      addMockDocs("employees", [
        { id: "emp-1", companyId: "company-1", employeeCode: "EMP001" },
        { id: "emp-2", companyId: "company-2", employeeCode: "EMP002" },
      ]);

      await getAll("employees", [
        { field: "companyId", op: "==", value: "company-1" },
      ]);

      expect(where).toHaveBeenCalledWith("companyId", "==", "company-1");
    });

    it("should combine filters with ordering", async () => {
      addMockDocs("employees", [
        { id: "emp-1", employeeCode: "EMP001", isActive: true },
        { id: "emp-2", employeeCode: "EMP002", isActive: true },
      ]);

      await getAll(
        "employees",
        [{ field: "isActive", op: "==", value: true }],
        { field: "employeeCode", direction: "asc" },
      );

      expect(where).toHaveBeenCalledWith("isActive", "==", true);
      expect(query).toHaveBeenCalled();
    });

    it("should return empty array when no employees exist", async () => {
      const results = await getAll("employees");
      expect(results).toEqual([]);
    });
  });

  // ── View Profile ──────────────────────────────────────────────────────
  describe("View employee profile", () => {
    it("should retrieve employee by id", async () => {
      addMockDocs("employees/emp-1", [
        {
          id: "emp-1",
          nameId: "name-1",
          employeeCode: "EMP001",
          companyId: "company-1",
          isActive: true,
        },
      ]);

      const emp = await getById<Employee>("employees", "emp-1");

      expect(emp).not.toBeNull();
      expect(emp!.employeeCode).toBe("EMP001");
      expect(emp!.companyId).toBe("company-1");
    });

    it("should return null for non-existent employee", async () => {
      const emp = await getById("employees", "nonexistent-id");
      expect(emp).toBeNull();
    });

    it("should retrieve employee profile with government numbers", async () => {
      addMockDocs("employee_profiles/profile-1", [
        {
          id: "profile-1",
          employeeId: "emp-1",
          sss: "12-345-6789-0",
          tin: "123-456-789-000",
          philhealth: "12-3456789123-4",
        },
      ]);

      const profile = await getById<EmployeeProfile>(
        "employee_profiles",
        "profile-1",
      );

      expect(profile).not.toBeNull();
      expect(profile!.sss).toBe("12-345-6789-0");
      expect(profile!.tin).toBe("123-456-789-000");
    });

    it("should retrieve employee contacts", async () => {
      addMockDocs("employee_contacts", [
        {
          id: "contact-1",
          employeeId: "emp-1",
          type: "email",
          value: "john@example.com",
          isPrimary: true,
        },
        {
          id: "contact-2",
          employeeId: "emp-1",
          type: "phone",
          value: "09171234567",
          isPrimary: false,
        },
      ]);

      const contacts = await getAll<EmployeeContact>("employee_contacts", [
        { field: "employeeId", op: "==", value: "emp-1" },
      ]);

      expect(contacts).toHaveLength(2);
      expect(contacts[0].employeeId).toBe("emp-1");
    });

    it("should link employee to payroll records", async () => {
      addMockDocs("payroll_employees", [
        {
          id: "pe-1",
          payrollId: "payroll-1",
          nameId: "name-1",
          basicSalary: 25000,
          grossPay: 25000,
          netPay: 22000,
        },
      ]);

      const payrollEmps = await fetchPayrollEmployees("payroll-1");

      expect(payrollEmps).toHaveLength(1);
      expect(payrollEmps[0].nameId).toBe("name-1");
      expect(payrollEmps[0].basicSalary).toBe(25000);
    });
  });

  // ── Full employee lifecycle ───────────────────────────────────────────
  describe("Full employee lifecycle", () => {
    it("should perform complete create → read → update → read cycle", async () => {
      // 1. Create employee
      const empId = await create("employees", {
        nameId: "name-1",
        companyId: "company-1",
        employeeCode: "EMP001",
        statusId: "status-active",
        isActive: true,
      });

      expect(empId).toBe("mock-id");

      // 2. Mock the created document for retrieval
      addMockDocs("employees/mock-id", [
        {
          id: "mock-id",
          nameId: "name-1",
          companyId: "company-1",
          employeeCode: "EMP001",
          statusId: "status-active",
          isActive: true,
        },
      ]);

      // 3. Read it back
      const created = await getById<Employee>("employees", "mock-id");
      expect(created).not.toBeNull();
      expect(created!.employeeCode).toBe("EMP001");

      // 4. Update
      await update("employees", "mock-id", {
        statusId: "status-inactive",
      });

      // 5. Verify update
      addMockDocs("employees/mock-id", [
        {
          id: "mock-id",
          nameId: "name-1",
          companyId: "company-1",
          employeeCode: "EMP001",
          statusId: "status-inactive",
          isActive: false,
        },
      ]);

      const updated = await getById<Employee>("employees", "mock-id");
      expect(updated).not.toBeNull();
      expect(updated!.statusId).toBe("status-inactive");
    });

    it("should audit the full lifecycle", async () => {
      await auditCreate(
        mockUser as never,
        "employees",
        "EMP003",
        "Employee",
        "Created employee EMP003",
      );

      await auditUpdate(
        mockUser as never,
        "employees",
        "EMP003",
        "Employee",
        { statusId: "status-active" },
        { statusId: "status-inactive" },
        "Updated employee status",
      );

      await auditDelete(
        mockUser as never,
        "employees",
        "EMP003",
        "Employee",
        "Deleted employee EMP003",
      );

      // Verify three audit calls were made
      const auditCalls = vi
        .mocked(addDoc)
        .mock.calls.filter(([path]) => path === "system_audit");
      expect(auditCalls.length).toBe(3);
    });
  });
});
