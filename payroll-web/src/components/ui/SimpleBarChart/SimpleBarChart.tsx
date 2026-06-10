import { clsx } from "clsx";

interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarChartItem[];
  height?: number;
  showValues?: boolean;
  className?: string;
}

const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-teal-500",
];

export function SimpleBarChart({
  data,
  height = 200,
  showValues = true,
  className,
}: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={clsx("space-y-2", className)}>
      <div
        className="flex items-end gap-2"
        style={{ height }}
      >
        {data.map((item, i) => {
          const pct = (item.value / maxValue) * 100;
          return (
            <div
              key={item.label}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
            >
              {showValues && (
                <span className="text-[10px] font-medium text-gray-600">
                  {item.value.toLocaleString()}
                </span>
              )}
              <div
                className={clsx(
                  "w-full rounded-t transition-all hover:opacity-80",
                  item.color || COLORS[i % COLORS.length],
                )}
                style={{ height: `${Math.max(pct, 2)}%` }}
                title={`${item.label}: ${item.value.toLocaleString()}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        {data.map((item) => (
          <div key={item.label} className="flex-1 text-center">
            <span className="text-[10px] text-gray-500 truncate block">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
