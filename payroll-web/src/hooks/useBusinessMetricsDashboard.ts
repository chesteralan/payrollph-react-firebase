import { useState, useCallback } from "react";

interface BusinessMetric {
  name: string;
  value: number;
  change: number;
  period: string;
}

export function useBusinessMetricsDashboard() {
  const [metrics] = useState<BusinessMetric[]>([
    { name: "Total Payroll (YTD)", value: 12500000, change: 12.5, period: "vs last year" },
    { name: "Active Employees", value: 342, change: 8.2, period: "vs last month" },
    { name: "Avg Processing Time", value: 4.2, change: -15.3, period: "vs last quarter" },
    { name: "Payroll Runs (MTD)", value: 18, change: 5.7, period: "vs last month" },
    { name: "Avg Net Pay", value: 28500, change: 3.1, period: "vs last month" },
    { name: "Overtime Costs (MTD)", value: 185000, change: -2.4, period: "vs last month" },
  ]);

  const exportMetrics = useCallback(() => {
    const csv = ["Metric,Value,Change,Period", ...metrics.map((m) => `${m.name},${m.value},${m.change}%,${m.period}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "business-metrics.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics]);

  return { metrics, exportMetrics };
}
