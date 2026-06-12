import { useState, useCallback, useRef, useEffect } from "react";

export interface TestRunMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  timestamp: number;
  /** Baseline duration from the previous run for regression comparison */
  baselineMs?: number;
}

export interface TestRunTimeTrackingOptions {
  /** Baseline duration in ms — compared against to detect regressions */
  baselineMs?: number;
  /** Threshold for regression alert as a multiplier (default: 1.5 = 50% slower) */
  regressionThreshold?: number;
  /** Callback when a regression is detected */
  onRegression?: (current: number, baseline: number) => void;
  /** Storage key for persisting run times (default: "test-run-times") */
  storageKey?: string;
}

/**
 * Tracks test run time durations and detects regressions vs a baseline.
 * Persists run history to localStorage for cross-session comparison.
 *
 * @example
 * ```ts
 * const { metrics, startRun, finishRun, history } = useTestRunTimeTracking({
 *   baselineMs: 45000,
 *   regressionThreshold: 1.5,
 *   onRegression: (current, baseline) => {
 *     console.warn(`Test run slowed: ${current}ms vs ${baseline}ms baseline`);
 *   },
 * });
 * ```
 */
export function useTestRunTimeTracking(options: TestRunTimeTrackingOptions = {}) {
  const {
    baselineMs: initialBaseline,
    regressionThreshold = 1.5,
    onRegression,
    storageKey = "test-run-times",
  } = options;

  const [metrics, setMetrics] = useState<TestRunMetrics | null>(null);
  const [history, setHistory] = useState<TestRunMetrics[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as TestRunMetrics[]) : [];
    } catch {
      return [];
    }
  });

  const startTimeRef = useRef<number>(0);
  const runningRef = useRef(false);

  /** Start tracking a test run */
  const startRun = useCallback(() => {
    startTimeRef.current = performance.now();
    runningRef.current = true;
  }, []);

  /** Finish tracking and record results */
  const finishRun = useCallback(
    (result: { total: number; passed: number; failed: number; skipped: number }) => {
      if (!runningRef.current) return;

      const durationMs = Math.round(performance.now() - startTimeRef.current);
      const baselineMs =
        initialBaseline ?? history.length > 0 ? history[history.length - 1]?.durationMs : undefined;

      const newMetrics: TestRunMetrics = {
        totalTests: result.total,
        passed: result.passed,
        failed: result.failed,
        skipped: result.skipped,
        durationMs,
        timestamp: Date.now(),
        baselineMs,
      };

      setMetrics(newMetrics);

      // Detect regression
      if (baselineMs && durationMs > baselineMs * regressionThreshold) {
        console.warn(
          `[TestRunTimeTracking] Regression detected: ${durationMs}ms vs ${baselineMs}ms baseline ` +
            `(${Math.round((durationMs / baselineMs - 1) * 100)}% slower, threshold: ${regressionThreshold}x)`,
        );
        onRegression?.(durationMs, baselineMs);
      }

      // Persist to history
      setHistory((prev) => {
        const updated = [...prev, newMetrics].slice(-50); // Keep last 50 runs
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {
          // localStorage may be full or unavailable
        }
        return updated;
      });

      runningRef.current = false;
    },
    [initialBaseline, history, regressionThreshold, onRegression, storageKey],
  );

  /** Clear run history */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setMetrics(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  /** Get the average duration of recent runs */
  const getAverageDuration = useCallback(
    (lastRuns = 5): number => {
      const recent = history.slice(-lastRuns);
      if (recent.length === 0) return 0;
      return Math.round(
        recent.reduce((sum, m) => sum + m.durationMs, 0) / recent.length,
      );
    },
    [history],
  );

  /** Check if the latest run is a regression */
  const isRegression = useCallback((): boolean => {
    if (!metrics || !metrics.baselineMs) return false;
    return metrics.durationMs > metrics.baselineMs * regressionThreshold;
  }, [metrics, regressionThreshold]);

  return {
    metrics,
    history,
    startRun,
    finishRun,
    clearHistory,
    getAverageDuration,
    isRegression,
  };
}

export default useTestRunTimeTracking;
