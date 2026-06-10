import { clsx } from "clsx";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface ComparisonColumn {
  label: string;
  current: number;
  previous: number;
  format?: "currency" | "number" | "percentage";
}

interface PayrollComparisonViewProps {
  title: string;
  periodCurrent: string;
  periodPrevious: string;
  columns: ComparisonColumn[];
  className?: string;
}

function formatValue(val: number, format?: string) {
  if (format === "currency")
    return `₱${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  if (format === "percentage") return `${val}%`;
  return val.toLocaleString();
}

export function PayrollComparisonView({
  title,
  periodCurrent,
  periodPrevious,
  columns,
  className,
}: PayrollComparisonViewProps) {
  return (
    <div className={clsx("space-y-4", className)}>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Metric</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">{periodCurrent}</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">{periodPrevious}</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {columns.map((col) => {
              const diff = col.current - col.previous;
              const pctChange =
                col.previous !== 0
                  ? ((diff / col.previous) * 100).toFixed(1)
                  : "N/A";
              const isPositive = diff > 0;
              const isNegative = diff < 0;
              return (
                <tr key={col.label} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-gray-900">{col.label}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {formatValue(col.current, col.format)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-500">
                    {formatValue(col.previous, col.format)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 font-medium",
                        isPositive && "text-green-600",
                        isNegative && "text-red-600",
                        !isPositive && !isNegative && "text-gray-400",
                      )}
                    >
                      {isPositive && <ArrowUp className="w-3 h-3" />}
                      {isNegative && <ArrowDown className="w-3 h-3" />}
                      {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
                      {pctChange !== "N/A" ? `${pctChange}%` : "N/A"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
