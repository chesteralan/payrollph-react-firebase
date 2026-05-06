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
