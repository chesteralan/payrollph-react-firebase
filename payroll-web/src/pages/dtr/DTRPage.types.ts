import type { Employee, NameRecord } from "../../types/employee";
import type { DTREntry, LeaveApplication, LeaveBalance } from "../../types/dtr";

export interface DTRPageDayForm {
  timeIn: string;
  timeOut: string;
  overtimeHours: number;
  lateHours: number;
  absenceType: DTREntry["absenceType"];
  absenceReason: string;
  notes: string;
}

export interface DTRPageLeaveForm {
  benefitId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface DTRPageBenefit {
  id: string;
  name: string;
}

export type DTRPageViewMode = "calendar" | "summary";

export interface DTRPageProps {}
