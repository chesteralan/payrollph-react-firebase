export interface PayrollPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  type?: "monthly" | "semi-monthly" | "bi-weekly" | "weekly";
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

export interface CompaniesPageFormData {
  name: string;
  code: string;
  address?: string;
  city?: string;
  province?: string;
  zipCode?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
}

export interface CompaniesPageFilters {
  search: string;
  status: "all" | "active" | "inactive";
}
