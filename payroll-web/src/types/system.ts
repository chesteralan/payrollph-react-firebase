export interface AuditRecord {
  id: string
  userId: string
  action: string
  module: string
  description: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface CalendarEntry {
  id: string
  companyId: string
  date: Date
  type: 'holiday' | 'special' | 'workday'
  name: string
}

export interface Term {
  id: string
  name: string
  description?: string
  type: 'semi-monthly' | 'monthly' | 'bi-weekly' | 'weekly'
  frequency: string
  daysPerPeriod: number
  isActive: boolean
  cutOff1?: number
  cutOff2?: number
  validateOnCreate?: boolean
}
