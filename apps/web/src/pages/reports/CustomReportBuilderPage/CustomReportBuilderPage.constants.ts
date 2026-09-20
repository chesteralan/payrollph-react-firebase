import type { ReportField } from "./CustomReportBuilderPage.types";

export const AVAILABLE_FIELDS: ReportField[] = [
  // Employee fields
  {
    id: "emp_code",
    label: "Employee Code",
    category: "employee",
    type: "string",
    enabled: true,
  },
  {
    id: "emp_name",
    label: "Employee Name",
    category: "employee",
    type: "string",
    enabled: true,
  },
  {
    id: "emp_group",
    label: "Group",
    category: "employee",
    type: "string",
    enabled: false,
  },
  {
    id: "emp_position",
    label: "Position",
    category: "employee",
    type: "string",
    enabled: false,
  },
  {
    id: "emp_area",
    label: "Area",
    category: "employee",
    type: "string",
    enabled: false,
  },

  // Payroll fields
  {
    id: "payroll_name",
    label: "Payroll",
    category: "payroll",
    type: "string",
    enabled: true,
  },
  {
    id: "payroll_period",
    label: "Period",
    category: "payroll",
    type: "string",
    enabled: false,
  },
  {
    id: "days_worked",
    label: "Days Worked",
    category: "payroll",
    type: "number",
    enabled: false,
  },
  {
    id: "absences",
    label: "Absences",
    category: "payroll",
    type: "number",
    enabled: false,
  },
  {
    id: "late_hours",
    label: "Late Hours",
    category: "payroll",
    type: "number",
    enabled: false,
  },
  {
    id: "overtime_hours",
    label: "Overtime",
    category: "payroll",
    type: "number",
    enabled: false,
  },

  // Earnings
  {
    id: "basic_salary",
    label: "Basic Salary",
    category: "earnings",
    type: "number",
    enabled: true,
  },
  {
    id: "gross_pay",
    label: "Gross Pay",
    category: "earnings",
    type: "number",
    enabled: true,
  },

  // Deductions
  {
    id: "total_deductions",
    label: "Total Deductions",
    category: "deductions",
    type: "number",
    enabled: false,
  },

  // Benefits
  {
    id: "employee_benefits",
    label: "EE Benefits",
    category: "benefits",
    type: "number",
    enabled: false,
  },
  {
    id: "employer_benefits",
    label: "ER Benefits",
    category: "benefits",
    type: "number",
    enabled: false,
  },

  // Summary
  {
    id: "net_pay",
    label: "Net Pay",
    category: "payroll",
    type: "number",
    enabled: true,
  },
];

export const CATEGORIES = [
  "employee",
  "payroll",
  "earnings",
  "deductions",
  "benefits",
] as const;

export type ReportCategory = (typeof CATEGORIES)[number];
