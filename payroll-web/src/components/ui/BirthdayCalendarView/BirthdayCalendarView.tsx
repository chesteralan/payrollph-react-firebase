import { clsx } from "clsx";
import { Cake, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface BirthdayEntry {
  name: string;
  date: string;
  department?: string;
}

interface BirthdayCalendarViewProps {
  employees: BirthdayEntry[];
  className?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function BirthdayCalendarView({
  employees,
  className,
}: BirthdayCalendarViewProps) {
  const [month, setMonth] = useState(new Date().getMonth());

  const thisMonth = employees.filter((e) => {
    const m = new Date(e.date).getMonth();
    return m === month;
  }).sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate());

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cake className="w-4 h-4 text-pink-500" />
          <span className="text-sm font-medium text-gray-700">Birthdays</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setMonth((m) => (m - 1 + 12) % 12)} className="p-1 rounded hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-600 min-w-[80px] text-center">{MONTHS[month]}</span>
          <button type="button" onClick={() => setMonth((m) => (m + 1) % 12)} className="p-1 rounded hover:bg-gray-100">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {thisMonth.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">No birthdays this month</p>
      ) : (
        <div className="space-y-1">
          {thisMonth.map((emp) => (
            <div key={emp.name} className="flex items-center gap-2 p-2 bg-pink-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                <span className="text-xs font-medium text-pink-600">
                  {new Date(emp.date).getDate()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                {emp.department && (
                  <p className="text-xs text-gray-500">{emp.department}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
