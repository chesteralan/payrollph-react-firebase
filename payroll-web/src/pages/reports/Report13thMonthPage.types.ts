export interface Employee13thMonth {
  employeeCode: string;
  firstName: string;
  lastName: string;
  hireDate: Date | null;
  totalBasicSalary: number;
  monthsWorked: number;
  thirteenthMonth: number;
}

export interface EmployeeDoc {
  id: string;
  employeeCode: string;
  nameId: string;
  firstName?: string;
  lastName?: string;
  hireDate?: Date;
}

export interface PayrollDoc {
  id: string;
  month: number;
  year: number;
  employees?: { nameId: string }[];
  totalBasic?: number;
}
