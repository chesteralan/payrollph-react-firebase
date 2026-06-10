import { useState, useCallback } from "react";

interface IpAccessEntry {
  ip: string;
  timestamp: Date;
  userId: string;
  action: "login" | "logout" | "blocked";
  location?: string;
}

export function useIpAccessLogging() {
  const [entries, setEntries] = useState<IpAccessEntry[]>([]);

  const logAccess = useCallback(
    (ip: string, userId: string, action: IpAccessEntry["action"]) => {
      const entry: IpAccessEntry = {
        ip,
        timestamp: new Date(),
        userId,
        action,
      };
      setEntries((prev) => [entry, ...prev.slice(-199)]);
      console.log(`[IP Access] ${action} - ${userId} from ${ip}`);
    },
    [],
  );

  const detectAnomalies = useCallback(() => {
    const grouped: Record<string, IpAccessEntry[]> = {};
    entries.forEach((e) => {
      if (!grouped[e.userId]) grouped[e.userId] = [];
      grouped[e.userId].push(e);
    });

    return Object.entries(grouped)
      .filter(([, userEntries]) => {
        const ips = new Set(userEntries.map((e) => e.ip));
        return ips.size > 3;
      })
      .map(([userId, userEntries]) => ({
        userId,
        ipCount: new Set(userEntries.map((e) => e.ip)).size,
        lastIp: userEntries[0].ip,
      }));
  }, [entries]);

  return { entries, logAccess, detectAnomalies };
}
