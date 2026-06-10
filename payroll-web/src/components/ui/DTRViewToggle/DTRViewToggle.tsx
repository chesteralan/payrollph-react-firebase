import { clsx } from "clsx";
import { CalendarDays, CalendarRange, Calendar as CalendarIcon } from "lucide-react";

interface DTRViewToggleProps {
  view: "month" | "week" | "day";
  onChange: (view: "month" | "week" | "day") => void;
}

const views = [
  { key: "month" as const, label: "Month", icon: CalendarDays },
  { key: "week" as const, label: "Week", icon: CalendarRange },
  { key: "day" as const, label: "Day", icon: CalendarIcon },
];

export function DTRViewToggle({ view, onChange }: DTRViewToggleProps) {
  return (
    <div className="inline-flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
      {views.map((v) => {
        const Icon = v.icon;
        const active = view === v.key;
        return (
          <button
            key={v.key}
            type="button"
            onClick={() => onChange(v.key)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              active
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}
