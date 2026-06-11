import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  computeGrossPay,
  computeNetPay,
  sumEarnings,
  sumDeductions,
  sumBenefits,
  computeOvertimePay,
  computeHourlyRate,
  computeDailyRate,
  fetchPayrollEmployees,
  fetchEmployeeDetails,
  fetchEmployeeSalaries,
  fetchListItems,
  updatePayrollDTR,
  savePayrollEarning,
  savePayrollDeduction,
  savePayrollBenefit,
} from "./payroll";
import { formatCurrency } from "../utils/currency";
import { addMockDocs, clearMockDocs } from "../__mocks__/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

describe("computeGrossPay", () => {
  it("should return salary amount when no earnings", () => {
    expect(computeGrossPay(25000, [])).toBe(25000);
  });

  it("should add earnings to salary", () => {
    expect(computeGrossPay(25000, [1000, 500])).toBe(26500);
  });

  it("should handle zero salary", () => {
    expect(computeGrossPay(0, [1000])).toBe(1000);
  });

  it("should handle negative earnings (deductions from gross)", () => {
    expect(computeGrossPay(25000, [-500])).toBe(24500);
  });
});

describe("computeNetPay", () => {
  it("should subtract deductions and benefits from gross", () => {
    expect(computeNetPay(30000, [2000, 1000], [500])).toBe(26500);
  });

  it("should return gross when no deductions or benefits", () => {
    expect(computeNetPay(25000, [], [])).toBe(25000);
  });

  it("should handle zero gross", () => {
    expect(computeNetPay(0, [1000], [500])).toBe(-1500);
  });

  it("should handle large deduction sets", () => {
    const deductions = Array.from({ length: 20 }, (_, i) => i * 100);
    const benefits = [1000, 500];
    expect(computeNetPay(100000, deductions, benefits)).toBe(
      100000 - deductions.reduce((s, v) => s + v, 0) - 1500,
    );
  });
});

describe("sumEarnings", () => {
  it("should sum all values in a map", () => {
    const map = new Map([
      ["overtime", 1500],
      ["bonus", 2000],
    ]);
    expect(sumEarnings(map)).toBe(3500);
  });

  it("should return 0 for empty map", () => {
    expect(sumEarnings(new Map())).toBe(0);
  });
});

describe("sumDeductions", () => {
  it("should sum all deduction values", () => {
    const map = new Map([
      ["tax", 5000],
      ["sss", 1200],
    ]);
    expect(sumDeductions(map)).toBe(6200);
  });

  it("should return 0 for empty map", () => {
    expect(sumDeductions(new Map())).toBe(0);
  });
});

