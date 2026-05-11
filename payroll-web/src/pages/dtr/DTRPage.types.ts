// Removed unused imports

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

export type DTRPageProps = object;
