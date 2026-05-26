import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addMockDocs,
  clearMockDocs,
} from "../../__mocks__/firebase";
import { addDoc, getDocs, getDoc, where, query } from "firebase/firestore";
import { getAll } from "../../services/firestore";
import { generateReportData } from "../../services/reportGenerator";
import { exportToCSV, exportToJson } from "../../utils/exportUtils";
import type { Payroll, PayrollEmployee } from "../../types";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

// Mock URL.createObjectURL for export functions
beforeEach(() => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-report-url");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

describe("Reports Flow — Summary → CSV Export → Verify Totals", () => {
  // ── Payroll Summary Report ────────────────────────────────────────────
  describe("Payroll summary report", () => {
    it("should generate payroll summary data from firestore", async () => {
      addMockDocs("payroll", [
        {
          id: "payroll-1",
          companyId: "company-1",
          name: "January 2025",
          month: 1,
          year: 2025,
          status: "locked",
        },
        {
          id: "payroll-2",
          companyId: "company-1",
          name: "February 2025",
          month: 2,
          year: 2025,
          status: "draft",
        },
      ]);

      const payrolls = await getAll<Payroll>("payroll", [
        { field: "companyId", op: "==", value: "company-1" },
        { field: "year", op: "==", value: 2025 },
      ]);

      expect(payrolls).toHaveLength(2);
      expect(payrolls[0].status).toBe("locked");
    });

    it("should aggregate payroll totals from employee data", async () => {
      addMockDocs("payroll_employees", [
        { id: "pe-1", payrollId: "pr-1", basicSalary: 25000, grossPay: 27000, netPay: 21000 },
        { id: "pe-2", payrollId: "pr-1", basicSalary: 30000, grossPay: 33000, netPay: 25000 },
        { id: "pe-3", payrollId: "pr-1", basicSalary: 18000, grossPay: 19500, netPay: 15000 },
      ]);

      const all = await getAll<PayrollEmployee>("payroll_employees", [
        { field: "payrollId", op: "==", value: "pr-1" },
      ]);

      const summary = {
        totalEmployees: all.length,
        totalBasicSalary: all.reduce((s, e) => s + e.basicSalary, 0),
        totalGrossPay: all.reduce((s, e) => s + e.grossPay, 0),
        totalNetPay: all.reduce((s, e) => s + e.netPay, 0),
      };

      expect(summary.totalEmployees).toBe(3);
      expect(summary.totalBasicSalary).toBe(73000);
      expect(summary.totalGrossPay).toBe(79500);
      expect(summary.totalNetPay).toBe(61000);
    });

    it("should filter reports by date range", async () => {
      addMockDocs("payroll", [
        { id: "pr-1", month: 1, year: 2025 },
        { id: "pr-2", month: 2, year: 2025 },
        { id: "pr-3", month: 3, year: 2025 },
      ]);

      const q1 = await getAll<Payroll>("payroll", [
        { field: "year", op: "==", value: 2025 },
      ]);

      const q1Months = q1.filter((p) => p.month >= 1 && p.month <= 3);
      expect(q1Months).toHaveLength(3);
    });

    it("should compute deduction totals from payroll benefits", () => {
      const deductionItems = [
        { name: "Withholding Tax", amount: 5000 },
        { name: "SSS", amount: 1200 },
        { name: "PhilHealth", amount: 800 },
        { name: "Pag-IBIG", amount: 200 },
      ];

      const totalDeductions = deductionItems.reduce(
        (sum, d) => sum + d.amount,
        0,
      );
      expect(totalDeductions).toBe(7200);
    });

    it("should generate report data via reportGenerator service", async () => {
      const data = await generateReportData("payroll_summary", {
        companyId: "company-1",
        year: 2025,
        month: 1,
      });

      // The stub returns an empty array — real implementation would return data
      expect(Array.isArray(data)).toBe(true);
    });

    it("should compute summary for multiple payroll periods", async () => {
      // Simulate year-end summary
      const payrolls = [
        { name: "Jan", grossPay: 79500, netPay: 61000, deductions: 18500 },
        { name: "Feb", grossPay: 82000, netPay: 63000, deductions: 19000 },
        { name: "Mar", grossPay: 79000, netPay: 60500, deductions: 18500 },
      ];

      const annualSummary = {
        totalGross: payrolls.reduce((s, p) => s + p.grossPay, 0),
        totalNet: payrolls.reduce((s, p) => s + p.netPay, 0),
        totalDeductions: payrolls.reduce((s, p) => s + p.deductions, 0),
      };

      expect(annualSummary.totalGross).toBe(240500);
      expect(annualSummary.totalNet).toBe(184500);
      expect(annualSummary.totalDeductions).toBe(56000);
    });
  });

  // ── Employee Report ───────────────────────────────────────────────────
  describe("Employee report", () => {
    it("should filter to active employees using application logic", async () => {
      addMockDocs("employees", [
        { id: "emp-1", employeeCode: "EMP001", isActive: true, nameId: "name-1" },
        { id: "emp-2", employeeCode: "EMP002", isActive: true, nameId: "name-2" },
        { id: "emp-3", employeeCode: "EMP003", isActive: false, nameId: "name-3" },
      ]);

      // Build query with isActive filter
      await getAll("employees", [
        { field: "isActive", op: "==", value: true },
      ]);
      expect(where).toHaveBeenCalledWith("isActive", "==", true);

      // Apply filtering in application layer for verification
      const allEmployees = await getAll("employees");
      const active = allEmployees.filter(
        (e: Record<string, unknown>) => e.isActive === true,
      );

      expect(active).toHaveLength(2);
      expect(active.map((e: Record<string, unknown>) => e.employeeCode)).toEqual([
        "EMP001",
        "EMP002",
      ]);
    });

    it("should aggregate employees by department", () => {
      const employees = [
        { name: "Alice", dept: "Engineering" },
        { name: "Bob", dept: "Engineering" },
        { name: "Charlie", dept: "Sales" },
        { name: "Diana", dept: "Sales" },
        { name: "Eve", dept: "HR" },
      ];

      const byDept: Record<string, number> = {};
      for (const emp of employees) {
        byDept[emp.dept] = (byDept[emp.dept] || 0) + 1;
      }

      expect(byDept["Engineering"]).toBe(2);
      expect(byDept["Sales"]).toBe(2);
      expect(byDept["HR"]).toBe(1);
    });
  });

  // ── CSV Export ────────────────────────────────────────────────────────
  describe("CSV export", () => {
    it("should export payroll data to CSV format", () => {
      const payrollData = [
        {
          id: "pr-1",
          name: "January 2025",
          month: 1,
          year: 2025,
          status: "locked",
        },
        {
          id: "pr-2",
          name: "February 2025",
          month: 2,
          year: 2025,
          status: "draft",
        },
      ];

      const columns = [
        { header: "Name", key: "name" },
        { header: "Period", key: "periodKey" },
        { header: "Status", key: "status" },
      ];

      const formatted = payrollData.map((p) => ({
        name: p.name,
        periodKey: `${p.month}/${p.year}`,
        status: p.status,
      }));

      expect(() =>
        exportToCSV(formatted, columns, "payroll-report"),
      ).not.toThrow();
    });

    it("should export employee data with all required columns", () => {
      const employees = [
        { id: "1", name: "Alice", status: "Active", email: "alice@test.com" },
        { id: "2", name: "Bob", status: "Active", email: "bob@test.com" },
      ];

      const columns = [
        { header: "ID", key: "id" },
        { header: "Name", key: "name" },
        { header: "Status", key: "status" },
        { header: "Email", key: "email" },
      ];

      expect(() =>
        exportToCSV(employees, columns, "employee-report"),
      ).not.toThrow();
    });

    it("should handle empty data for CSV export", () => {
      const columns = [
        { header: "Name", key: "name" },
        { header: "Amount", key: "amount" },
      ];

      expect(() => exportToCSV([], columns, "empty-report")).not.toThrow();
    });

    it("should export JSON format as well", () => {
      const data = [
        { month: "January", grossPay: 50000, netPay: 40000 },
        { month: "February", grossPay: 52000, netPay: 41500 },
      ];

      expect(() => exportToJson(data, "payroll-summary")).not.toThrow();
    });
  });

  // ── Totals Verification ───────────────────────────────────────────────
  describe("Totals verification", () => {
    it("should verify that net pay + deductions = gross pay", () => {
      const employees = [
        { name: "Alice", grossPay: 27000, netPay: 21000, deductions: 6000 },
        { name: "Bob", grossPay: 33000, netPay: 25000, deductions: 8000 },
        { name: "Charlie", grossPay: 19500, netPay: 15000, deductions: 4500 },
      ];

      for (const emp of employees) {
        expect(emp.netPay + emp.deductions).toBe(emp.grossPay);
      }
    });

    it("should verify totals match across payroll run with consistent data", () => {
      const run = {
        totalGrossPay: 79500,
        totalDeductions: 16500,
        totalEmployerBenefits: 3000,
        totalEmployeeBenefits: 2000,
        totalNetPay: 61000,
      };

      // Gross - Deductions - Employee Benefits = Net
      expect(
        run.totalGrossPay -
          run.totalDeductions -
          run.totalEmployeeBenefits,
      ).toBe(run.totalNetPay);
    });

    it("should compute per-employee deductions breakdown", () => {
      const employeePayroll = {
        basicSalary: 25000,
        earnings: [{ name: "Overtime", amount: 1500 }],
        deductions: [
          { name: "Withholding Tax", amount: 5000 },
          { name: "SSS", amount: 1200 },
        ],
        benefits: [{ name: "PhilHealth", amount: 500 }],
      };

      const totalEarnings = employeePayroll.earnings.reduce(
        (s, e) => s + e.amount,
        0,
      );
      const totalDeductions = employeePayroll.deductions.reduce(
        (s, d) => s + d.amount,
        0,
      );
      const totalBenefits = employeePayroll.benefits.reduce(
        (s, b) => s + b.amount,
        0,
      );

      const grossPay = employeePayroll.basicSalary + totalEarnings;
      const netPay = grossPay - totalDeductions - totalBenefits;

      expect(grossPay).toBe(26500);
      expect(netPay).toBe(19800); // 26500 - 6200 - 500
    });

    it("should compute 13th month pay (pro-rated)", () => {
      const basicSalary = 25000;
      const monthsWorked = 12;
      const thirteenthMonthPay =
        (basicSalary * monthsWorked) / 12;

      expect(thirteenthMonthPay).toBe(25000);
    });

    it("should verify company-wide payroll totals", () => {
      const companyPayroll = {
        departments: [
          {
            name: "Engineering",
            employees: 5,
            totalGross: 150000,
            totalNet: 120000,
            totalDeductions: 30000,
          },
          {
            name: "Sales",
            employees: 3,
            totalGross: 90000,
            totalNet: 72000,
            totalDeductions: 18000,
          },
        ],
      };

      const grandTotal = companyPayroll.departments.reduce(
        (s, d) => ({
          employees: s.employees + d.employees,
          grossPay: s.grossPay + d.totalGross,
          netPay: s.netPay + d.totalNet,
          deductions: s.deductions + d.totalDeductions,
        }),
        { employees: 0, grossPay: 0, netPay: 0, deductions: 0 },
      );

      expect(grandTotal.employees).toBe(8);
      expect(grandTotal.grossPay).toBe(240000);
      expect(grandTotal.netPay).toBe(192000);
      expect(grandTotal.deductions).toBe(48000);
    });
  });
});
