import { useState, useCallback } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useSessionRevocation() {
  const [revoking, setRevoking] = useState(false);

  const revokeAllSessions = useCallback(async (userId: string) => {
    setRevoking(true);
    try {
      await updateDoc(doc(db, "user_accounts", userId), {
        tokenVersion: new Date().getTime(),
        lastRevoked: new Date(),
      });
      return true;
    } catch (err) {
      console.error("Failed to revoke sessions:", err);
      return false;
    } finally {
      setRevoking(false);
    }
  }, []);

  const checkSessionValid = useCallback(async (userId: string, tokenVersion: number) => {
    const snap = await getDoc(doc(db, "user_accounts", userId));
    if (!snap.exists()) return false;
    const data = snap.data();
    return (data.tokenVersion || 0) <= tokenVersion;
  }, []);

  return { revokeAllSessions, checkSessionValid, revoking };
}
