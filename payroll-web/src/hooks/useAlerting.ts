import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

interface AlertConfig {
  type: "security" | "performance" | "error" | "info";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details?: Record<string, unknown>;
}

export function useAlerting() {
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);

  const sendAlert = useCallback(async (config: AlertConfig) => {
    setAlerts((prev) => [config, ...prev.slice(-49)]);

    try {
      await addDoc(collection(db, "system_alerts"), {
        ...config,
        createdAt: serverTimestamp(),
        acknowledged: false,
      });
    } catch (err) {
      console.error("Failed to persist alert:", err);
    }

    if (config.severity === "critical" || config.severity === "high") {
      console.warn(`[ALERT] ${config.severity}: ${config.message}`, config.details);
    }
  }, []);

  const acknowledgeAlert = useCallback((index: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return { alerts, sendAlert, acknowledgeAlert };
}
