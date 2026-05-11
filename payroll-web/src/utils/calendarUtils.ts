import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import type { CalendarEntry } from "../types/system";

export interface WorkDaysResult {
  totalWorkingDays: number;
  holidaysSubtracted: number;
  specialWorkdaysAdded: number;
  details: {
    date: string;
    type: "working" | "holiday" | "special" | "workday" | "weekend";
    name?: string;
  }[];
}

export async function getPayrollWorkDays(
  startDate: string,
  endDate: string,
  companyId: string = "global",
): Promise<WorkDaysResult> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const details: WorkDaysResult["details"] = [];
  let totalWorkingDays = 0;
  let holidaysSubtracted = 0;
  let specialWorkdaysAdded = 0;

  const calendarSnap = await getDocs(
    query(collection(db, "calendar"), where("companyId", "==", companyId)),
  );
  const calendarEntries = calendarSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as (CalendarEntry & { isPaid?: boolean })[];

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const dayOfWeek = current.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    const calendarEntry = calendarEntries.find((e) => {
      const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
      return entryDate.toISOString().split("T")[0] === dateStr;
    });

    if (calendarEntry) {
      if (calendarEntry.type === "workday") {
        if (!isWeekday) {
          totalWorkingDays++;
          specialWorkdaysAdded++;
          details.push({
            date: dateStr,
            type: "workday",
            name: calendarEntry.name,
          });
        } else {
          totalWorkingDays++;
          details.push({
            date: dateStr,
            type: "working",
            name: calendarEntry.name,
          });
        }
      } else if (
        calendarEntry.type === "holiday" ||
        calendarEntry.type === "special"
      ) {
        if (isWeekday) {
          holidaysSubtracted++;
          details.push({
            date: dateStr,
            type: calendarEntry.type,
            name: calendarEntry.name,
          });
        } else {
          details.push({
            date: dateStr,
            type: "weekend",
            name: calendarEntry.name,
          });
        }
      }
    } else if (isWeekday) {
      totalWorkingDays++;
      details.push({ date: dateStr, type: "working" });
    } else {
      details.push({ date: dateStr, type: "weekend" });
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    totalWorkingDays,
    holidaysSubtracted,
    specialWorkdaysAdded,
    details,
  };
}

export function calculateWorkingDaysSync(
  startDate: string,
  endDate: string,
  calendarEntries: (CalendarEntry & { isPaid?: boolean })[],
): WorkDaysResult {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const details: WorkDaysResult["details"] = [];
  let totalWorkingDays = 0;
  let holidaysSubtracted = 0;
  let specialWorkdaysAdded = 0;

  const filteredEntries = calendarEntries.filter((e) => {
    const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
    return entryDate >= start && entryDate <= end;
  });

  const entryMap = new Map<string, CalendarEntry & { isPaid?: boolean }>();
  for (const entry of filteredEntries) {
    const entryDate =
      entry.date instanceof Date ? entry.date : new Date(entry.date);
    entryMap.set(entryDate.toISOString().split("T")[0], entry);
  }

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const dayOfWeek = current.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    const calendarEntry = entryMap.get(dateStr);

    if (calendarEntry) {
      if (calendarEntry.type === "workday") {
        if (!isWeekday) {
          totalWorkingDays++;
          specialWorkdaysAdded++;
          details.push({
            date: dateStr,
            type: "workday",
            name: calendarEntry.name,
          });
        } else {
          totalWorkingDays++;
          details.push({
            date: dateStr,
            type: "working",
            name: calendarEntry.name,
          });
        }
      } else if (
        calendarEntry.type === "holiday" ||
        calendarEntry.type === "special"
      ) {
        if (isWeekday) {
          holidaysSubtracted++;
          details.push({
            date: dateStr,
            type: calendarEntry.type,
            name: calendarEntry.name,
          });
        } else {
          details.push({
            date: dateStr,
            type: "weekend",
            name: calendarEntry.name,
          });
        }
      }
    } else if (isWeekday) {
      totalWorkingDays++;
      details.push({ date: dateStr, type: "working" });
    } else {
      details.push({ date: dateStr, type: "weekend" });
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    totalWorkingDays,
    holidaysSubtracted,
    specialWorkdaysAdded,
    details,
  };
}
