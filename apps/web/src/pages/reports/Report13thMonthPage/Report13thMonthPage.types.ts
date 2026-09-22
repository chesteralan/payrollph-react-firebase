export interface Employee13thMonth {
  employeeId?: string;
  employeeCode: string;
  employeeName?: string;
  firstName: string;
  lastName: string;
  hireDate: Date | null;
  basicSalary?: number;
  totalBasicSalary: number;
  monthsWorked: number;
  proRataAmount?: number;
  thirteenthMonth: number;
}

export interface PayrollOption {
  id: string;
  name: string;
}

export interface EmployeeDoc {
  id: string;
  nameId: string;
  companyId: string;
  isActive: boolean;
  employeeCode: string;
  hireDate?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export interface PayrollDoc {
  id: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  month?: number;
  totalBasic?: number;
  employees?: Array<{ nameId: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface ThirteenMonthReportFilter {
  year: number;
  companyId: string;
  employeeId?: string;
}
