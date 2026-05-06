export interface UserAccount {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserRestriction {
  id: string
  userId: string
  department: string
  section: string
  canView: boolean
  canAdd: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface UserCompany {
  id: string
  userId: string
  companyId: string
  isPrimary: boolean
}

export interface UserSettings {
  id: string
  userId: string
  theme: 'light' | 'dark'
  itemsPerPage: number
  defaultCompanyId?: string
}

export type Department =
  | 'payroll'
  | 'employees'
  | 'lists'
  | 'reports'
  | 'system'

export type Section =
  | 'payroll'
  | 'templates'
  | 'employees'
  | 'calendar'
  | 'groups'
  | 'positions'
  | 'areas'
  | 'names'
  | 'benefits'
  | 'earnings'
  | 'deductions'
  | '13month'
  | 'companies'
  | 'terms'
  | 'users'
  | 'audit'
  | 'database'
