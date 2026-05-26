export interface BenefitSummary {
  benefitId: string;
  benefitName: string;
  employeeCount: number;
  totalEmployeeShare: number;
  totalEmployerShare: number;
  totalCost: number;
  employees: BenefitEmployeeDetail[];
}

export interface BenefitEmployeeDetail {
  employeeName: string;
  nameId: string;
  groupName: string;
  employeeShare: number;
  employerShare: number;
  payrollName: string;
  period: string;
}