describe("sumBenefits", () => {
  it("should sum employeeShare from benefit entries", () => {
    const map = new Map([
      ["philhealth", { employeeShare: 500, employerShare: 500 }],
      ["pagibig", { employeeShare: 200, employerShare: 200 }],
    ]);
    expect(sumBenefits(map)).toBe(700);
  });

  it("should return 0 for empty map", () => {
    expect(sumBenefits(new Map())).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("should format value as PHP currency", () => {
    const result = formatCurrency(25000.5);
    expect(result).toContain("25,000.50");
    expect(result).toContain("₱");
  });

  it("should format zero", () => {
    expect(formatCurrency(0)).toContain("0.00");
  });

  it("should format negative values", () => {
    expect(formatCurrency(-500)).toContain("-");
  });
});

describe("computeOvertimePay", () => {
  it("should calculate overtime at 1.5x by default", () => {
    expect(computeOvertimePay(100, 10)).toBe(1500);
  });

  it("should use custom multiplier when provided", () => {
    expect(computeOvertimePay(100, 10, 2)).toBe(2000);
  });

  it("should return 0 when no overtime hours", () => {
    expect(computeOvertimePay(100, 0)).toBe(0);
  });

  it("should handle fractional hours", () => {
    expect(computeOvertimePay(100, 2.5)).toBe(375);
  });
});

describe("computeHourlyRate", () => {
  it("should compute hourly rate from monthly salary", () => {
    expect(computeHourlyRate(22000)).toBe(125);
  });

  it("should use custom work days and hours", () => {
    expect(computeHourlyRate(24000, 20, 8)).toBe(150);
  });

  it("should return 0 for zero salary", () => {
    expect(computeHourlyRate(0)).toBe(0);
  });
});

describe("computeDailyRate", () => {
  it("should compute daily rate from monthly salary", () => {
    expect(computeDailyRate(22000)).toBe(1000);
  });

  it("should use custom work days per month", () => {
    expect(computeDailyRate(30000, 20)).toBe(1500);
  });

  it("should return 0 for zero salary", () => {
    expect(computeDailyRate(0)).toBe(0);
  });
});

describe("fetchPayrollEmployees", () => {
  beforeEach(() => {
    clearMockDocs();
    vi.clearAllMocks();
  });

  it("should fetch payroll employees for a given payroll ID", async () => {
    addMockDocs("payroll_employees", [
      { id: "pe1", payrollId: "payroll-1", nameId: "n1", orderId: 1, isActive: true, daysWorked: 20, absences: 0, lateHours: 0, overtimeHours: 0, basicSalary: 25000, grossPay: 25000, netPay: 25000 },
      { id: "pe2", payrollId: "payroll-1", nameId: "n2", orderId: 2, isActive: true, daysWorked: 22, absences: 0, lateHours: 0, overtimeHours: 0, basicSalary: 30000, grossPay: 30000, netPay: 30000 },
    ]);

    const result = await fetchPayrollEmployees("payroll-1");

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("pe1");
    expect(result[0].nameId).toBe("n1");
    expect(result[1].id).toBe("pe2");
    expect(result[1].nameId).toBe("n2");
    expect(collection).toHaveBeenCalledWith({}, "payroll_employees");
    expect(where).toHaveBeenCalledWith("payrollId", "==", "payroll-1");
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledTimes(1);
  });

  it("should return empty array when no matching employees exist", async () => {
    addMockDocs("payroll_employees", []);

    const result = await fetchPayrollEmployees("non-existent");

    expect(result).toEqual([]);
    expect(getDocs).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors from getDocs", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchPayrollEmployees("payroll-1")).rejects.toThrow("Network error");
  });
});

describe("fetchEmployeeDetails", () => {
  beforeEach(() => {
    clearMockDocs();
    vi.clearAllMocks();
  });

  it("should return a map of employee details for given nameIds", async () => {
    const mockDoc1 = {
      id: "emp1",
      exists: () => true,
      data: () => ({ nameId: "n1", companyId: "c1", employeeCode: "E001", isActive: true, statusId: "active" }),
    };
    const mockDoc2 = {
      id: "emp2",
      exists: () => true,
      data: () => ({ nameId: "n2", companyId: "c1", employeeCode: "E002", isActive: true, statusId: "active" }),
    };

    vi.mocked(getDocs)
      .mockResolvedValueOnce({
        docs: [mockDoc1],
        empty: false,
        size: 1,
        forEach: (cb: (d: typeof mockDoc1) => void) => [mockDoc1].forEach(cb),
      } as any)
      .mockResolvedValueOnce({
        docs: [mockDoc2],
        empty: false,
        size: 1,
        forEach: (cb: (d: typeof mockDoc2) => void) => [mockDoc2].forEach(cb),
      } as any);

    const result = await fetchEmployeeDetails(["n1", "n2"]);

    expect(result.size).toBe(2);
    expect(result.get("n1")?.id).toBe("emp1");
    expect(result.get("n1")?.employeeCode).toBe("E001");
    expect(result.get("n2")?.id).toBe("emp2");
    expect(result.get("n2")?.employeeCode).toBe("E002");
    expect(collection).toHaveBeenCalledWith({}, "employees");
    expect(where).toHaveBeenCalledWith("nameId", "==", "n1");
    expect(where).toHaveBeenCalledWith("nameId", "==", "n2");
    expect(getDocs).toHaveBeenCalledTimes(2);
  });

  it("should return empty map when given an empty array", async () => {
    const result = await fetchEmployeeDetails([]);

    expect(result.size).toBe(0);
    expect(getDocs).not.toHaveBeenCalled();
  });

  it("should skip nameIds with no matching employee document", async () => {
    const mockDoc1 = {
      id: "emp1",
      exists: () => true,
      data: () => ({ nameId: "n1", companyId: "c1", employeeCode: "E001", isActive: true, statusId: "active" }),
    };
    const emptySnapshot = {
      docs: [],
      empty: true,
      size: 0,
      forEach: () => {},
    };

    vi.mocked(getDocs)
      .mockResolvedValueOnce({
        docs: [mockDoc1],
        empty: false,
        size: 1,
        forEach: (cb: (d: typeof mockDoc1) => void) => [mockDoc1].forEach(cb),
      } as any)
      .mockResolvedValueOnce(emptySnapshot as any);

    const result = await fetchEmployeeDetails(["n1", "n2"]);

    expect(result.size).toBe(1);
    expect(result.has("n1")).toBe(true);
    expect(result.has("n2")).toBe(false);
  });

  it("should propagate errors from getDocs", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Permission denied"));

    await expect(fetchEmployeeDetails(["n1"])).rejects.toThrow("Permission denied");
  });
});

describe("fetchEmployeeSalaries", () => {
  beforeEach(() => {
    clearMockDocs();
    vi.clearAllMocks();
  });

  it("should return a map of primary active salaries for given employeeIds", async () => {
    const mockSal1 = {
      id: "sal1",
      exists: () => true,
      data: () => ({ employeeId: "emp1", amount: 25000, frequency: "monthly", isPrimary: true, isActive: true }),
    };
    const mockSal2 = {
      id: "sal2",
      exists: () => true,
      data: () => ({ employeeId: "emp2", amount: 30000, frequency: "monthly", isPrimary: true, isActive: true }),
    };

    vi.mocked(getDocs)
      .mockResolvedValueOnce({
        docs: [mockSal1],
        empty: false,
        size: 1,
        forEach: (cb: (d: typeof mockSal1) => void) => [mockSal1].forEach(cb),
      } as any)
      .mockResolvedValueOnce({
        docs: [mockSal2],
        empty: false,
        size: 1,
        forEach: (cb: (d: typeof mockSal2) => void) => [mockSal2].forEach(cb),
      } as any);

    const result = await fetchEmployeeSalaries(["emp1", "emp2"]);

    expect(result.size).toBe(2);
    expect(result.get("emp1")?.amount).toBe(25000);
    expect(result.get("emp2")?.amount).toBe(30000);
    expect(collection).toHaveBeenCalledWith({}, "employee_salaries");
    expect(where).toHaveBeenCalledWith("employeeId", "==", "emp1");
    expect(where).toHaveBeenCalledWith("employeeId", "==", "emp2");
    expect(where).toHaveBeenCalledWith("isPrimary", "==", true);
    expect(where).toHaveBeenCalledWith("isActive", "==", true);
    expect(getDocs).toHaveBeenCalledTimes(2);
  });

  it("should return empty map when given an empty array", async () => {
    const result = await fetchEmployeeSalaries([]);

    expect(result.size).toBe(0);
    expect(getDocs).not.toHaveBeenCalled();
  });

  it("should skip employeeIds with no matching salary record", async () => {
    const mockSal1 = {
      id: "sal1",
      exists: () => true,
      data: () => ({ employeeId: "emp1", amount: 25000, frequency: "monthly", isPrimary: true, isActive: true }),
    };
    const emptySnapshot = {
      docs: [],
      empty: true,
      size: 0,
      forEach: () => {},
    };

    vi.mocked(getDocs)
      .mockResolvedValueOnce({
        docs: [mockSal1],
        empty: false,
        size: 1,
        forEach: (cb: (d: typeof mockSal1) => void) => [mockSal1].forEach(cb),
      } as any)
      .mockResolvedValueOnce(emptySnapshot as any);

    const result = await fetchEmployeeSalaries(["emp1", "emp2"]);

    expect(result.size).toBe(1);
    expect(result.has("emp1")).toBe(true);
    expect(result.has("emp2")).toBe(false);
  });

  it("should call where with isPrimary and isActive filters", async () => {
    const mockSal1 = {
      id: "sal1",
      exists: () => true,
      data: () => ({ employeeId: "emp1", amount: 25000, frequency: "monthly", isPrimary: false, isActive: true }),
    };

    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [mockSal1],
      empty: false,
      size: 1,
      forEach: (cb: (d: typeof mockSal1) => void) => [mockSal1].forEach(cb),
    } as any);

    const result = await fetchEmployeeSalaries(["emp1"]);

    // The function relies on server-side filtering by isPrimary and isActive,
    // so we verify the where clauses are constructed correctly
    expect(result.size).toBe(1);
    expect(where).toHaveBeenCalledWith("isPrimary", "==", true);
    expect(where).toHaveBeenCalledWith("isActive", "==", true);
  });

  it("should propagate errors from getDocs", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Firestore quota exceeded"));

    await expect(fetchEmployeeSalaries(["emp1"])).rejects.toThrow("Firestore quota exceeded");
  });
});

