import { useMemo } from "react";

interface PeriodData {
  period: string;
  employees: number;
  grossPay: number;
  deductions: number;
  netPay: number;
}

export function useEmployeeReportComparison() {
  const comparePeriods = useMemo(
    () => (periods: PeriodData[]) => {
      if (periods.length < 2) return null;

      const sorted = [...periods].sort((a, b) => a.period.localeCompare(b.period));
      const latest = sorted[sorted.length - 1];
      const previous = sorted[sorted.length - 2];

      return {
        latest,
        previous,
        changes: {
          employees: latest.employees - previous.employees,
          grossPay: latest.grossPay - previous.grossPay,
          grossPayPct: previous.grossPay ? ((latest.grossPay - previous.grossPay) / previous.grossPay * 100).toFixed(1) : "N/A",
          netPay: latest.netPay - previous.netPay,
          netPayPct: previous.netPay ? ((latest.netPay - previous.netPay) / previous.netPay * 100).toFixed(1) : "N/A",
        },
      };
    },
    [],
  );

  return { comparePeriods };
}
