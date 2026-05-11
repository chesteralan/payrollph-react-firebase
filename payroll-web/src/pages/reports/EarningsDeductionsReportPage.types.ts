export interface EarningTypeSummary {
  earningId: string;
  name: string;
  totalAmount: number;
  employeeCount: number;
}

export interface DeductionTypeSummary {
  deductionId: string;
  name: string;
  totalAmount: number;
  employeeCount: number;
}

export interface BenefitSummary {
  benefitId: string;
  name: string;
  totalEE: number;
  totalER: number;
  employeeCount: number;
}

export interface EmployeeBreakdown {
  nameId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  groupName: string;
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  benefits: { name: string; eeShare: number; erShare: number }[];
  totalEarnings: number;
  totalDeductions: number;
  totalBenefits: number;
}

export interface PayrollOption {
  id: string;
  name: string;
}