describe("fetchListItems", () => {
  beforeEach(() => {
    clearMockDocs();
    vi.clearAllMocks();
  });

  it("should fetch active items from a collection when isActive is true", async () => {
    addMockDocs("earnings", [
      { id: "e1", name: "Overtime", isActive: true },
      { id: "e2", name: "Bonus", isActive: true },
    ]);

    const result = await fetchListItems<{ id: string; name: string }>("earnings", true);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("e1");
    expect(result[0].name).toBe("Overtime");
    expect(result[1].id).toBe("e2");
    expect(collection).toHaveBeenCalledWith({}, "earnings");
    expect(where).toHaveBeenCalledWith("isActive", "==", true);
    expect(query).toHaveBeenCalled();
  });

  it("should return all items when isActive is false", async () => {
    addMockDocs("earnings", [
      { id: "e1", name: "Overtime", isActive: true },
      { id: "e2", name: "Bonus", isActive: false },
    ]);

    const result = await fetchListItems<{ id: string; name: string }>("earnings", false);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("e1");
    expect(result[1].id).toBe("e2");
    expect(where).not.toHaveBeenCalled();
  });

  it("should return empty array when collection is empty", async () => {
    addMockDocs("deductions", []);

    const result = await fetchListItems<{ id: string }>("deductions");

    expect(result).toEqual([]);
  });

  it("should propagate errors from getDocs", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Unavailable"));

    await expect(fetchListItems("earnings")).rejects.toThrow("Unavailable");
  });
});

