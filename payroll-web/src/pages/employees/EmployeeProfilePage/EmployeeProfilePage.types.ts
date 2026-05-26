export interface Employee {
  id: string;
  employeeCode: string;
  employeeCode?: string;
  groupId?: string;
  positionId?: string;
  areaId?: string;
  statusId?: string;
  hireDate?: string | Date;
  regularizationDate?: string | Date;
  nameId?: string;
}

export interface EmployeeContact {
  id: string;
  employeeId: string;
  type: "phone" | "email" | "address";
  value: string;
  isPrimary: boolean;
}

export interface EmployeeProfile {
  id: string;
  employeeId: string;
  nameId?: string;
  sss?: string;
  tin?: string;
  philhealth?: string;
  hdmf?: string;
  bankName?: string;
  bankAccount?: string;
  dateOfBirth?: string | Date | null;
  gender?: "male" | "female" | "";
  civilStatus?: "single" | "married" | "widowed" | "separated" | "";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmployeeSalary {
  id: string;
  employeeId: string;
  amount: number;
  frequency: "monthly" | "semi-monthly" | "weekly" | "daily";
  effectiveDate: string | Date;
  isPrimary?: boolean;
  isActive?: boolean;
  createdAt?: Date;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  storagePath?: string;
  uploadedAt: string | Date;
  category: DocumentCategory;
  notes?: string | null;
}

export type DocumentCategory =
  | "ID"
  | "Contract"
  | "Tax Form"
  | "Medical"
  | "Certificate"
  | "Other";

export type ProfileTab =
  | "info"
  | "contact"
  | "compensation"
  | "dtr"
  | "documents";

export interface SelectOption {
  id: string;
  name: string;
}
