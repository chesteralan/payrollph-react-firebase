import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { Clock } from "lucide-react";

interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: "blue" | "green" | "yellow" | "red" | "gray";
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const variantStyles = {
  blue: "bg-blue-100 text-blue-600 ring-blue-200",
  green: "bg-green-100 text-green-600 ring-green-200",
  yellow: "bg-yellow-100 text-yellow-600 ring-yellow-200",
  red: "bg-red-100 text-red-600 ring-red-200",
  gray: "bg-gray-100 text-gray-600 ring-gray-200",
};

export function ActivityTimeline({
  events,
  className,
}: ActivityTimelineProps) {
  return (
    <div className={clsx("space-y-0", className)}>
      {events.map((event, i) => {
        const Icon = event.icon || Clock;
        const isLast = i === events.length - 1;
        return (
          <div key={event.id} className="relative flex gap-4 pb-6">
            {!isLast && (
              <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gray-200" />
            )}
            <div
              className={clsx(
                "relative z-10 flex items-center justify-center w-10 h-10 rounded-full ring-4 ring-white shrink-0",
                variantStyles[event.variant || "gray"],
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pt-1.5">
              <p className="text-sm font-medium text-gray-900">{event.title}</p>
              {event.description && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {event.description}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {event.date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
      {events.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">
          No recent activity
        </p>
      )}
    </div>
  );
}
