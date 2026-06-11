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
