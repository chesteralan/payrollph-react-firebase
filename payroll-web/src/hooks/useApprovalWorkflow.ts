import { useState, useCallback } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

interface ApprovalRequest {
  id: string;
  type: "payroll" | "overtime" | "leave" | "employee";
  requesterId: string;
  subject: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export function useApprovalWorkflow() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);

  const fetchPending = useCallback(async () => {
    const snap = await getDocs(
      query(collection(db, "approval_requests"), where("status", "==", "pending")),
    );
    setRequests(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || new Date(),
      })) as ApprovalRequest[],
    );
  }, []);

  const approve = useCallback(async (id: string) => {
    await addDoc(collection(db, "system_audit"), {
      action: "approve",
      entityId: id,
      timestamp: serverTimestamp(),
    });
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)));
  }, []);

  const reject = useCallback(async (id: string, reason?: string) => {
    await addDoc(collection(db, "system_audit"), {
      action: "reject",
      entityId: id,
      reason: reason || "",
      timestamp: serverTimestamp(),
    });
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)));
  }, []);

  return { requests, fetchPending, approve, reject };
}
