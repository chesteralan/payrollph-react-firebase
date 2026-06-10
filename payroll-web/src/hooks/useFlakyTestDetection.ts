import { useState, useCallback } from "react";

interface TestRun {
  name: string;
  duration: number;
  passed: boolean;
  timestamp: number;
}

export function useFlakyTestDetection() {
  const [history, setHistory] = useState<TestRun[]>([]);

  const recordRun = useCallback(
    (name: string, duration: number, passed: boolean) => {
      setHistory((prev) => [...prev.slice(-99), { name, duration, passed, timestamp: Date.now() }]);
    },
    [],
  );

  const getFlakyTests = useCallback(
    (thresholdRuns = 5) => {
      const grouped: Record<string, TestRun[]> = {};
      history.forEach((run) => {
        if (!grouped[run.name]) grouped[run.name] = [];
        grouped[run.name].push(run);
      });
      return Object.entries(grouped)
        .filter(([, runs]) => runs.length >= thresholdRuns)
        .map(([name, runs]) => {
          const passed = runs.filter((r) => r.passed).length;
          const flakiness = 1 - passed / runs.length;
          return { name, runs: runs.length, passRate: Math.round((1 - flakiness) * 100), flakiness };
        })
        .filter((t) => t.flakiness > 0.1);
    },
    [history],
  );

  return { recordRun, getFlakyTests, totalRuns: history.length };
}
