export interface YearEndTotals {
  totalBasicSalary: number;
  totalEarnings: number;
  total13thMonth: number;
  totalTaxWithheld: number;
  totalDeductions: number;
  totalNetPay: number;
}

export interface YearEndSummary {
  employeeName: string;
  payrollRuns: number;
  totalBasicSalary: number;
  totalEarnings: number;
  total13thMonth: number;
}

export interface YearEndReportFilter {
  year: number;
  companyId: string;
  employeeId?: string;
}
