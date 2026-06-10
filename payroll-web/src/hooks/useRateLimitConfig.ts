import { useState, useCallback } from "react";

export function useRateLimitConfig() {
  const [limits, setLimits] = useState<Record<string, number>>({
    login: 5,
    api: 100,
    export: 10,
    import: 5,
  });

  const updateLimit = useCallback((key: string, value: number) => {
    setLimits((prev) => ({ ...prev, [key]: value }));
    localStorage.setItem("rate-limits", JSON.stringify({ ...limits, [key]: value }));
  }, [limits]);

  const resetDefaults = useCallback(() => {
    const defaults = { login: 5, api: 100, export: 10, import: 5 };
    setLimits(defaults);
    localStorage.setItem("rate-limits", JSON.stringify(defaults));
  }, []);

  return { limits, updateLimit, resetDefaults };
}
