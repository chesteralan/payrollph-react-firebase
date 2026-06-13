export interface PayrollSummary {
  id: string;
  name: string;
  month: number;
  year: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  employeeCount: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  grossPay: number;
  netPay: number;
  groups: GroupSummary[];
}

export interface GroupSummary {
  groupId?: string;
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
