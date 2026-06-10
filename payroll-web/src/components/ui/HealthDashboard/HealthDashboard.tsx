import { clsx } from "clsx";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface HealthCheckItem {
  name: string;
  status: "healthy" | "degraded" | "down";
  message: string;
  lastCheck: Date;
}

interface HealthDashboardProps {
  checks: HealthCheckItem[];
  className?: string;
}

export function HealthDashboard({ checks, className }: HealthDashboardProps) {
  const healthy = checks.filter((c) => c.status === "healthy").length;
  const total = checks.length;

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-green-600 font-medium">{healthy}/{total} healthy</span>
        {checks.some((c) => c.status === "down") && (
          <span className="text-red-600 font-medium">
            {checks.filter((c) => c.status === "down").length} down
          </span>
        )}
      </div>
      <div className="space-y-1">
        {checks.map((check) => (
          <div
            key={check.name}
            className={clsx(
              "flex items-start gap-2 p-3 rounded-lg border text-sm",
              check.status === "healthy" && "bg-green-50 border-green-200",
              check.status === "degraded" && "bg-yellow-50 border-yellow-200",
              check.status === "down" && "bg-red-50 border-red-200",
            )}
          >
            {check.status === "healthy" && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />}
            {check.status === "degraded" && <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />}
            {check.status === "down" && <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{check.name}</span>
                <span className={clsx(
                  "text-xs px-1.5 py-0.5 rounded font-medium",
                  check.status === "healthy" && "bg-green-100 text-green-700",
                  check.status === "degraded" && "bg-yellow-100 text-yellow-700",
                  check.status === "down" && "bg-red-100 text-red-700",
                )}>
                  {check.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{check.message}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                Last check: {check.lastCheck.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
