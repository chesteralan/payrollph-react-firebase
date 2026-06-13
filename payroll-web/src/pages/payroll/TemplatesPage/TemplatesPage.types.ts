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
  createdAt: Date;
  updatedAt: Date;
  groups?: EmployeeGroup[];
}

export interface PrintFormat {
  id: string;
  name: string;
  outputFormat: string;
  paperSize: string;
  orientation: string;
  [key: string]: unknown;
}

export interface TemplatesPageFilters {
  search: string;
  companyId: string;
}
