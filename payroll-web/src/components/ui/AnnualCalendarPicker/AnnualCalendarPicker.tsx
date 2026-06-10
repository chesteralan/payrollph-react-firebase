import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface AnnualCalendarPickerProps {
  year: number;
  selectedDates: string[];
  onToggleDate: (date: string) => void;
  markedDates?: Record<string, "holiday" | "special" | "workday">;
  className?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AnnualCalendarPicker({
  year,
  selectedDates,
  onToggleDate,
  markedDates,
  className,
}: AnnualCalendarPickerProps) {
  const [viewYear, setViewYear] = useState(year);

  return (
    <div className={clsx("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewYear((y) => y - 1)}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold">{viewYear}</span>
        <button
          type="button"
          onClick={() => setViewYear((y) => y + 1)}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MONTHS.map((month, mi) => {
          const daysInMonth = new Date(viewYear, mi + 1, 0).getDate();
          const firstDay = new Date(viewYear, mi, 1).getDay();
          const dates: (number | null)[] = Array(firstDay).fill(null);
          for (let d = 1; d <= daysInMonth; d++) dates.push(d);

          return (
            <div key={month} className="border border-gray-200 rounded-lg p-2">
              <h4 className="text-xs font-semibold text-gray-500 mb-1 text-center">{month}</h4>
              <div className="grid grid-cols-7 gap-0.5">
                {DAYS.map((d) => (
                  <div key={d} className="text-[10px] text-gray-400 text-center h-5 flex items-center justify-center">{d[0]}</div>
                ))}
                {dates.map((d, i) => {
                  if (d === null) return <div key={`e-${i}`} />;
                  const dateStr = `${viewYear}-${String(mi + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  const isSelected = selectedDates.includes(dateStr);
                  const mark = markedDates?.[dateStr];
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => onToggleDate(dateStr)}
                      className={clsx(
                        "text-[11px] h-6 rounded flex items-center justify-center transition-colors",
                        isSelected && "bg-primary-100 text-primary-700",
                        mark === "holiday" && !isSelected && "bg-red-100 text-red-700",
                        mark === "special" && !isSelected && "bg-yellow-100 text-yellow-700",
                        mark === "workday" && !isSelected && "bg-green-100 text-green-700",
                        !isSelected && !mark && "hover:bg-gray-100 text-gray-700",
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
