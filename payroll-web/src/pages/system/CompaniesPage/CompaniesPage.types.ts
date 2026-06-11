export interface PayrollPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
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