describe("updatePayrollDTR", () => {
  beforeEach(() => {
    clearMockDocs();
    vi.clearAllMocks();
  });

  it("should update DTR fields for an existing payroll employee", async () => {
    addMockDocs("payroll_employees", [
      { id: "pe1", payrollId: "payroll-1", nameId: "n1", daysWorked: 0, absences: 0, lateHours: 0, overtimeHours: 0 },
    ]);

    await updatePayrollDTR("payroll-1", "n1", { daysWorked: 20, absences: 1, lateHours: 2, overtimeHours: 3 });

    expect(collection).toHaveBeenCalledWith({}, "payroll_employees");
    expect(where).toHaveBeenCalledWith("payrollId", "==", "payroll-1");
    expect(where).toHaveBeenCalledWith("nameId", "==", "n1");
    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(doc).toHaveBeenCalledWith({}, "payroll_employees", "pe1");
    expect(updateDoc).toHaveBeenCalledWith("payroll_employees/pe1", {
      daysWorked: 20,
      absences: 1,
      lateHours: 2,
      overtimeHours: 3,
    });
  });

  it("should not call updateDoc when no matching payroll employee exists", async () => {
    addMockDocs("payroll_employees", []);

    await updatePayrollDTR("payroll-1", "n1", { daysWorked: 20, absences: 0, lateHours: 0, overtimeHours: 0 });

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it("should propagate errors from getDocs", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Failed to fetch"));

    await expect(
      updatePayrollDTR("payroll-1", "n1", { daysWorked: 20, absences: 0, lateHours: 0, overtimeHours: 0 }),
    ).rejects.toThrow("Failed to fetch");
  });
});

describe("savePayrollEarning", () => {
  beforeEach(() => {
    clearMockDocs();
    vi.clearAllMocks();
  });

  it("should update an existing payroll earning record", async () => {
    addMockDocs("payroll_employees_earnings", [
      { id: "pee1", payrollId: "payroll-1", nameId: "n1", earningId: "e1", amount: 0 },
    ]);

    await savePayrollEarning("payroll-1", "n1", "e1", 1500);

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(doc).toHaveBeenCalledWith({}, "payroll_employees_earnings", "pee1");
    expect(updateDoc).toHaveBeenCalledWith("payroll_employees_earnings/pee1", { amount: 1500 });
    expect(addDoc).not.toHaveBeenCalled();
  });

  it("should create a new payroll earning record when none exists", async () => {
    addMockDocs("payroll_employees_earnings", []);

    await savePayrollEarning("payroll-1", "n1", "e1", 1500);

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(updateDoc).not.toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalledWith("payroll_employees_earnings", {
      payrollId: "payroll-1",
      nameId: "n1",
      earningId: "e1",
      amount: 1500,
      createdAt: expect.any(Date),
    });
    expect(serverTimestamp).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors from getDocs", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Write failed"));

    await expect(savePayrollEarning("payroll-1", "n1", "e1", 500)).rejects.toThrow("Write failed");
  });
});

