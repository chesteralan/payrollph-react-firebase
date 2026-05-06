export interface EarningItem {
  id: string
  name: string
  description?: string
  isTaxable: boolean
  isActive: boolean
}

export interface DeductionItem {
  id: string
  name: string
  description?: string
  type: 'fixed' | 'percentage'
  isActive: boolean
}

export interface BenefitItem {
  id: string
  name: string
  description?: string
  isActive: boolean
}

export interface TermItem {
  id: string
  name: string
  description?: string
  isActive: boolean
}

export interface EmployeeEarning {
  id: string
  employeeId: string
  earningId: string
  amount: number
  isPrimary: boolean
  isActive: boolean
  templateId?: string
}

export interface EmployeeDeduction {
  id: string
  employeeId: string
  deductionId: string
  amount: number
  isActive: boolean
  templateId?: string
}

export interface EmployeeBenefit {
  id: string
  employeeId: string
  benefitId: string
  amount: number
  isActive: boolean
  templateId?: string
}

export interface EmployeeSalary {
  id: string
  employeeId: string
  amount: number
  frequency: 'monthly' | 'semi-monthly' | 'weekly' | 'daily'
  isPrimary: boolean
  effectiveDate: Date
  isActive: boolean
}
