export interface Employee {
  id: string;
  employeeCode: string;
  nameId: string;
  isActive?: boolean;
}

export interface NameRecord {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
}

export interface DtrEntry {
  date: string;
  employeeId: string;
  hoursWorked: number;
  absenceType?: string;
  lateHours?: number;
  overtimeHours?: number;
}

export interface AttendanceData {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  daysWorked: number;
  absences: number;
  lateHours: number;
  overtimeHours: number;
  attendanceRate: number;
  totalDaysInPeriod: number;
}