describe("savePayrollDeduction", () => {
  beforeEach(() => {
    clearMockDocs();
    vi.clearAllMocks();
  });

  it("should update an existing payroll deduction record", async () => {
    addMockDocs("payroll_employees_deductions", [
      { id: "pped1", payrollId: "payroll-1", nameId: "n1", deductionId: "d1", amount: 0 },
    ]);

    await savePayrollDeduction("payroll-1", "n1", "d1", 2000);

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(doc).toHaveBeenCalledWith({}, "payroll_employees_deductions", "pped1");
    expect(updateDoc).toHaveBeenCalledWith("payroll_employees_deductions/pped1", { amount: 2000 });
    expect(addDoc).not.toHaveBeenCalled();
  });

  it("should create a new payroll deduction record when none exists", async () => {
    addMockDocs("payroll_employees_deductions", []);

    await savePayrollDeduction("payroll-1", "n1", "d1", 2000);

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(updateDoc).not.toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalledWith("payroll_employees_deductions", {
      payrollId: "payroll-1",
      nameId: "n1",
      deductionId: "d1",
      amount: 2000,
      createdAt: expect.any(Date),
    });
    expect(serverTimestamp).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors from getDocs", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Write failed"));

    await expect(savePayrollDeduction("payroll-1", "n1", "d1", 500)).rejects.toThrow("Write failed");
  });
});

describe("savePayrollBenefit", () => {
  beforeEach(() => {
    clearMockDocs();
    vi.clearAllMocks();
  });

  it("should update an existing payroll benefit record", async () => {
    addMockDocs("payroll_employees_benefits", [
      { id: "ppeb1", payrollId: "payroll-1", nameId: "n1", benefitId: "b1", employeeShare: 0, employerShare: 0 },
    ]);

    await savePayrollBenefit("payroll-1", "n1", "b1", 500, 500);

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(doc).toHaveBeenCalledWith({}, "payroll_employees_benefits", "ppeb1");
    expect(updateDoc).toHaveBeenCalledWith("payroll_employees_benefits/ppeb1", {
      employeeShare: 500,
      employerShare: 500,
    });
    expect(addDoc).not.toHaveBeenCalled();
  });

  it("should create a new payroll benefit record when none exists", async () => {
    addMockDocs("payroll_employees_benefits", []);

    await savePayrollBenefit("payroll-1", "n1", "b1", 500, 500);

    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(updateDoc).not.toHaveBeenCalled();
    expect(addDoc).toHaveBeenCalledWith("payroll_employees_benefits", {
      payrollId: "payroll-1",
      nameId: "n1",
      benefitId: "b1",
      employeeShare: 500,
      employerShare: 500,
      createdAt: expect.any(Date),
    });
    expect(serverTimestamp).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors from getDocs", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Write failed"));

    await expect(savePayrollBenefit("payroll-1", "n1", "b1", 300, 300)).rejects.toThrow("Write failed");
  });
});
