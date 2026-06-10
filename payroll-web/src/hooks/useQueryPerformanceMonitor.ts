import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useState, useCallback } from "react";

interface SlowQueryWarning {
  collection: string;
  durationMs: number;
  filters: string;
  suggestion: string;
}

export function useQueryPerformanceMonitor() {
  const [warnings, setWarnings] = useState<SlowQueryWarning[]>([]);

  const monitoredQuery = useCallback(
    async (collectionName: string, field: string, value: unknown) => {
      const start = performance.now();
      const q = query(
        collection(db, collectionName),
        where(field, "==", value),
        limit(100),
      );
      const snap = await getDocs(q);
      const duration = performance.now() - start;

      if (duration > 1000) {
        const warning: SlowQueryWarning = {
          collection: collectionName,
          durationMs: Math.round(duration),
          filters: `${field} == ${value}`,
          suggestion: `Query on ${collectionName} took ${Math.round(duration)}ms. Consider adding a composite index for ${field}.`,
        };
        setWarnings((prev) => [...prev.slice(-9), warning]);
      }

      return snap;
    },
    [],
  );

  return { monitoredQuery, warnings, clearWarnings: () => setWarnings([]) };
}
