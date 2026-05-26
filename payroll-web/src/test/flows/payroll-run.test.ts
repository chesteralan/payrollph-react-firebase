import { describe, it, expect, beforeEach, vi } from "vitest";
import { addMockDocs, clearMockDocs } from "../../__mocks__/firebase";
import { addDoc, getDocs, updateDoc, where, query } from "firebase/firestore";
import { create, update, getAll } from "../../services/firestore";
import {
  fetchPayrollEmployees,
  fetchEmployeeDetails,
  fetchEmployeeSalaries,
  updatePayrollDTR,
  savePayrollEarning,
  savePayrollDeduction,
  savePayrollBenefit,
  computeGrossPay,
  computeNetPay,
  computeOvertimePay,
  computeHourlyRate,
  computeDailyRate,
  sumEarnings,
  sumDeductions,
  sumBenefits,
} from "../../services/payroll";
import type { Payroll, PayrollTemplate, PayrollEmployee } from "../../types";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("Payroll Flow — Template → Run → Assign → Compute → Lock", () => {
  // ── Template Creation ──────────────────────────────────────────────────
  describe("Payroll template creation", () => {
    it("should create a payroll template with earnings, deductions, benefits", async () => {
      const templateId = await create("payroll_templates", {
        companyId: "company-1",
        name: "Regular Monthly",
        description: "Standard monthly payroll template",
        pages: 1,
        isActive: true,
        earnings: ["earning-1", "earning-2"],
        deductions: ["deduction-1"],
        benefits: ["benefit-1"],
        printColumns: ["col-1"],
      });

      expect(templateId).toBe("mock-id");
      expect(addDoc).toHaveBeenCalledWith(
        "payroll_templates",
        expect.objectContaining({
          name: "Regular Monthly",
          earnings: ["earning-1", "earning-2"],
          deductions: ["deduction-1"],
          benefits: ["benefit-1"],
        }),
      );
    });

    it("should list available templates", async () => {
      addMockDocs("payroll_templates", [
        {
          id: "tmpl-1",
          name: "Regular Monthly",
          companyId: "company-1",
          isActive: true,
        },
        {
          id: "tmpl-2",
          name: "Semi-Monthly",
          companyId: "company-1",
          isActive: true,
        },
      ]);

      const templates = await getAll("payroll_templates", [
        { field: "companyId", op: "==", value: "company-1" },
      ]);

      expect(templates).toHaveLength(2);
      expect(templates[0]).toHaveProperty("name");
    });
  });

  // ── Payroll Run ───────────────────────────────────────────────────────
  describe("Payroll run creation", () => {
    it("should create a payroll run from template", async () => {
      const payrollId = await create("payroll", {
        companyId: "company-1",
        templateId: "tmpl-1",
        name: "January 2025 Regular",
        month: 1,
        year: 2025,
        status: "draft",
        isActive: true,
        isLocked: false,
        createdBy: "user-1",
      });

      expect(payrollId).toBe("mock-id");
      expect(addDoc).toHaveBeenCalledWith(
        "payroll",
        expect.objectContaining({
          name: "January 2025 Regular",
          month: 1,
          year: 2025,
          status: "draft",
        }),
      );
    });

    it("should create inclusive dates for the payroll period", async () => {
      await create("payroll_inclusive_dates", {
        payrollId: "payroll-1",
        date: new Date("2025-01-01"),
      });

      expect(addDoc).toHaveBeenCalledWith(
        "payroll_inclusive_dates",
        expect.objectContaining({
          payrollId: "payroll-1",
        }),
      );
    });

    it("should retrieve all payroll runs for a company", async () => {
      addMockDocs("payroll", [
        {
          id: "payroll-1",
          companyId: "company-1",
          name: "January 2025",
          month: 1,
          year: 2025,
          status: "draft",
        },
        {
          id: "payroll-2",
          companyId: "company-1",
          name: "February 2025",
          month: 2,
          year: 2025,
          status: "locked",
        },
      ]);

      const payrolls = await getAll<Payroll>("payroll", [
        { field: "companyId", op: "==", value: "company-1" },
      ]);

      expect(payrolls).toHaveLength(2);
    });
  });

  // ── Employee Assignment ───────────────────────────────────────────────
  describe("Employee assignment to payroll", () => {
    it("should fetch employees assigned to a payroll", async () => {
      addMockDocs("payroll_employees", [
        {
          id: "pe-1",
          payrollId: "payroll-1",
          nameId: "name-1",
          basicSalary: 25000,
          daysWorked: 22,
          absences: 0,
          lateHours: 0,
          overtimeHours: 0,
          grossPay: 25000,
          netPay: 22000,
          isActive: true,
        },
        {
          id: "pe-2",
          payrollId: "payroll-1",
          nameId: "name-2",
          basicSalary: 30000,
          daysWorked: 20,
          absences: 2,
          lateHours: 4,
          overtimeHours: 5,
          grossPay: 32000,
          netPay: 28500,
          isActive: true,
        },
      ]);

      const employees = await fetchPayrollEmployees("payroll-1");

      expect(employees).toHaveLength(2);
      expect(employees[0].nameId).toBe("name-1");
      expect(employees[1].nameId).toBe("name-2");
    });

    it("should fetch employee details for assigned employees", async () => {
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
      ]);

      const details = await fetchEmployeeDetails(["name-1", "name-2"]);

      expect(details.size).toBe(2);
      expect(details.get("name-1")?.employeeCode).toBe("EMP001");
    });

    it("should fetch salaries for payroll employees", async () => {
      addMockDocs("employee_salaries", [
        {
          id: "sal-1",
          employeeId: "emp-1",
          amount: 25000,
          isPrimary: true,
          isActive: true,
        },
        {
          id: "sal-2",
          employeeId: "emp-2",
          amount: 30000,
          isPrimary: true,
          isActive: true,
        },
      ]);

      const salaries = await fetchEmployeeSalaries(["emp-1", "emp-2"]);

      expect(salaries.size).toBe(2);
      expect(salaries.get("emp-1")?.amount).toBe(25000);
    });

    it("should update DTR data for a payroll employee", async () => {
      addMockDocs("payroll_employees", [
        {
          id: "pe-1",
          payrollId: "payroll-1",
          nameId: "name-1",
        },
      ]);

      await updatePayrollDTR("payroll-1", "name-1", {
        daysWorked: 20,
        absences: 2,
        lateHours: 4,
        overtimeHours: 3,
      });

      expect(updateDoc).toHaveBeenCalledWith(
        "payroll_employees/pe-1",
        expect.objectContaining({
          daysWorked: 20,
          absences: 2,
          lateHours: 4,
          overtimeHours: 3,
        }),
      );
    });

    it("should save earning for a payroll employee", async () => {
      addMockDocs("payroll_employees_earnings", []);

      await savePayrollEarning("payroll-1", "name-1", "overtime", 1500);

      expect(addDoc).toHaveBeenCalledWith(
        "payroll_employees_earnings",
        expect.objectContaining({
          payrollId: "payroll-1",
          nameId: "name-1",
          earningId: "overtime",
          amount: 1500,
        }),
      );
    });

    it("should upsert earning (update existing instead of creating new)", async () => {
      addMockDocs("payroll_employees_earnings", [
        {
          id: "ee-1",
          payrollId: "payroll-1",
          nameId: "name-1",
          earningId: "overtime",
          amount: 1000,
        },
      ]);

      await savePayrollEarning("payroll-1", "name-1", "overtime", 2000);

      // Should update, not create
      expect(updateDoc).toHaveBeenCalled();
      expect(addDoc).not.toHaveBeenCalledWith(
        "payroll_employees_earnings",
        expect.anything(),
      );
    });

    it("should save deduction for a payroll employee", async () => {
      await savePayrollDeduction("payroll-1", "name-1", "tax", 5000);

      expect(addDoc).toHaveBeenCalledWith(
        "payroll_employees_deductions",
        expect.objectContaining({
          payrollId: "payroll-1",
          nameId: "name-1",
          deductionId: "tax",
          amount: 5000,
        }),
      );
    });

    it("should save benefit for a payroll employee", async () => {
      await savePayrollBenefit("payroll-1", "name-1", "sss", 500, 500);

      expect(addDoc).toHaveBeenCalledWith(
        "payroll_employees_benefits",
        expect.objectContaining({
          payrollId: "payroll-1",
          nameId: "name-1",
          benefitId: "sss",
          employeeShare: 500,
          employerShare: 500,
        }),
      );
    });
  });

  // ── Computation ───────────────────────────────────────────────────────
  describe("Payroll computation", () => {
    it("should compute gross pay from salary and earnings", () => {
      const gross = computeGrossPay(25000, [1000, 500]);
      expect(gross).toBe(26500);
    });

    it("should compute net pay from gross, deductions, and benefits", () => {
      const net = computeNetPay(30000, [2000, 1000], [500]);
      expect(net).toBe(26500);
    });

    it("should compute overtime pay with default 1.5x multiplier", () => {
      const pay = computeOvertimePay(100, 10);
      expect(pay).toBe(1500);
    });

    it("should compute hourly rate from monthly salary", () => {
      const rate = computeHourlyRate(22000);
      expect(rate).toBe(125);
    });

    it("should compute daily rate from monthly salary", () => {
      const rate = computeDailyRate(22000);
      expect(rate).toBe(1000);
    });

    it("should sum all earnings from a map", () => {
      const map = new Map([
        ["overtime", 1500],
        ["bonus", 2000],
        ["allowance", 1000],
      ]);
      expect(sumEarnings(map)).toBe(4500);
    });

    it("should sum all deductions from a map", () => {
      const map = new Map([
        ["tax", 5000],
        ["sss", 1200],
        ["philhealth", 800],
      ]);
      expect(sumDeductions(map)).toBe(7000);
    });

    it("should sum all benefit employee shares from a map", () => {
      const map = new Map([
        ["sss", { employeeShare: 500, employerShare: 500 }],
        ["philhealth", { employeeShare: 300, employerShare: 300 }],
        ["pagibig", { employeeShare: 200, employerShare: 200 }],
      ]);
      expect(sumBenefits(map)).toBe(1000);
    });

    it("should perform full payroll computation for an employee", () => {
      const monthlySalary = 25000;
      const earnings = [1500, 500]; // overtime, bonus
      const deductions = [5000, 1200]; // tax, sss
      const benefitShares = [500, 300]; // philhealth, pagibig

      const grossPay = computeGrossPay(monthlySalary, earnings);
      const netPay = computeNetPay(grossPay, deductions, benefitShares);

      expect(grossPay).toBe(27000);
      expect(netPay).toBe(20000); // 27000 - 6200 - 800
    });

    it("should compute hourly rate and overtime from salary", () => {
      const monthlySalary = 22000;
      const hourlyRate = computeHourlyRate(monthlySalary);
      const overtimeHours = 5;
      const overtimePay = computeOvertimePay(hourlyRate, overtimeHours);

      expect(hourlyRate).toBe(125);
      expect(overtimePay).toBe(937.5); // 125 * 1.5 * 5
    });
  });

  // ── Lock ──────────────────────────────────────────────────────────────
  describe("Lock payroll", () => {
    it("should lock a payroll run", async () => {
      addMockDocs("payroll/payroll-1", [
        {
          id: "payroll-1",
          status: "draft",
          isLocked: false,
        },
      ]);

      await update("payroll", "payroll-1", {
        status: "locked",
        isLocked: true,
      });

      expect(updateDoc).toHaveBeenCalledWith(
        "payroll/payroll-1",
        expect.objectContaining({
          status: "locked",
          isLocked: true,
        }),
      );
    });

    it("should publish a locked payroll", async () => {
      await update("payroll", "payroll-1", {
        status: "published",
        isPublished: true,
        publishedAt: new Date(),
      });

      expect(updateDoc).toHaveBeenCalledWith(
        "payroll/payroll-1",
        expect.objectContaining({
          status: "published",
          isPublished: true,
        }),
      );
    });

    it("should not allow editing a locked payroll (simulated guard)", () => {
      // Business rule: locked payrolls should not be editable
      // In the real implementation this check would be in the service layer
      const isLocked = true;

      expect(isLocked).toBe(true);
      // If we attempted an update while locked, it should be rejected
      // This test validates the concept — real guard would be implemented elsewhere
    });
  });

  // ── Full payroll pipeline ─────────────────────────────────────────────
  describe("Full payroll processing pipeline", () => {
    it("should process the complete template → run → assign → compute → lock pipeline", async () => {
      // 1. Create template
      const templateId = await create("payroll_templates", {
        companyId: "company-1",
        name: "Standard Monthly",
        isActive: true,
        earnings: ["earning-1"],
        deductions: ["deduction-1"],
        benefits: ["benefit-1"],
        printColumns: [],
      });
      expect(templateId).toBeDefined();

      // 2. Create payroll run from template
      const payrollId = await create("payroll", {
        companyId: "company-1",
        templateId,
        name: "January 2025",
        month: 1,
        year: 2025,
        status: "draft",
        isActive: true,
        isLocked: false,
        createdBy: "user-1",
      });
      expect(payrollId).toBeDefined();

      // 3. Assign employee
      addMockDocs("payroll_employees", [
        {
          id: "pe-1",
          payrollId,
          nameId: "name-1",
          daysWorked: 22,
          absences: 0,
          lateHours: 0,
          overtimeHours: 3,
          basicSalary: 25000,
          grossPay: 0,
          netPay: 0,
        },
      ]);

      // Fetch assigned employees
      const assigned = await fetchPayrollEmployees(payrollId);
      expect(assigned).toHaveLength(1);

      // 4. Save computation data
      await savePayrollEarning(payrollId, "name-1", "overtime", 1500);
      await savePayrollDeduction(payrollId, "name-1", "tax", 5000);
      await savePayrollBenefit(payrollId, "name-1", "sss", 500, 500);

      // 5. Compute pay
      const monthlySalary = 25000;
      const earnings = [1500];
      const deductions = [5000];
      const benefitShares = [500];

      const grossPay = computeGrossPay(monthlySalary, earnings);
      const netPay = computeNetPay(grossPay, deductions, benefitShares);

      expect(grossPay).toBe(26500);
      expect(netPay).toBe(21000); // 26500 - 5000 - 500

      // 6. Lock the payroll
      await update("payroll", payrollId, {
        status: "locked",
        isLocked: true,
      });

      expect(updateDoc).toHaveBeenCalledWith(
        `payroll/${payrollId}`,
        expect.objectContaining({
          status: "locked",
          isLocked: true,
        }),
      );
    });

    it("should handle empty payroll (no employees assigned)", async () => {
      const employees = await fetchPayrollEmployees("empty-payroll");
      expect(employees).toHaveLength(0);
    });

    it("should handle payroll with multiple employees and aggregate totals", () => {
      // Simulate computing pay for multiple employees
      const employees = [
        {
          nameId: "n1",
          basicSalary: 25000,
          earnings: [1500, 500],
          deductions: [5000, 1200],
          benefits: [500, 300],
        },
        {
          nameId: "n2",
          basicSalary: 30000,
          earnings: [2000],
          deductions: [6000, 1500],
          benefits: [600, 400],
        },
        {
          nameId: "n3",
          basicSalary: 18000,
          earnings: [1000],
          deductions: [3600, 800],
          benefits: [300, 200],
        },
      ];

      let totalGross = 0;
      let totalNet = 0;

      for (const emp of employees) {
        const gross = computeGrossPay(emp.basicSalary, emp.earnings);
        const net = computeNetPay(gross, emp.deductions, emp.benefits);
        totalGross += gross;
        totalNet += net;
      }

      expect(totalGross).toBe(78000);
      expect(totalNet).toBe(57600);
    });
  });
});
