import { useState, useCallback } from "react";

export function useDTRBulkEdit() {
  const [editing, setEditing] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const toggleDate = useCallback((date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  }, []);

  const selectRange = useCallback((start: string, end: string) => {
    const dates: string[] = [];
    const current = new Date(start);
    const last = new Date(end);
    while (current <= last) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    setSelectedDates(dates);
  }, []);

  const applyValue = useCallback(
    (value: string, field: string, rows: Record<string, Record<string, string>>[]) => {
      return rows.map((row) => {
        const newRow = { ...row };
        for (const date of selectedDates) {
          if (newRow[date] !== undefined) {
            newRow[date] = value;
          }
        }
        return newRow;
      });
    },
    [selectedDates],
  );

  const clear = useCallback(() => {
    setSelectedDates([]);
    setEditing(false);
  }, []);

  return { editing, setEditing, selectedDates, toggleDate, selectRange, applyValue, clear };
}
