export interface AttendanceReportFilter {
  companyId: string;
  dateFrom: string;
  dateTo: string;
  employeeId?: string;
}

export interface AttendanceReportRow {
  employeeId: string;
  employeeName: string;
  totalDaysWorked: number;
  totalLateHours: number;
  totalAbsences: number;
  totalOvertimeHours: number;
}

export interface AttendanceSummary {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  [key: string]: unknown;
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

export interface DtrEntry {
  id: string;
  employeeId: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  hoursWorked: number;
  overtimeHours: number;
  lateHours: number;
  absenceType?: string;
  absenceReason?: string;
}

export type { Employee } from "@/types/employee";
export type { NameRecord } from "@/types/employee";
