export interface Payroll {
  id: string
  companyId: string
  templateId?: string
  name: string
  status: 'draft' | 'locked' | 'published'
  periodStart: Date
  periodEnd: Date
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface PayrollInclusiveDate {
  id: string
  payrollId: string
  date: Date
}

export interface PayrollGroup {
  id: string
  payrollId: string
  name: string
  employeeIds: string[]
}

export interface PayrollEmployee {
  id: string
  payrollId: string
  employeeId: string
  status: string
  groupId?: string
  positionId?: string
  areaId?: string
  printGroup?: string
  payslipTemplate?: string
  basicSalary: number
  grossPay: number
  netPay: number
}

export interface PayrollDTR {
  id: string
  payrollEmployeeId: string
  date: Date
  timeIn?: string
  timeOut?: string
  hoursWorked: number
  overtimeHours: number
  absences: number
  lateHours: number
  undertimeHours: number
}

export interface PayrollEarning {
  id: string
  payrollEmployeeId: string
  earningId: string
  name: string
  amount: number
}

export interface PayrollDeduction {
  id: string
  payrollEmployeeId: string
  deductionId: string
  name: string
  amount: number
}

export interface PayrollBenefit {
  id: string
  payrollEmployeeId: string
  benefitId: string
  name: string
  amount: number
}

export interface PayrollPrintColumn {
  id: string
  companyId?: string
  payrollId?: string
  label: string
  field: string
  order: number
  isVisible: boolean
}

export type PayrollTemplate = Omit<Payroll, 'templateId'> & {
  isTemplate: true
  earnings: string[]
  deductions: string[]
  benefits: string[]
  columns: PayrollPrintColumn[]
}
