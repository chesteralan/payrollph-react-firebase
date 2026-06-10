import { useMemo } from "react";

interface DtrRecord {
  date: string;
  timeIn?: string;
  timeOut?: string;
  status: string;
}

export function useDtrExceptionReporting() {
  const findExceptions = useMemo(
    () => (records: DtrRecord[]): { type: string; date: string; description: string }[] => {
      const exceptions: { type: string; date: string; description: string }[] = [];

      for (const record of records) {
        if (!record.timeIn || !record.timeOut) {
          exceptions.push({ type: "missing_punch", date: record.date, description: "Missing time in/out" });
        }
        if (record.timeIn && record.timeOut) {
          const [hIn, mIn] = record.timeIn.split(":").map(Number);
          const [hOut, mOut] = record.timeOut.split(":").map(Number);
          const minutesWorked = (hOut * 60 + mOut) - (hIn * 60 + mIn);
          if (minutesWorked > 600) {
            exceptions.push({ type: "long_hours", date: record.date, description: `Worked ${Math.round(minutesWorked / 60)}h (exceeds 10h)` });
          }
          if (hIn > 9 || (hIn === 9 && mIn > 30)) {
            exceptions.push({ type: "late_arrival", date: record.date, description: `Arrived at ${record.timeIn}` });
          }
        }
      }

      return exceptions;
    },
    [],
  );

  return { findExceptions };
}
