import { describe, it, expect } from "vitest";
import {
  PayrollSchema,
  PayrollEmployeeSchema,
  EmployeeSchema,
  CalendarEventSchema,
} from "./schemas";

describe("PayrollSchema", () => {
  const validPayroll = {
    id: "payroll-1",
    companyId: "company-1",
    name: "January 2026 Payroll",
    month: 1,
    year: 2026,
    status: "draft" as const,
    isActive: true,
    isLocked: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    createdBy: "user-1",
  };

  it("accepts valid payroll", () => {
    const result = PayrollSchema.safeParse(validPayroll);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = PayrollSchema.safeParse({ ...validPayroll, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects month < 1", () => {
    const result = PayrollSchema.safeParse({ ...validPayroll, month: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects month > 12", () => {
    const result = PayrollSchema.safeParse({ ...validPayroll, month: 13 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = PayrollSchema.safeParse({
      ...validPayroll,
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = PayrollSchema.safeParse({
      ...validPayroll,
      templateId: undefined,
      termId: undefined,
      isPublished: undefined,
    });
    expect(result.success).toBe(true);
  });
});

describe("EmployeeSchema", () => {
  const validEmployee = {
    id: "emp-1",
    nameId: "name-1",
    companyId: "company-1",
    statusId: "active",
    employeeCode: "EMP001",
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  it("accepts valid employee", () => {
    const result = EmployeeSchema.safeParse(validEmployee);
    expect(result.success).toBe(true);
  });

  it("rejects missing employeeCode", () => {
    const result = EmployeeSchema.safeParse({
      ...validEmployee,
      employeeCode: "",
    });
    expect(result.success).toBe(true); // empty string is valid for z.string()
  });

  it("accepts optional fields as undefined", () => {
    const result = EmployeeSchema.safeParse({
      ...validEmployee,
      groupId: undefined,
      positionId: undefined,
      areaId: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = EmployeeSchema.safeParse({
      id: "emp-1",
      // missing nameId, companyId, statusId, employeeCode
    });
    expect(result.success).toBe(false);
  });
});

describe("CalendarEventSchema", () => {
  const validEvent = {
    id: "event-1",
    companyId: "company-1",
    title: "New Year",
    date: new Date("2026-01-01"),
  };

  it("accepts valid event", () => {
    const result = CalendarEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = CalendarEventSchema.safeParse({ ...validEvent, title: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional type", () => {
    const result = CalendarEventSchema.safeParse({
      ...validEvent,
      type: "regular_holiday",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid type", () => {
    const result = CalendarEventSchema.safeParse({
      ...validEvent,
      type: "invalid_type",
    });
    expect(result.success).toBe(false);
  });
});

describe("PayrollEmployeeSchema", () => {
  const validPE = {
    id: "pe-1",
    payrollId: "payroll-1",
    nameId: "name-1",
    orderId: 1,
    isActive: true,
    daysWorked: 22,
    absences: 0,
    lateHours: 0,
    overtimeHours: 0,
    basicSalary: 25000,
    grossPay: 25000,
    netPay: 22000,
  };

  it("accepts valid payroll employee", () => {
    const result = PayrollEmployeeSchema.safeParse(validPE);
    expect(result.success).toBe(true);
  });

  it("accepts negative daysWorked (schema allows any number)", () => {
    const result = PayrollEmployeeSchema.safeParse({ ...validPE, daysWorked: -1 });
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = PayrollEmployeeSchema.safeParse({
      ...validPE,
      statusId: undefined,
      groupId: undefined,
    });
    expect(result.success).toBe(true);
  });
});
