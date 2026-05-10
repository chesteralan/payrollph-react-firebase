export interface PayrollGroup {
  id: string;
  name: string;
  companyId: string;
  isActive: boolean;
}

export interface PayrollTemplate {
  id: string;
  name: string;
  companyId: string;
  isActive: boolean;
  // Add other relevant fields as needed
}

export interface EmployeeGroup {
  id: string;
  name: string;
  companyId: string;
  isActive: boolean;
}

export interface EmployeePosition {
  id: string;
  name: string;
  companyId: string;
  isActive: boolean;
}

export interface EmployeeArea {
  id: string;
  name: string;
  companyId: string;
  isActive: boolean;
}

export interface EmployeeStatus {
  id: string;
  name: string;
  companyId: string;
  isActive: boolean;
}

export interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  companyId: string;
  isActive: boolean;
}
