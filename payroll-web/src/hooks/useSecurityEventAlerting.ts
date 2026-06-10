import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useSecurityEventAlerting() {
  const [events, setEvents] = useState<{ type: string; message: string; timestamp: Date }[]>([]);

  const reportEvent = useCallback(async (type: string, message: string, metadata?: Record<string, unknown>) => {
    const event = { type, message, timestamp: new Date() };
    setEvents((prev) => [event, ...prev.slice(-49)]);

    try {
      await addDoc(collection(db, "security_events"), {
        type,
        message,
        metadata: metadata || {},
        createdAt: serverTimestamp(),
      });
    } catch {
      // fail silently
    }

    if (type === "security_breach" || type === "unauthorized_access") {
      console.error(`[SECURITY] ${type}: ${message}`);
    }
  }, []);

  return { events, reportEvent };
}
