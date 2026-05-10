import type { Payroll } from "../../types";

export interface PayrollSummary extends Payroll {
  employeeCount: number;
  grossPay: number;
  netPay: number;
  groups: GroupSummary[];
}

export interface GroupSummary {
  groupId: string;
  groupName: string;
  employeeCount: number;
  grossPay: number;
  netPay: number;
}
