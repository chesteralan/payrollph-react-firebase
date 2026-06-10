import { useState, useCallback } from "react";

interface UptimeEntry {
  timestamp: Date;
  status: "up" | "down";
  latencyMs: number;
}

export function useUptimeMonitor() {
  const [history, setHistory] = useState<UptimeEntry[]>([]);
  const [running, setRunning] = useState(false);

  const checkNow = useCallback(async (url: string) => {
    setRunning(true);
    const start = performance.now();
    try {
      const response = await fetch(url, { method: "HEAD", mode: "no-cors" });
      const latency = Math.round(performance.now() - start);
      const entry: UptimeEntry = {
        timestamp: new Date(),
        status: response.ok || response.type === "opaque" ? "up" : "down",
        latencyMs: latency,
      };
      setHistory((prev) => [...prev.slice(-59), entry]);
      return entry;
    } catch {
      const entry: UptimeEntry = {
        timestamp: new Date(),
        status: "down",
        latencyMs: -1,
      };
      setHistory((prev) => [...prev.slice(-59), entry]);
      return entry;
    } finally {
      setRunning(false);
    }
  }, []);

  const uptime = history.length > 0
    ? Math.round((history.filter((h) => h.status === "up").length / history.length) * 100)
    : 100;

  return { history, uptime, running, checkNow };
}
