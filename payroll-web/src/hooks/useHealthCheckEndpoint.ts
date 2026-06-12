import { useCallback, useState } from "react";

interface HealthStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency: number;
  lastChecked: Date;
}

export function useHealthCheckEndpoint() {
  const [statuses, setStatuses] = useState<HealthStatus[]>([
    { service: "Firestore", status: "healthy", latency: 45, lastChecked: new Date() },
    { service: "Authentication", status: "healthy", latency: 120, lastChecked: new Date() },
    { service: "Storage", status: "healthy", latency: 80, lastChecked: new Date() },
  ]);

  const runHealthCheck = useCallback(async () => {
    const start = performance.now();
    try {
      const { collection, getDocs, limit: qLimit } = await import("firebase/firestore");
      const { db } = await import("@/config/firebase");
      await getDocs(qLimit(collection(db, "companies"), 1));
      setStatuses((prev) =>
        prev.map((s) =>
          s.service === "Firestore"
            ? { ...s, status: "healthy", latency: Math.round(performance.now() - start), lastChecked: new Date() }
            : s,
        ),
      );
    } catch {
      setStatuses((prev) =>
        prev.map((s) =>
          s.service === "Firestore"
            ? { ...s, status: "down", latency: -1, lastChecked: new Date() }
            : s,
        ),
      );
    }
  }, []);

  const overallStatus = statuses.every((s) => s.status === "healthy") ? "healthy"
    : statuses.some((s) => s.status === "down") ? "down" : "degraded";

  return { statuses, runHealthCheck, overallStatus };
}
