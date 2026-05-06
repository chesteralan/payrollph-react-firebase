export interface AttendanceRecord {
  id: string
  employeeId: string
  date: Date
  timeIn?: string
  timeOut?: string
  hoursWorked: number
}

export interface AbsenceRecord {
  id: string
  employeeId: string
  date: Date
  type: 'absent' | 'late' | 'undertime'
  hours: number
  reason?: string
}

export interface OvertimeRecord {
  id: string
  employeeId: string
  date: Date
  hours: number
  rate?: number
  reason?: string
  approved: boolean
}

export interface LeaveBenefit {
  id: string
  employeeId: string
  benefitId: string
  year: number
  totalAllowance: number
  used: number
  remaining: number
}

export interface TimesheetEntry {
  id: string
  employeeId: string
  date: Date
  hoursWorked: number
  overtimeHours: number
  absences: number
  lateHours: number
}
