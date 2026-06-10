import { useCallback } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "./useAuth";

export function useSelfService() {
  const { user } = useAuth();

  const getPayslip = useCallback(
    async (payrollId: string, employeeId: string) => {
      if (!user) return null;
      const snap = await getDoc(doc(db, "payroll_employees", `${payrollId}_${employeeId}`));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },
    [user],
  );

  const getPayrollHistory = useCallback(async () => {
    if (!user) return [];
    const { collection, query, where, getDocs } = await import("firebase/firestore");
    const snap = await getDocs(query(collection(db, "payroll"), where("companyId", "==", user.uid)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }, [user]);

  const updatePersonalInfo = useCallback(
    async (updates: Record<string, unknown>) => {
      if (!user) return;
      await updateDoc(doc(db, "user_accounts", user.uid), updates);
    },
    [user],
  );

  return { getPayslip, getPayrollHistory, updatePersonalInfo };
}
