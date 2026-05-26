import type { Employee, EmployeeContact } from "../../types";

export interface EmployeeReportData extends Employee {
  name?: string;
  groupName?: string;
  positionName?: string;
  areaName?: string;
  statusName?: string;
  salary?: number;
  salaryFrequency?: string;
  contacts?: EmployeeContact[];
  profile?: EmployeeProfile;
}
