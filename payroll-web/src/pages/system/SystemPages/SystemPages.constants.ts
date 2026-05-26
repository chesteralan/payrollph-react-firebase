import type { Department, Section } from "../../types";

export const DEPARTMENTS: { key: Department; sections: Section[] }[] = [
  { key: "payroll", sections: ["payroll", "templates"] },
  {
    key: "employees",
    sections: ["employees", "calendar", "groups", "positions", "areas"],
  },
  { key: "lists", sections: ["names", "benefits", "earnings", "deductions"] },
  { key: "reports", sections: ["13month"] },
  {
    key: "system",
    sections: ["companies", "terms", "calendar", "users", "audit", "database"],
  },
];

export const COLLECTIONS = [
  "names",
  "employees",
  "employee_groups",
  "employee_positions",
  "employee_areas",
  "employee_statuses",
  "earnings",
  "deductions",
  "benefits",
  "payroll",
  "payroll_templates",
  "payroll_inclusive_dates",
  "payroll_groups",
  "payroll_employees",
  "salaries",
  "dtr_entries",
  "holidays",
  "users",
  "companies",
];
