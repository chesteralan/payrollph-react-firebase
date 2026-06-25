import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";

import type { CalendarEntry } from "../types/system";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

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

function processDayEntry(
  calendarEntry: (CalendarEntry & { isPaid?: boolean }) | undefined,
  dateStr: string,
  isWeekday: boolean,
  state: {
    totalWorkingDays: number;
    holidaysSubtracted: number;
    specialWorkdaysAdded: number;
    details: WorkDaysResult["details"];
  },
): void {
  if (calendarEntry) {
    if (calendarEntry.type === "workday") {
      if (!isWeekday) {
        state.totalWorkingDays++;
        state.specialWorkdaysAdded++;
        state.details.push({
          date: dateStr,
          type: "workday",
          name: calendarEntry.name,
        });
      } else {
        state.totalWorkingDays++;
        state.details.push({
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
        state.holidaysSubtracted++;
        state.details.push({
          date: dateStr,
          type: calendarEntry.type,
          name: calendarEntry.name,
        });
      } else {
        state.details.push({
          date: dateStr,
          type: "weekend",
          name: calendarEntry.name,
        });
      }
    }
  } else if (isWeekday) {
    state.totalWorkingDays++;
    state.details.push({ date: dateStr, type: "working" });
  } else {
    state.details.push({ date: dateStr, type: "weekend" });
  }
}

function createInitialState(): {
  totalWorkingDays: number;
  holidaysSubtracted: number;
  specialWorkdaysAdded: number;
  details: WorkDaysResult["details"];
} {
  return {
    totalWorkingDays: 0,
    holidaysSubtracted: 0,
    specialWorkdaysAdded: 0,
    details: [],
  };
}

export async function getPayrollWorkDays(
  startDate: string,
  endDate: string,
  companyId: string = "global",
): Promise<WorkDaysResult> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const state = createInitialState();

  const calendarSnap = await getDocs(
    query(collection(db, "calendar"), where("companyId", "==", companyId)),
  );
  const calendarEntries = calendarSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as (CalendarEntry & { isPaid?: boolean })[];

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0]!;
    const dayOfWeek = current.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    const calendarEntry = calendarEntries.find((e) => {
      const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
      return entryDate.toISOString().split("T")[0] === dateStr;
    });

    processDayEntry(calendarEntry, dateStr, isWeekday, state);
    current.setDate(current.getDate() + 1);
  }

  return {
    totalWorkingDays: state.totalWorkingDays,
    holidaysSubtracted: state.holidaysSubtracted,
    specialWorkdaysAdded: state.specialWorkdaysAdded,
    details: state.details,
  };
}

export function calculateWorkingDaysSync(
  startDate: string,
  endDate: string,
  calendarEntries: (CalendarEntry & { isPaid?: boolean })[],
): WorkDaysResult {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const state = createInitialState();

  const filteredEntries = calendarEntries.filter((e) => {
    const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
    return entryDate >= start && entryDate <= end;
  });

  const entryMap = new Map<string, CalendarEntry & { isPaid?: boolean }>();
  for (const entry of filteredEntries) {
    const entryDate =
      entry.date instanceof Date ? entry.date : new Date(entry.date);
    entryMap.set(entryDate.toISOString().split("T")[0]!, entry);
  }

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0]!;
    const dayOfWeek = current.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    const calendarEntry = entryMap.get(dateStr);

    processDayEntry(calendarEntry, dateStr, isWeekday, state);
    current.setDate(current.getDate() + 1);
  }

  return {
    totalWorkingDays: state.totalWorkingDays,
    holidaysSubtracted: state.holidaysSubtracted,
    specialWorkdaysAdded: state.specialWorkdaysAdded,
    details: state.details,
  };
}
