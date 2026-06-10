import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";

interface UsePayrollCloneOptions {
  payrollId: string;
  onComplete?: (newId: string) => void;
}

export function usePayrollClone({
  payrollId,
  onComplete,
}: UsePayrollCloneOptions) {
  const [cloning, setCloning] = useState(false);
  const { currentCompanyId } = useAuth();
  const navigate = useNavigate();

  const clonePayroll = useCallback(
    async (options: Record<string, boolean>) => {
      if (!currentCompanyId) return;
      setCloning(true);
      try {
        const newDoc = await addDoc(collection(db, "payroll"), {
          name: `Copy of ...`,
          companyId: currentCompanyId,
          status: "draft",
          isActive: true,
          isLocked: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (options.dates) {
          const datesSnap = await getDocs(
            query(
              collection(db, "payroll_inclusive_dates"),
              where("payrollId", "==", payrollId),
            ),
          );
          for (const d of datesSnap.docs) {
            await addDoc(collection(db, "payroll_inclusive_dates"), {
              payrollId: newDoc.id,
              ...d.data(),
            });
          }
        }

        if (options.groups) {
          const groupsSnap = await getDocs(
            query(
              collection(db, "payroll_groups"),
              where("payrollId", "==", payrollId),
            ),
          );
          for (const g of groupsSnap.docs) {
            await addDoc(collection(db, "payroll_groups"), {
              payrollId: newDoc.id,
              ...g.data(),
            });
          }
        }

        onComplete?.(newDoc.id);
        navigate(`/payroll/${newDoc.id}`);
      } finally {
        setCloning(false);
      }
    },
    [payrollId, currentCompanyId, navigate, onComplete],
  );

  return { clonePayroll, cloning };
}
