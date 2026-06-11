export interface PayrollSummary {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  employeeCount: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
}

export interface GroupSummary {
  groupName: string;
  employeeCount: number;
  totalGrossPay: number;
  totalNetPay: number;
}

export interface PayrollSummaryFilter {
  companyId: string;
  dateFrom: string;
  dateTo: string;
  groupId?: string;
}

export interface PayrollSummaryData {
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  employeeCount: number;
}
