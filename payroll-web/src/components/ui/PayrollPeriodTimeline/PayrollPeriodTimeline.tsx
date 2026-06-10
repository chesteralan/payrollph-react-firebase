import { clsx } from "clsx";
import { Calendar } from "lucide-react";

interface PayrollPeriodTimelineProps {
  periods: { id: string; label: string; start: Date; end: Date; status: string }[];
  className?: string;
}

export function PayrollPeriodTimeline({
  periods,
  className,
}: PayrollPeriodTimelineProps) {
  const now = new Date();
  const sorted = [...periods].sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div className={clsx("space-y-2", className)}>
      {sorted.map((period) => {
        const isActive = period.start <= now && period.end >= now;
        const isPast = period.end < now;
        const isFuture = period.start > now;
        return (
          <div
            key={period.id}
            className={clsx(
              "relative flex items-center gap-3 p-3 rounded-lg border text-sm",
              isActive && "bg-blue-50 border-blue-200",
              isPast && "bg-gray-50 border-gray-200",
              isFuture && "bg-white border-gray-200",
            )}
          >
            <div
              className={clsx(
                "w-3 h-3 rounded-full shrink-0",
                isActive && "bg-blue-500",
                isPast && period.status === "published" && "bg-green-500",
                isPast && period.status !== "published" && "bg-gray-300",
                isFuture && "bg-gray-200",
              )}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{period.label}</span>
                <span className={clsx(
                  "text-xs px-1.5 py-0.5 rounded font-medium capitalize",
                  period.status === "published" && "bg-green-100 text-green-700",
                  period.status === "locked" && "bg-yellow-100 text-yellow-700",
                  period.status === "draft" && "bg-gray-100 text-gray-600",
                )}>
                  {period.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {period.start.toLocaleDateString()} - {period.end.toLocaleDateString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
