export interface ProcessingRow {
  nameId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  groupId: string;
  positionId: string;
  areaId: string;
  daysWorked: number;
  absences: number;
  lateHours: number;
  overtimeHours: number;
  basicSalary: number;
  ratePerDay: number;
  salaryAmount: number;
}

export interface CompanyInfo {
  name: string;
  address?: string;
  tin?: string;
  printHeader?: string;
  printFooter?: string;
}

export interface OutputViewProps {
  payroll: {
    name: string;
    month: number;
    year: number;
    isLocked: boolean;
  };
  company?: CompanyInfo;
  rows: ProcessingRow[];
  earningData: Map<string, Map<string, number>>;
  deductionData: Map<string, Map<string, number>>;
  benefitData: Map<string, Map<string, { employeeShare: number; employerShare: number }>>;
  earningsList: { id: string; name: string }[];
  deductionsList: { id: string; name: string }[];
  benefitsList: { id: string; name: string }[];
}

export type OutputMode = "register" | "payslip" | "transmittal" | "journal" | "denomination";
