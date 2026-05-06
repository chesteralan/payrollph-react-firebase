export interface Company {
  id: string
  name: string
  address?: string
  tin?: string
  isActive: boolean
  isDeleted?: boolean
  deletedAt?: Date | null
  printHeader?: string
  printFooter?: string
  printCss?: string
  defaultWorkdays?: number
  currency?: string
  createdAt: Date
  updatedAt: Date
}

export interface CompanyPeriod {
  id: string
  companyId: string
  type: 'monthly' | 'semi-monthly' | 'weekly' | 'bi-weekly'
  payDay: number
}

export interface CompanyOptions {
  id: string
  companyId: string
  columnGroup: {
    dtr: boolean
    salaries: boolean
    earnings: boolean
    benefits: boolean
    deductions: boolean
  }
  workDays: number[]
  printGroup?: string
  payslipTemplate?: string
}
