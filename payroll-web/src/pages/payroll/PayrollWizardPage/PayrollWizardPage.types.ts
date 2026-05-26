export interface PayrollGroup {
  id: string;
  payrollId: string;
  groupId: string;
  positionId: string;
  areaId: string;
  statusId: string;
  order: number;
  page: number;
}

export interface PayrollTemplate {
  name: string;
  groupBy?: string;
  [key: string]: unknown;
}

export interface EmployeeGroup {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface EmployeePosition {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface EmployeeArea {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface EmployeeStatus {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface Term {
  id: string;
  name: string;
  type: 'monthly' | 'semi-monthly' | 'weekly' | 'bi-weekly';
  daysPerPeriod?: number;
  isActive?: boolean;
  [key: string]: unknown;
}
