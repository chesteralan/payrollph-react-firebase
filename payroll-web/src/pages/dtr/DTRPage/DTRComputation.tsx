import { useMemo } from "react";
import type { DTREntry } from "@/types/dtr";

/**
 * Calculate hours worked from time in/out strings
 */
export function calcHours(timeIn: string, timeOut: string): number {
  if (!timeIn || !timeOut) return 0;
  const [h1, m1] = timeIn.split(":").map(Number);
  const [h2, m2] = timeOut.split(":").map(Number);
  const diff = h2 * 60 + m2 - (h1 * 60 + m1);
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

/**
 * Build a YYYY-MM-DD date string from components
 */
export function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Get number of days in a month
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day-of-week of the first day of a month (0=Sun)
 */
export function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Compute DTR statistics from entries
 */
export function useDTRStats(dtrEntries: DTREntry[]) {
  return useMemo(() => {
    let daysWorked = 0,
      totalHours = 0,
      totalOvertime = 0,
      totalLate = 0,
      totalAbsences = 0;
    dtrEntries.forEach((e) => {
      if (e.hoursWorked > 0) {
        daysWorked++;
        totalHours += e.hoursWorked;
      }
      totalOvertime += e.overtimeHours || 0;
      totalLate += e.lateHours || 0;
      if (e.absenceType) totalAbsences++;
    });
    return {
      daysWorked,
      totalHours: Math.round(totalHours * 100) / 100,
      totalOvertime: Math.round(totalOvertime * 100) / 100,
      totalLate: Math.round(totalLate * 100) / 100,
      totalAbsences,
    };
  }, [dtrEntries]);
}

/**
 * Look up day status for coloring
 */
export function dayStatus(
  day: number,
  selectedYear: number,
  selectedMonth: number,
  entryMap: Map<string, DTREntry>,
): "none" | "absent" | "complete" | "partial" {
  const ds = dateStr(selectedYear, selectedMonth, day);
  const entry = entryMap.get(ds);
  if (!entry) return "none";
  if (entry.absenceType) return "absent";
  if (entry.timeIn && entry.timeOut) return "complete";
  if (entry.timeIn || entry.timeOut) return "partial";
  return "none";
}
