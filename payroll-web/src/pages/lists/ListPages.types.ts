export interface DeductionItem {
  id: string;
  name: string;
  description?: string;
  type: "fixed" | "percentage";
  ruleValue?: number;
  isActive: boolean;
}

export interface EarningItem {
  id: string;
  name: string;
  description?: string;
  formulaType: "fixed" | "percentage" | "per_hour" | "per_day" | "custom";
  formulaValue?: number;
  formulaExpression?: string;
  isActive: boolean;
}

export interface BenefitItem {
  id: string;
  name: string;
  description?: string;
  allocationType: "fixed" | "percentage_of_salary" | "percentage_of_basic" | "tiered";
  allocationValue?: number;
  employeeShareType: "fixed" | "percentage";
  employeeShareValue?: number;
  employerShareType: "fixed" | "percentage";
  employerShareValue?: number;
  isActive: boolean;
}
