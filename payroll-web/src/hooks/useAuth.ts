import { useContext } from "react";
import { AuthContext } from "@/context/auth";
import type { AuthContextType } from "@/context/auth";

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Re-export selector hooks for convenience
export {
  useCurrentCompanyId,
  useCurrentUser,
  useAuthLoading,
  useUserPermissions,
} from "@/context/AuthContext";
