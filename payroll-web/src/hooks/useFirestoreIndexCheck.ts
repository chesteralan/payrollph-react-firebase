import { useMemo } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useFirestoreIndexCheck() {
  const suggestions = useMemo(
    () => [
      { collection: "payroll", fields: ["companyId", "createdAt", "status"] },
      { collection: "employees", fields: ["companyId", "isActive", "nameId"] },
      { collection: "system_audit", fields: ["userId", "timestamp", "action"] },
      { collection: "payroll_employees", fields: ["payrollId", "nameId"] },
    ],
    [],
  );

  const checkQueryPerformance = async (collectionName: string) => {
    const start = performance.now();
    const snap = await getDocs(query(collection(db, collectionName)));
    const duration = performance.now() - start;
    return { count: snap.size, durationMs: Math.round(duration) };
  };

  return { suggestions, checkQueryPerformance };
}
