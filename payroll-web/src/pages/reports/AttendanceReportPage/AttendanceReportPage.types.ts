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
