import { z } from "zod";

// ─── Payroll document schema ─────────────────────────────────────────
export const PayrollSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  templateId: z.string().optional(),
  termId: z.string().optional(),
  name: z.string().min(1, "Payroll name is required"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  status: z.enum(["draft", "locked", "published"]),
  isActive: z.boolean(),
  isLocked: z.boolean(),
  isPublished: z.boolean().optional(),
  publishedAt: z.coerce.date().optional(),
  printFormat: z.string().optional(),
  groupBy: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdBy: z.string(),
});

export type ValidatedPayroll = z.infer<typeof PayrollSchema>;

// ─── PayrollEmployee document schema ─────────────────────────────────
export const PayrollEmployeeSchema = z.object({
  id: z.string(),
  payrollId: z.string(),
  nameId: z.string(),
  orderId: z.number().int(),
  isActive: z.boolean(),
  statusId: z.string().optional(),
  groupId: z.string().optional(),
  areaId: z.string().optional(),
  positionId: z.string().optional(),
  printGroup: z.string().optional(),
  payslipTemplate: z.string().optional(),
  daysWorked: z.number(),
  absences: z.number(),
  lateHours: z.number(),
  overtimeHours: z.number(),
  basicSalary: z.number(),
  grossPay: z.number(),
  netPay: z.number(),
});

export type ValidatedPayrollEmployee = z.infer<typeof PayrollEmployeeSchema>;

// ─── Employee document schema ────────────────────────────────────────
export const EmployeeSchema = z.object({
  id: z.string(),
  nameId: z.string(),
  companyId: z.string(),
  groupId: z.string().optional(),
  positionId: z.string().optional(),
  areaId: z.string().optional(),
  statusId: z.string(),
  employeeCode: z.string(),
  isActive: z.boolean(),
  hireDate: z.coerce.date().optional(),
  regularizationDate: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ValidatedEmployee = z.infer<typeof EmployeeSchema>;

// ─── CalendarEvent document schema ───────────────────────────────────
export const CalendarEventSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  title: z.string().min(1, "Event title is required"),
  date: z.coerce.date(),
  type: z.enum(["regular_holiday", "special_holiday", "event", "deadline"]).optional(),
  description: z.string().optional(),
  recurring: z.boolean().optional(),
  createdBy: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type ValidatedCalendarEvent = z.infer<typeof CalendarEventSchema>;

// ─── Map of collection name to Zod schema for runtime validation ─────
export const COLLECTION_SCHEMAS = {
  payroll: PayrollSchema,
  payroll_employees: PayrollEmployeeSchema,
  employees: EmployeeSchema,
  calendar: CalendarEventSchema,
} as const;

export type ValidatedCollection = keyof typeof COLLECTION_SCHEMAS;

// ─── Validation error, structured for consumer handling ──────────────
export interface ValidationFailure {
  collection: string;
  documentId: string;
  errors: z.ZodError;
}
