import { clsx } from "clsx";
import { UserCheck, UserX, DollarSign, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface HistoryEvent {
  id: string;
  date: Date;
  action: string;
  detail: string;
  type: "status" | "salary" | "position" | "personal";
}

interface EmployeeHistoryTimelineProps {
  events: HistoryEvent[];
  className?: string;
}

const typeConfig: Record<
  string,
  { icon: LucideIcon; bg: string }
> = {
  status: { icon: UserCheck, bg: "bg-green-100 text-green-600" },
  salary: { icon: DollarSign, bg: "bg-blue-100 text-blue-600" },
  position: { icon: Briefcase, bg: "bg-yellow-100 text-yellow-600" },
  personal: { icon: UserX, bg: "bg-gray-100 text-gray-600" },
};

export function EmployeeHistoryTimeline({
  events,
  className,
}: EmployeeHistoryTimelineProps) {
  return (
    <div className={clsx("flow-root", className)}>
      <ul className="-mb-8">
        {events.map((event, i) => {
          const config = typeConfig[event.type] || typeConfig.personal;
          const Icon = config.icon;
          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {i !== events.length - 1 && (
                  <span
                    className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start gap-4">
                  <span
                    className={clsx(
                      "relative flex items-center justify-center w-10 h-10 rounded-full ring-4 ring-white shrink-0",
                      config.bg,
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-sm font-medium text-gray-900">
                      {event.action}
                    </p>
                    <p className="text-sm text-gray-500">{event.detail}</p>
                    <time className="text-xs text-gray-400 mt-1 block">
                      {event.date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {events.length === 0 && (
          <li>
            <p className="text-sm text-gray-400 py-4 text-center">
              No history recorded
            </p>
          </li>
        )}
      </ul>
    </div>
  );
}
