import { useCallback, useRef } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useDataPrefetch() {
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prefetch = useCallback(async (collectionName: string, companyId?: string) => {
    const key = `${collectionName}-${companyId || "all"}`;
    if (prefetchedRef.current.has(key)) return;

    try {
      const constraints = [];
      if (companyId) {
        const { where: w } = await import("firebase/firestore");
        constraints.push(w("companyId", "==", companyId));
      }
      const snap = await getDocs(query(collection(db, collectionName), ...constraints));
      prefetchedRef.current.add(key);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch {
      // prefetch failure is non-critical
    }
  }, []);

  return { prefetch };
}
