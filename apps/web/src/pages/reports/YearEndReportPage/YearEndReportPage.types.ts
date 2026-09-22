export interface YearEndTotals {
  totalBasicSalary: number;
  totalEarnings: number;
  total13thMonth: number;
  totalTaxWithheld: number;
  totalDeductions: number;
  totalNetPay: number;
  totalGrossPay: number;
  totalBenefits: number;
  totalPayrollRuns: number;
  totalEmployees: number;
}

export interface YearEndSummary {
  nameId: string;
  employeeName: string;
  payrollRuns: number;
  totalBasicSalary: number;
  totalEarnings: number;
  total13thMonth: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalBenefits: number;
  totalDeductions: number;
}

export interface YearEndReportFilter {
  year: number;
  companyId: string;
  employeeId?: string;
}
