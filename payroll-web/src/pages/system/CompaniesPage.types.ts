export interface PayrollPeriod {
  type: "monthly" | "semi-monthly" | "bi-weekly" | "weekly";
  cutOff1Day?: number;
  cutOff2Day?: number;
  payDay?: number;
  frequency?: string;
}

export interface CompanyColumnGroup {
  dtr: boolean;
  salaries: boolean;
  earnings: boolean;
  benefits: boolean;
  deductions: boolean;
}
