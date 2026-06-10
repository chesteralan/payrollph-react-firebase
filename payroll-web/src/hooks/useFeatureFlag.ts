import { useState, useCallback } from "react";

type FeatureFlags = Record<string, boolean>;

const DEFAULT_FLAGS: FeatureFlags = {
  newDashboard: false,
  payrollComparison: true,
  bulkCellEdit: true,
  darkMode: true,
  reportCharts: false,
  employeeSelfService: false,
};

export function useFeatureFlag() {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    try {
      const stored = localStorage.getItem("feature-flags");
      return stored ? { ...DEFAULT_FLAGS, ...JSON.parse(stored) } : DEFAULT_FLAGS;
    } catch {
      return DEFAULT_FLAGS;
    }
  });

  const isEnabled = useCallback(
    (flag: string): boolean => flags[flag] ?? false,
    [flags],
  );

  const setFlag = useCallback(
    (flag: string, enabled: boolean) => {
      setFlags((prev) => {
        const next = { ...prev, [flag]: enabled };
        localStorage.setItem("feature-flags", JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  return { isEnabled, setFlag, flags };
}
