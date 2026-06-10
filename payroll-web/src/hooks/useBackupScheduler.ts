import { useCallback, useEffect, useRef } from "react";

export function useBackupScheduler(intervalMs = 3600000) {
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const scheduleBackup = useCallback(() => {
    timerRef.current = setInterval(async () => {
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const { db } = await import("@/config/firebase");
        const snap = await getDocs(collection(db, "backup_metadata"));
        // Backup logic - placeholder
        console.log(`Scheduled backup check: ${snap.size} metadata entries`);
      } catch (err) {
        console.error("Scheduled backup failed:", err);
      }
    }, intervalMs);
  }, [intervalMs]);

  const cancelBackup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => () => cancelBackup(), [cancelBackup]);

  return { scheduleBackup, cancelBackup };
}
