import { useState, useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";

export function useAuditLog() {
  const { user } = useAuth();
  const [logging, setLogging] = useState(false);

  const log = useCallback(
    async (
      action: string,
      module: string,
      entityId: string,
      details?: Record<string, unknown>,
    ) => {
      if (!user) return;
      setLogging(true);
      try {
        await addDoc(collection(db, "system_audit"), {
          userId: user.uid,
          userEmail: user.email,
          action,
          module,
          entityId,
          details: details || {},
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        console.error("Audit log failed:", err);
      } finally {
        setLogging(false);
      }
    },
    [user],
  );

  return { log, logging };
}
