import { useCallback } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/config/firebase";

interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  module: string;
  entityId: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export function useAuditTrail() {
  const fetchAuditLog = useCallback(
    async (
      filters?: {
        userId?: string;
        action?: string;
        module?: string;
        entityId?: string;
        limit?: number;
      },
    ): Promise<AuditEntry[]> => {
      const constraints = [];
      if (filters?.userId) constraints.push(where("userId", "==", filters.userId));
      if (filters?.action) constraints.push(where("action", "==", filters.action));
      if (filters?.module) constraints.push(where("module", "==", filters.module));
      if (filters?.entityId) constraints.push(where("entityId", "==", filters.entityId));
      constraints.push(orderBy("timestamp", "desc"));
      constraints.push(limit(filters?.limit || 100));

      const snap = await getDocs(
        query(collection(db, "system_audit"), ...constraints),
      );
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        timestamp: (d.data().timestamp?.toDate?.() || new Date()) as Date,
      })) as AuditEntry[];
    },
    [],
  );

  return { fetchAuditLog };
}
