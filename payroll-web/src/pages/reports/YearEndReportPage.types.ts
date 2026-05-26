export interface YearEndSummary {
  employeeName: string;
  nameId: string;
  totalGrossPay: number;
  totalNetPay: number;
  totalBasicSalary: number;
  totalEarnings: number;
  totalBenefits: number;
  totalDeductions: number;
  total13thMonth: number;
  payrollRuns: number;
}

export interface YearEndTotals {
  totalGrossPay: number;
  totalNetPay: number;
  totalBasicSalary: number;
  totalEarnings: number;
  totalBenefits: number;
  totalDeductions: number;
  total13thMonth: number;
  totalEmployees: number;
  totalPayrollRuns: number;
}
