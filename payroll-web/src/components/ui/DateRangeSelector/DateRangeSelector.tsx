import { clsx } from "clsx";
import { Calendar } from "lucide-react";

interface DateRange {
  start: string;
  end: string;
}

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: { label: string; getRange: () => DateRange }[];
  className?: string;
}

function getDefaultPresets(): { label: string; getRange: () => DateRange }[] {
  const now = new Date();
  return [
    {
      label: "This Month",
      getRange: () => {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
      },
    },
    {
      label: "Last Month",
      getRange: () => {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
      },
    },
    {
      label: "This Year",
      getRange: () => {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
      },
    },
    {
      label: "Last Year",
      getRange: () => {
        const start = new Date(now.getFullYear() - 1, 0, 1);
        const end = new Date(now.getFullYear() - 1, 11, 31);
        return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
      },
    },
  ];
}

export function DateRangeSelector({
  value,
  onChange,
  presets,
  className,
}: DateRangeSelectorProps) {
  const allPresets = presets || getDefaultPresets();

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex flex-wrap gap-1.5">
        {allPresets.map((preset) => {
          const range = preset.getRange();
          const active = value.start === range.start && value.end === range.end;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(range)}
              className={clsx(
                "px-2.5 py-1 text-xs font-medium rounded-full border transition-colors",
                active
                  ? "bg-primary-100 border-primary-300 text-primary-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="date"
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg"
          />
        </div>
        <span className="text-xs text-gray-400">to</span>
        <div className="relative flex-1">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="date"
            value={value.end}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
