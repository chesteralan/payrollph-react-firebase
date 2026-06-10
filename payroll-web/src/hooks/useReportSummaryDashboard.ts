import { useState, useCallback } from "react";

interface ReportSummaryItem {
  name: string;
  count: number;
  total: number;
}

export function useReportSummaryDashboard() {
  const [items] = useState<ReportSummaryItem[]>([
    { name: "13th Month", count: 12, total: 1500000 },
    { name: "Payroll Summary", count: 24, total: 3200000 },
    { name: "Attendance", count: 6, total: 0 },
    { name: "Year-End", count: 2, total: 980000 },
  ]);

  const exportAll = useCallback(() => {
    const csv = ["Report,Count,Total", ...items.map((i) => `${i.name},${i.count},${i.total}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report-summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  return { items, exportAll };
}
