export interface Payroll {
  id: string;
  companyId: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "processing" | "completed" | "cancelled";
  employeeCount: number;
  totalGrossPay: number;
  totalNetPay: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollRun {
  id: string;
  companyId: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "processing" | "completed" | "cancelled";
  employeeCount: number;
  totalGrossPay: number;
  totalNetPay: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollRunsPageFilters {
  search: string;
  status: string;
  companyId: string;
}
