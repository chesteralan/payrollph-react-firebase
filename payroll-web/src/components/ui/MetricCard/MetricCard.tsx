import { clsx } from "clsx";
import { TrendingUp, type LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: { value: string; positive: boolean };
  icon: LucideIcon;
  variant?: "blue" | "green" | "yellow" | "purple";
  onClick?: () => void;
}

const variantStyles = {
  blue: "bg-blue-50 border-blue-200 text-blue-600",
  green: "bg-green-50 border-green-200 text-green-600",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-600",
  purple: "bg-purple-50 border-purple-200 text-purple-600",
};

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  variant = "blue",
  onClick,
}: MetricCardProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-4 transition-shadow hover:shadow-sm",
        onClick && "cursor-pointer",
        variantStyles[variant].split(" ")[0],
        variantStyles[variant].split(" ")[1],
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={clsx(
            "p-2 rounded-lg",
            variantStyles[variant].split(" ")[2] ||
              variantStyles[variant].split(" ")[0].replace("bg-", "bg-").replace("50", "100"),
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {change && (
        <div className="mt-2 flex items-center gap-1">
          <TrendingUp
            className={clsx(
              "w-3 h-3",
              change.positive ? "text-green-500" : "text-red-500",
            )}
          />
          <span
            className={clsx(
              "text-xs font-medium",
              change.positive ? "text-green-600" : "text-red-600",
            )}
          >
            {change.value}
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  );
}
