export interface Payroll {
  id: string
  companyId: string
  templateId?: string
  name: string
  month: number
  year: number
  status: 'draft' | 'locked' | 'published'
  isActive: boolean
  isLocked: boolean
  printFormat?: string
  groupBy?: string
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
  groupId?: string
  areaId?: string
  positionId?: string
  statusId?: string
  order: number
  page: number
}

export interface PayrollEmployee {
  id: string
  payrollId: string
  nameId: string
  orderId: number
  isActive: boolean
  statusId?: string
  groupId?: string
  areaId?: string
  positionId?: string
  printGroup?: string
  payslipTemplate?: string
  daysWorked: number
  absences: number
  lateHours: number
  overtimeHours: number
  basicSalary: number
  grossPay: number
  netPay: number
}

export interface PayrollEmployeeSalary {
  id: string
  payrollId: string
  nameId: string
  salaryId: string
  amount: number
  ratePer: string
  days: number
  annualDays: number
  months: number
}

export interface PayrollEmployeeEarning {
  id: string
  payrollId: string
  nameId: string
  earningId: string
  entryId: string
  amount: number
  notes?: string
  isManual: boolean
}

export interface PayrollEmployeeDeduction {
  id: string
  payrollId: string
  nameId: string
  deductionId: string
  entryId: string
  amount: number
  maxAmount?: number
  notes?: string
  isManual: boolean
}

export interface PayrollEmployeeBenefit {
  id: string
  payrollId: string
  nameId: string
  benefitId: string
  entryId: string
  employeeShare: number
  employerShare: number
  notes?: string
}

export interface PayrollPrintColumn {
  id: string
  payrollId: string
  termId: string
  columnId: string
  order: number
}

export interface PayrollMeta {
  id: string
  payrollId: string
  key: string
  value: string
}

export interface PayrollEarning {
  id: string
  payrollId: string
  earningId: string
  order: number
}

export interface PayrollDeduction {
  id: string
  payrollId: string
  deductionId: string
  order: number
}

export interface PayrollBenefit {
  id: string
  payrollId: string
  benefitId: string
  order: number
}

export interface PayrollTemplate {
  id: string
  companyId: string
  name: string
  pages: number
  checkedBy?: string
  approvedBy?: string
  printFormat?: string
  groupBy?: string
  isActive: boolean
}

export interface PayrollTemplateGroup {
  id: string
  templateId: string
  groupId?: string
  areaId?: string
  positionId?: string
  statusId?: string
  order: number
  page: number
}

export interface PayrollTemplateEmployee {
  id: string
  templateId: string
  nameId: string
  order: number
  isActive: boolean
  statusId?: string
  groupId?: string
  areaId?: string
  positionId?: string
  printGroup?: string
  payslipTemplate?: string
}
