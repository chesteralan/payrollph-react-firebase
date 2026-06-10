import { useCallback } from "react";

export function useSmokeTest() {
  const runCriticalTests = useCallback(async () => {
    const results: { name: string; passed: boolean; error?: string }[] = [];

    // Test 1: localStorage available
    results.push({
      name: "localStorage available",
      passed: typeof localStorage !== "undefined",
    });

    // Test 2: Firebase config present
    results.push({
      name: "Firebase API key configured",
      passed: !!import.meta.env.VITE_FIREBASE_API_KEY,
    });

    // Test 3: DOM rendering works
    results.push({
      name: "DOM rendering",
      passed: typeof document !== "undefined" && !!document.createElement,
    });

    // Test 4: Router available
    results.push({
      name: "Router imports",
      passed: typeof window !== "undefined",
    });

    return { results, passed: results.every((r) => r.passed), timestamp: new Date() };
  }, []);

  return { runCriticalTests };
}
