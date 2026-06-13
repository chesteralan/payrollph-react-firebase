export interface BenefitsUtilizationFilter {
  companyId: string;
  year: number;
  benefitId?: string;
}

export interface BenefitsUtilizationRow {
  benefitId: string;
  benefitName: string;
  totalAllocated: number;
  totalUsed: number;
  utilizationRate: number;
  employeeCount: number;
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

export interface BenefitSummary {
  benefitId: string;
  benefitName: string;
  employeeCount: number;
  totalEmployeeShare: number;
  totalEmployerShare: number;
  totalCost: number;
  employees: BenefitEmployeeDetail[];
}
