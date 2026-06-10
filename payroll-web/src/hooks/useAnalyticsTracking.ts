import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
}

export function useAnalyticsTracking() {
  const [queue, setQueue] = useState<AnalyticsEvent[]>([]);

  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      const ev: AnalyticsEvent = { event, properties, timestamp: new Date() };
      setQueue((prev) => [...prev, ev]);

      addDoc(collection(db, "analytics_events"), {
        event,
        properties: properties || {},
        timestamp: serverTimestamp(),
      }).catch(() => {
        // silently fail - analytics should not block UX
      });
    },
    [],
  );

  return { track, queue };
}
