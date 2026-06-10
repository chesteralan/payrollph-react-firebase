import { useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";

export function useRollbackOnFail<T>(
  operation: () => Promise<T>,
  rollback: () => Promise<void>,
) {
  const execute = useCallback(async () => {
    try {
      return await operation();
    } catch (err) {
      await rollback();
      throw err;
    }
  }, [operation, rollback]);

  return { execute };
}

export function useSafeLogout() {
  const logout = useCallback(async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await signOut(auth);
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
      window.location.href = "/login";
    }
  }, []);

  return { logout };
}
