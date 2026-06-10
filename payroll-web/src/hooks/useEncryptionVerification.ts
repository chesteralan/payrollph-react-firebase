import { useCallback, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

export function useEncryptionVerification() {
  const cacheRef = useRef<Set<string>>(new Set());

  const verifyFieldEncryption = useCallback(async (userId: string, field: string): Promise<boolean> => {
    const key = `${userId}:${field}`;
    if (cacheRef.current.has(key)) return true;

    try {
      const snap = await getDoc(doc(db, "user_accounts", userId));
      if (!snap.exists()) return false;

      const data = snap.data();
      const value = data[field];

      if (!value || typeof value !== "string") return false;
      const isEncrypted = value.startsWith("enc:");
      if (isEncrypted) cacheRef.current.add(key);
      return isEncrypted;
    } catch {
      return false;
    }
  }, []);

  const clearCache = useCallback(() => cacheRef.current.clear(), []);

  return { verifyFieldEncryption, clearCache };
}
