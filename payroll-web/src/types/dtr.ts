export interface DTREntry {
  id: string
  employeeId: string
  date: string
  timeIn?: string
  timeOut?: string
  hoursWorked: number
  overtimeHours: number
  lateHours: number
  absenceType?: 'absent' | 'late' | 'undertime' | 'sick' | 'vacation'
  absenceReason?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface LeaveApplication {
  id: string
  employeeId: string
  benefitId: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: Date
}

export interface LeaveBalance {
  id: string
  employeeId: string
  benefitId: string
  year: number
  totalAllowance: number
  used: number
  remaining: number
}

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
