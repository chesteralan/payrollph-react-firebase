export interface Employee13thMonth {
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  monthsWorked: number;
  proRataAmount: number;
}

export interface EmployeeDoc {
  id: string;
  nameId: string;
  companyId: string;
  isActive: boolean;
  employeeCode: string;
  [key: string]: unknown;
}

export interface PayrollDoc {
  id: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  [key: string]: unknown;
}

export interface ThirteenMonthReportFilter {
  year: number;
  companyId: string;
  employeeId?: string;
}
