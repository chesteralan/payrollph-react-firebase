import { useCallback } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useDenormalizedCounts() {
  const getCount = useCallback(async (collectionName: string): Promise<number> => {
    try {
      const snap = await getDocs(query(collection(db, collectionName), limit(1000)));
      return snap.size;
    } catch {
      return -1;
    }
  }, []);

  const getActiveEmployeeCount = useCallback(async (companyId: string): Promise<number> => {
    try {
      const { where } = await import("firebase/firestore");
      const snap = await getDocs(
        query(
          collection(db, "employees"),
          where("companyId", "==", companyId),
          where("isActive", "==", true),
        ),
      );
      return snap.size;
    } catch {
      return -1;
    }
  }, []);

  return { getCount, getActiveEmployeeCount };
}
