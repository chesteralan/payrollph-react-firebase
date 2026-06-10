import { clsx } from "clsx";

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface SimplePieChartProps {
  data: PieChartData[];
  size?: number;
  className?: string;
}

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];

export function SimplePieChart({
  data,
  size = 160,
  className,
}: SimplePieChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  const slices = data.map((item, idx) => {
    const pct = item.value / total;
    const prevPct = data.slice(0, idx).reduce((s, d) => s + d.value / total, 0);
    const startAngle = prevPct * 360 - 90;
    const endAngle = (prevPct + pct) * 360 - 90;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = pct > 0.5 ? 1 : 0;
    return {
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: item.color || COLORS[idx % COLORS.length],
    };
  });

  return (
    <div className={clsx("flex flex-col items-center gap-4", className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, i) => (
          <path key={i} d={slice.path} fill={slice.color} stroke="white" strokeWidth={1} />
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 justify-center">
        {data.map((item, i) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
            <span className="text-xs font-medium text-gray-900">
              {Math.round((item.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
