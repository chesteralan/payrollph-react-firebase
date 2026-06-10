import { clsx } from "clsx";

interface ReportComparisonViewProps {
  periodA: { label: string; data: Record<string, number> };
  periodB: { label: string; data: Record<string, number> };
  className?: string;
}

export function ReportComparisonView({
  periodA,
  periodB,
  className,
}: ReportComparisonViewProps) {
  const allKeys = [...new Set([...Object.keys(periodA.data), ...Object.keys(periodB.data)])];

  return (
    <div className={clsx("overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Item</th>
            <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">{periodA.label}</th>
            <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">{periodB.label}</th>
            <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {allKeys.map((key) => {
            const a = periodA.data[key] || 0;
            const b = periodB.data[key] || 0;
            const diff = a - b;
            const pct = b !== 0 ? ((diff / b) * 100).toFixed(1) : "N/A";
            return (
              <tr key={key} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-900">{key}</td>
                <td className="px-3 py-2 text-right font-mono">{a.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-500">{b.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  <span className={clsx(
                    "font-medium",
                    diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-400",
                  )}>
                    {pct !== "N/A" ? `${diff > 0 ? "+" : ""}${pct}%` : "N/A"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
