import type { Employee, EmployeeContact, EmployeeProfile } from "@/types";

export interface EmployeeReportFilter {
  companyId: string;
  dateFrom: string;
  dateTo: string;
  employeeId?: string;
  groupId?: string;
}

export interface EmployeeReportRow {
  employeeId: string;
  employeeName: string;
  basicPay: number;
  overtimePay: number;
  deductions: number;
  netPay: number;
}

export interface EmployeeReportSummary {
  totalBasicPay: number;
  totalOvertimePay: number;
  totalDeductions: number;
  totalNetPay: number;
  employeeCount: number;
}

export interface EmployeeReportData extends Employee {
  name: string;
  groupName?: string;
  positionName?: string;
  areaName?: string;
  statusName?: string;
  salary?: number;
  salaryFrequency?: string;
  contacts: EmployeeContact[];
  profile?: EmployeeProfile;
}
