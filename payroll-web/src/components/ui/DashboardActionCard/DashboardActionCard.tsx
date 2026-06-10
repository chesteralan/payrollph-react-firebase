import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface DashboardActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  count?: number;
  variant?: "blue" | "yellow" | "green" | "red";
  onClick: () => void;
}

const variantStyles = {
  blue: {
    bg: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconBg: "bg-blue-100 text-blue-600",
    countBg: "bg-blue-600 text-white",
  },
  yellow: {
    bg: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
    iconBg: "bg-yellow-100 text-yellow-600",
    countBg: "bg-yellow-600 text-white",
  },
  green: {
    bg: "bg-green-50 border-green-200 hover:bg-green-100",
    iconBg: "bg-green-100 text-green-600",
    countBg: "bg-green-600 text-white",
  },
  red: {
    bg: "bg-red-50 border-red-200 hover:bg-red-100",
    iconBg: "bg-red-100 text-red-600",
    countBg: "bg-red-600 text-white",
  },
};

export function DashboardActionCard({
  title,
  description,
  icon: Icon,
  count,
  variant = "blue",
  onClick,
}: DashboardActionCardProps) {
  const styles = variantStyles[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "relative flex items-start gap-4 p-4 border rounded-lg text-left transition-all w-full",
        styles.bg,
      )}
    >
      <div className={clsx("p-2 rounded-lg shrink-0", styles.iconBg)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {count !== undefined && (
            <span
              className={clsx(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold",
                styles.countBg,
              )}
            >
              {count}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-0.5">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 mt-2 shrink-0" />
    </button>
  );
}
