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
