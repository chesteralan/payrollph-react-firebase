import { clsx } from "clsx";
import { Activity } from "lucide-react";

interface AuditStat {
  label: string;
  value: number;
  icon: typeof Activity;
  variant: "blue" | "green" | "yellow" | "red";
}

interface AuditDashboardProps {
  stats: AuditStat[];
  className?: string;
}

export function AuditDashboard({ stats, className }: AuditDashboardProps) {
  return (
    <div className={clsx("grid grid-cols-2 lg:grid-cols-4 gap-3", className)}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={clsx(
              "p-4 rounded-lg border",
              stat.variant === "blue" && "bg-blue-50 border-blue-200",
              stat.variant === "green" && "bg-green-50 border-green-200",
              stat.variant === "yellow" && "bg-yellow-50 border-yellow-200",
              stat.variant === "red" && "bg-red-50 border-red-200",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={clsx(
                "w-4 h-4",
                stat.variant === "blue" && "text-blue-600",
                stat.variant === "green" && "text-green-600",
                stat.variant === "yellow" && "text-yellow-600",
                stat.variant === "red" && "text-red-600",
              )} />
              <span className="text-xs font-medium text-gray-600">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
          </div>
        );
      })}
    </div>
  );
}
