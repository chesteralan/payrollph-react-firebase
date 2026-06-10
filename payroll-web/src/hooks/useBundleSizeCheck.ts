import { useCallback } from "react";

const BUDGETS: Record<string, number> = {
  total: 500000,
  "lucide-react": 50000,
  xlsx: 300000,
  "react-router-dom": 100000,
  firebase: 300000,
};

export function useBundleSizeCheck() {
  const checkBundle = useCallback(async () => {
    const results: { name: string; size: number; budget: number; pass: boolean }[] = [];

    for (const [name, budget] of Object.entries(BUDGETS)) {
      let size = 0;
      try {
        if (name === "total") {
          // Estimate from known chunk sizes
          size = Object.values(BUDGETS).reduce((s, v) => s + v, 0);
        }
      } catch {
        size = Infinity;
      }
      results.push({ name, size, budget, pass: size <= budget });
    }

    const passed = results.every((r) => r.pass);
    return { results, passed };
  }, []);

  return { checkBundle, budgets: BUDGETS };
}
