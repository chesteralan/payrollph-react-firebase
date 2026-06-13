import type { EmployeeArea as EA, EmployeeGroup as EG, EmployeePosition as EP, EmployeeStatus as ES } from "@/types/employee";

export type EmployeeGroup = EG;
export type EmployeePosition = EP;
export type EmployeeArea = EA;
export type EmployeeStatus = ES;

export interface PayrollTemplate {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  isActive: boolean;
  pages?: number;
  printFormat?: string;
  groupBy?: string;
  earnings?: string[];
  deductions?: string[];
  benefits?: string[];
  printColumns?: string[];
  createdAt: Date;
  updatedAt: Date;
  groups?: EmployeeGroup[];
}

export interface PrintFormat {
  id: string;
  name: string;
  outputType: string;
  isActive?: boolean;
  paperSize: string;
  orientation: string;
  [key: string]: unknown;
}

export interface SelectionItem {
  id: string;
  label: string;
}

export interface TemplatesPageFilters {
  search: string;
  companyId: string;
}
