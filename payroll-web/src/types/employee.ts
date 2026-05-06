export interface NameRecord {
  id: string
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  createdAt: Date
  updatedAt: Date
}

export interface Employee {
  id: string
  nameId: string
  companyId: string
  groupId?: string
  positionId?: string
  areaId?: string
  statusId: string
  employeeCode: string
  isActive: boolean
  hireDate?: Date
  regularizationDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface EmployeeContact {
  id: string
  employeeId: string
  type: 'phone' | 'email' | 'address'
  value: string
  isPrimary: boolean
}

export interface EmployeeGroup {
  id: string
  name: string
  description?: string
  isActive: boolean
}

export interface EmployeePosition {
  id: string
  name: string
  department?: string
  isActive: boolean
}

export interface EmployeeArea {
  id: string
  name: string
  description?: string
  isActive: boolean
}

export interface EmployeeStatus {
  id: string
  name: string
  isActive: boolean
}

export interface EmployeeProfile {
  id: string
  nameId: string
  sss?: string
  tin?: string
  philhealth?: string
  hdmf?: string
  bankName?: string
  bankAccount?: string
  dateOfBirth?: Date
  gender?: 'male' | 'female'
  civilStatus?: 'single' | 'married' | 'widowed' | 'separated'
}

export type DocumentCategory = 'ID' | 'Contract' | 'Tax Form' | 'Medical' | 'Certificate' | 'Other'

export interface EmployeeDocument {
  id: string
  employeeId: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  storagePath: string
  uploadedAt: Date
  uploadedBy?: string
  category: DocumentCategory
  notes?: string
}
