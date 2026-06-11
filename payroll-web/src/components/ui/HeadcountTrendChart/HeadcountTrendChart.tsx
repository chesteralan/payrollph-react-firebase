import { clsx } from "clsx";
import { Users } from "lucide-react";

interface HeadcountTrendChartProps {
  data: { month: string; count: number }[];
  className?: string;
}

export function HeadcountTrendChart({
  data,
  className,
}: HeadcountTrendChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className={clsx("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">Headcount Trend</span>
      </div>
      <div className="flex items-end gap-1 h-24">
        {data.map((point) => {
          const h = (point.count / max) * 100;
          return (
            <div key={point.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-500">{point.count}</span>
              <div
                className="w-full bg-primary-200 rounded-t hover:bg-primary-300 transition-colors"
                style={{ height: `${Math.max(h, 4)}%` }}
                title={`${point.month}: ${point.count}`}
              />
              <span className="text-[9px] text-gray-400 -rotate-45 origin-left whitespace-nowrap">
                {point.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
