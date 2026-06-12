import { useState, useCallback } from "react";

interface UptimeTarget {
  url: string;
  name: string;
  interval: number;
  timeout: number;
}

export function useUptimeConfig() {
  const [targets] = useState<UptimeTarget[]>([
    { url: "https://payrollph.web.app", name: "Production", interval: 60, timeout: 10 },
    { url: "https://staging-payrollph.web.app", name: "Staging", interval: 300, timeout: 15 },
  ]);

  const [history, setHistory] = useState<Record<string, { timestamp: Date; up: boolean }[]>>({});

  const checkTarget = useCallback(async (target: UptimeTarget) => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), target.timeout * 1000);
      const response = await fetch(target.url, { method: "HEAD", signal: controller.signal });
      clearTimeout(id);
      const up = response.ok || response.type === "opaque";
      setHistory((prev) => ({
        ...prev,
        [target.name]: [...(prev[target.name] || []).slice(-59), { timestamp: new Date(), up }],
      }));
      return up;
    } catch {
      setHistory((prev) => ({
        ...prev,
        [target.name]: [...(prev[target.name] || []).slice(-59), { timestamp: new Date(), up: false }],
      }));
      return false;
    }
  }, []);

  const checkAll = useCallback(async () => {
    const results = await Promise.all(targets.map((t) => checkTarget(t)));
    return results.every(Boolean);
  }, [targets, checkTarget]);

  const uptimePct = useCallback(
    (name: string) => {
      const entries = history[name];
      if (!entries || entries.length === 0) return 100;
      return Math.round((entries.filter((e) => e.up).length / entries.length) * 100);
    },
    [history],
  );

  return { targets, history, checkTarget, checkAll, uptimePct };
}
