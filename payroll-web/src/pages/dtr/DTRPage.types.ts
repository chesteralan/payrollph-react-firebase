// Removed unused imports

export interface DTRPageDayForm {
  timeIn: string;
  timeOut: string;
  overtimeHours: number;
  lateHours: number;
  absenceType: "absent" | "late" | "undertime" | "sick" | "vacation" | undefined;
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
  [key: string]: unknown;
}

export type DTRPageViewMode = "month" | "week" | "day";
