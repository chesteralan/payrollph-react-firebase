export interface Payroll {
  id: string;
  companyId: string;
  name: string;
  status: "draft" | "processing" | "completed" | "cancelled" | "published";
  isLocked: boolean;
  month: number;
  year: number;
  printFormat?: string;
  groupBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollRun {
  id: string;
  companyId: string;
  name: string;
  status: "draft" | "processing" | "completed" | "cancelled" | "published";
  isLocked: boolean;
  month: number;
  year: number;
  printFormat?: string;
  groupBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollRunsPageFilters {
  search: string;
  status: string;
  companyId: string;
}
