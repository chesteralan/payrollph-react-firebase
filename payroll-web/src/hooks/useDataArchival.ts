import { useCallback } from "react";
import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useDataArchival() {
  const archiveOldPayrolls = useCallback(async (cutoffDate: Date) => {
    const snap = await getDocs(
      query(
        collection(db, "payroll"),
        where("createdAt", "<", cutoffDate),
        where("status", "==", "published"),
      ),
    );

    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(doc(db, "payroll", d.id), { archived: true, archivedAt: new Date() });
    });
    await batch.commit();

    return snap.size;
  }, []);

  const restoreArchived = useCallback(async (payrollId: string) => {
    await writeBatch(db)
      .update(doc(db, "payroll", payrollId), { archived: false, archivedAt: null })
      .commit();
  }, []);

  return { archiveOldPayrolls, restoreArchived };
}
