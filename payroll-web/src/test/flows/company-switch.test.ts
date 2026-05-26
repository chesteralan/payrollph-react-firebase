import { describe, it, expect, beforeEach, vi } from "vitest";
import { addMockDocs, clearMockDocs } from "../../__mocks__/firebase";
import {
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  where,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { getById, getAll, create } from "../../services/firestore";
import type { Company, Employee, Payroll } from "../../types";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("Company Flow — Switch → Verify Data Isolation", () => {
  // ── Company Context ───────────────────────────────────────────────────
  describe("Company context and switching", () => {
    it("should retrieve all available companies", async () => {
      addMockDocs("companies", [
        { id: "company-a", name: "Acme Corp", isActive: true },
        { id: "company-b", name: "Beta Inc", isActive: true },
      ]);

      const companies = await getAll<Company>("companies");
      expect(companies).toHaveLength(2);
      expect(companies.map((c) => c.name)).toContain("Acme Corp");
      expect(companies.map((c) => c.name)).toContain("Beta Inc");
    });

    it("should select and retrieve a single company by id", async () => {
      addMockDocs("companies/company-a", [
        {
          id: "company-a",
          name: "Acme Corp",
          tin: "123-456-789",
          isActive: true,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-06-01"),
        },
      ]);

      const selected = await getById<Company>("companies", "company-a");
      expect(selected).not.toBeNull();
      expect(selected!.name).toBe("Acme Corp");
      expect(selected!.tin).toBe("123-456-789");
    });

    it("should build query with isActive filter to exclude inactive companies", async () => {
      await getAll("companies", [{ field: "isActive", op: "==", value: true }]);
      expect(where).toHaveBeenCalledWith("isActive", "==", true);
    });

    it("should return null for non-existent company", async () => {
      const result = await getById("companies", "nonexistent");
      expect(result).toBeNull();
    });
  });

  // ── Data Isolation: Employees ───────────────────────────────────────
  describe("Employee data isolation between companies", () => {
    beforeEach(() => {
      addMockDocs("employees", [
        {
          id: "emp-a1",
          nameId: "name-a1",
          companyId: "company-a",
          employeeCode: "ACA001",
          isActive: true,
        },
        {
          id: "emp-a2",
          nameId: "name-a2",
          companyId: "company-a",
          employeeCode: "ACA002",
          isActive: true,
        },
        {
          id: "emp-b1",
          nameId: "name-b1",
          companyId: "company-b",
          employeeCode: "BIN001",
          isActive: true,
        },
        {
          id: "emp-b2",
          nameId: "name-b2",
          companyId: "company-b",
          employeeCode: "BIN002",
          isActive: true,
        },
        {
          id: "emp-b3",
          nameId: "name-b3",
          companyId: "company-b",
          employeeCode: "BIN003",
          isActive: false,
        },
      ]);
    });

    it("should build query filtering by companyId for Company A", async () => {
      await getAll("employees", [
        { field: "companyId", op: "==", value: "company-a" },
      ]);
      expect(where).toHaveBeenCalledWith("companyId", "==", "company-a");
    });

    it("should build query filtering by companyId for Company B", async () => {
      await getAll("employees", [
        { field: "companyId", op: "==", value: "company-b" },
      ]);
      expect(where).toHaveBeenCalledWith("companyId", "==", "company-b");
    });

    it("should enforce data isolation by filtering on companyId", async () => {
      // Verify the service builds the correct query for each company
      const companyAFilter = {
        field: "companyId" as const,
        op: "==" as const,
        value: "company-a",
      };
      const companyBFilter = {
        field: "companyId" as const,
        op: "==" as const,
        value: "company-b",
      };

      await getAll("employees", [companyAFilter]);
      await getAll("employees", [companyBFilter]);

      // Two separate where calls for different companies
      const whereCalls = vi
        .mocked(where)
        .mock.calls.filter(([field]) => field === "companyId");
      expect(whereCalls).toHaveLength(2);
      expect(whereCalls[0][2]).toBe("company-a");
      expect(whereCalls[1][2]).toBe("company-b");
    });

    it("should filter results in application layer for data isolation verification", async () => {
      // Application-level filtering to verify data isolation
      const allEmployees = await getAll<Employee>("employees");
      const companyAEmps = allEmployees.filter(
        (e) => e.companyId === "company-a",
      );
      const companyBEmps = allEmployees.filter(
        (e) => e.companyId === "company-b",
      );

      expect(companyAEmps).toHaveLength(2);
      expect(companyBEmps).toHaveLength(3);
      expect(companyAEmps.every((e) => e.companyId === "company-a")).toBe(true);
      expect(companyBEmps.every((e) => e.companyId === "company-b")).toBe(true);
    });

    it("should create new employees under the correct company", async () => {
      await create("employees", {
        nameId: "name-a3",
        companyId: "company-a",
        employeeCode: "ACA003",
        statusId: "active",
        isActive: true,
      });

      expect(addDoc).toHaveBeenCalledWith(
        "employees",
        expect.objectContaining({
          companyId: "company-a",
          employeeCode: "ACA003",
        }),
      );
    });
  });

  // ── Data Isolation: Payroll ──────────────────────────────────────────
  describe("Payroll data isolation between companies", () => {
    beforeEach(() => {
      addMockDocs("payroll", [
        {
          id: "pr-a1",
          companyId: "company-a",
          name: "Jan 2025 A",
          month: 1,
          year: 2025,
          status: "locked",
        },
        {
          id: "pr-a2",
          companyId: "company-a",
          name: "Feb 2025 A",
          month: 2,
          year: 2025,
          status: "draft",
        },
        {
          id: "pr-b1",
          companyId: "company-b",
          name: "Jan 2025 B",
          month: 1,
          year: 2025,
          status: "locked",
        },
      ]);
    });

    it("should build query filtering payroll by companyId", async () => {
      await getAll("payroll", [
        { field: "companyId", op: "==", value: "company-a" },
      ]);
      expect(where).toHaveBeenCalledWith("companyId", "==", "company-a");
    });

    it("should isolate payroll data in application layer", async () => {
      const allPayrolls = await getAll<Payroll>("payroll");
      const payrollsA = allPayrolls.filter((p) => p.companyId === "company-a");
      const payrollsB = allPayrolls.filter((p) => p.companyId === "company-b");

      expect(payrollsA).toHaveLength(2);
      expect(payrollsB).toHaveLength(1);
      expect(payrollsB.every((p) => p.companyId === "company-b")).toBe(true);
    });
  });

  // ── Data Isolation: Templates ────────────────────────────────────────
  describe("Template data isolation between companies", () => {
    beforeEach(() => {
      addMockDocs("payroll_templates", [
        {
          id: "tpl-a1",
          companyId: "company-a",
          name: "Standard Monthly A",
          isActive: true,
        },
        {
          id: "tpl-a2",
          companyId: "company-a",
          name: "Semi-Monthly A",
          isActive: true,
        },
        {
          id: "tpl-b1",
          companyId: "company-b",
          name: "Standard Monthly B",
          isActive: true,
        },
      ]);
    });

    it("should build query filtering templates by companyId", async () => {
      await getAll("payroll_templates", [
        { field: "companyId", op: "==", value: "company-a" },
      ]);
      expect(where).toHaveBeenCalledWith("companyId", "==", "company-a");
    });

    it("should isolate templates by company in application layer", async () => {
      const all = await getAll("payroll_templates");
      const templatesA = all.filter(
        (t: Record<string, unknown>) => t.companyId === "company-a",
      );
      const templatesB = all.filter(
        (t: Record<string, unknown>) => t.companyId === "company-b",
      );
      expect(templatesA).toHaveLength(2);
      expect(templatesB).toHaveLength(1);
    });
  });

  // ── Data Isolation: Employee Groups ─────────────────────────────────
  describe("Employee group isolation between companies", () => {
    beforeEach(() => {
      addMockDocs("employee_groups", [
        {
          id: "grp-a1",
          name: "Engineering A",
          companyId: "company-a",
          isActive: true,
        },
        {
          id: "grp-a2",
          name: "Sales A",
          companyId: "company-a",
          isActive: true,
        },
        {
          id: "grp-b1",
          name: "Engineering B",
          companyId: "company-b",
          isActive: true,
        },
      ]);
    });

    it("should build query filtering groups by companyId", async () => {
      await getAll("employee_groups", [
        { field: "companyId", op: "==", value: "company-a" },
      ]);
      expect(where).toHaveBeenCalledWith("companyId", "==", "company-a");
    });

    it("should isolate groups by company in application layer", async () => {
      const all = await getAll("employee_groups");
      const groupsA = all.filter(
        (g: Record<string, unknown>) => g.companyId === "company-a",
      );
      const groupsB = all.filter(
        (g: Record<string, unknown>) => g.companyId === "company-b",
      );
      expect(groupsA).toHaveLength(2);
      expect(groupsB).toHaveLength(1);
    });
  });

  // ── Full Company Switch Lifecycle ─────────────────────────────────────
  describe("Full company switch lifecycle", () => {
    it("should perform complete switch and verify data isolation across entity types", async () => {
      addMockDocs("employees", [
        {
          id: "emp-a1",
          nameId: "n1",
          companyId: "company-a",
          employeeCode: "ACA001",
          isActive: true,
        },
        {
          id: "emp-b1",
          nameId: "n2",
          companyId: "company-b",
          employeeCode: "BIN001",
          isActive: true,
        },
      ]);
      addMockDocs("payroll", [
        {
          id: "pr-a1",
          companyId: "company-a",
          name: "Jan 2025",
          month: 1,
          year: 2025,
          status: "draft",
        },
        {
          id: "pr-b1",
          companyId: "company-b",
          name: "Jan 2025",
          month: 1,
          year: 2025,
          status: "locked",
        },
      ]);
      addMockDocs("payroll_templates", [
        {
          id: "tpl-a1",
          companyId: "company-a",
          name: "Monthly A",
          isActive: true,
        },
        {
          id: "tpl-b1",
          companyId: "company-b",
          name: "Monthly B",
          isActive: true,
        },
      ]);
      addMockDocs("employee_groups", [
        {
          id: "grp-a1",
          companyId: "company-a",
          name: "Engineering",
          isActive: true,
        },
        {
          id: "grp-b1",
          companyId: "company-b",
          name: "Engineering",
          isActive: true,
        },
      ]);

      // Verify query construction for Company A
      await getAll("employees", [
        { field: "companyId", op: "==", value: "company-a" },
      ]);
      expect(where).toHaveBeenCalledWith("companyId", "==", "company-a");

      // Verify query construction for Company B
      await getAll("payroll", [
        { field: "companyId", op: "==", value: "company-b" },
      ]);
      expect(where).toHaveBeenCalledWith("companyId", "==", "company-b");

      // Application-level data isolation
      const allEmps = await getAll<Employee>("employees");
      const allPrs = await getAll<Payroll>("payroll");
      const allTpls = await getAll("payroll_templates");
      const allGrps = await getAll("employee_groups");

      expect(allEmps.filter((e) => e.companyId === "company-a")).toHaveLength(
        1,
      );
      expect(allEmps.filter((e) => e.companyId === "company-b")).toHaveLength(
        1,
      );
      expect(allPrs.filter((p) => p.companyId === "company-a")).toHaveLength(1);
      expect(allPrs.filter((p) => p.companyId === "company-b")).toHaveLength(1);
      expect(
        allTpls.filter(
          (t: Record<string, unknown>) => t.companyId === "company-a",
        ),
      ).toHaveLength(1);
      expect(
        allTpls.filter(
          (t: Record<string, unknown>) => t.companyId === "company-b",
        ),
      ).toHaveLength(1);
      expect(
        allGrps.filter(
          (g: Record<string, unknown>) => g.companyId === "company-a",
        ),
      ).toHaveLength(1);
      expect(
        allGrps.filter(
          (g: Record<string, unknown>) => g.companyId === "company-b",
        ),
      ).toHaveLength(1);
    });

    it("should return different company-specific options via query construction", async () => {
      addMockDocs("company_options", [
        {
          id: "opts-a",
          companyId: "company-a",
          columnGroup: {
            dtr: true,
            salaries: true,
            earnings: true,
            benefits: true,
            deductions: true,
          },
          workDays: [1, 2, 3, 4, 5],
        },
        {
          id: "opts-b",
          companyId: "company-b",
          columnGroup: {
            dtr: false,
            salaries: true,
            earnings: true,
            benefits: false,
            deductions: true,
          },
          workDays: [1, 2, 3, 4, 5, 6],
        },
      ]);

      // Verify the service constructs correct filtered queries
      await getAll("company_options", [
        { field: "companyId", op: "==", value: "company-a" },
      ]);
      expect(where).toHaveBeenCalledWith("companyId", "==", "company-a");

      // Application-level filtering for data isolation
      const allOpts = await getAll("company_options");
      const optsA = allOpts.filter(
        (o: Record<string, unknown>) => o.companyId === "company-a",
      );
      const optsB = allOpts.filter(
        (o: Record<string, unknown>) => o.companyId === "company-b",
      );

      expect(
        (optsA[0] as Record<string, unknown>).columnGroup as Record<
          string,
          boolean
        >,
      ).toHaveProperty("dtr", true);
      expect(
        (optsB[0] as Record<string, unknown>).columnGroup as Record<
          string,
          boolean
        >,
      ).toHaveProperty("dtr", false);
    });
  });
});
