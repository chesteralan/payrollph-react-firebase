import type { CalendarEntry } from "../../types";

export interface CalendarEvent extends CalendarEntry {
  isPaid?: boolean;
}

export type Department = "payroll" | "employees" | "lists" | "reports" | "system";
export type Section = string;
