export interface EarningsDeductionsFilter {
  companyId: string;
  dateFrom: string;
  dateTo: string;
  type: "earnings" | "deductions" | "all";
}

export interface EarningsDeductionsRow {
  code: string;
  description: string;
  type: "earnings" | "deductions";
  totalAmount: number;
  employeeCount: number;
}

export interface BenefitSummary {
  id: string;
  name: string;
  type: string;
  totalAmount: number;
  [key: string]: unknown;
}
