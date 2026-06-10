import { useState } from "react";
import { clsx } from "clsx";
import { Gauge, AlertTriangle, CheckCircle } from "lucide-react";

interface RateLimitRule {
  key: string;
  name: string;
  limit: number;
  window: number;
  current: number;
  blocked: boolean;
}

interface RateLimiterDashboardProps {
  rules: RateLimitRule[];
  onUpdateLimit: (key: string, limit: number) => void;
}

export function RateLimiterDashboard({
  rules,
  onUpdateLimit,
}: RateLimiterDashboardProps) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {rules.map((rule) => {
        const pct = (rule.current / rule.limit) * 100;
        const barColor =
          pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500";
        return (
          <div
            key={rule.key}
            className={clsx(
              "p-4 rounded-lg border transition-colors",
              rule.blocked
                ? "bg-red-50 border-red-200"
                : "bg-white border-gray-200",
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {rule.name}
                </span>
              </div>
              {rule.blocked ? (
                <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  Blocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={clsx("h-full rounded-full transition-all", barColor)}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {rule.current}/{rule.limit}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                Window: {rule.window}s
              </span>
              {editing === rule.key ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    defaultValue={rule.limit}
                    className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
                    onBlur={(e) => {
                      onUpdateLimit(rule.key, Number(e.target.value));
                      setEditing(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onUpdateLimit(
                          rule.key,
                          Number((e.target as HTMLInputElement).value),
                        );
                        setEditing(null);
                      }
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(rule.key)}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  Edit limit
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
