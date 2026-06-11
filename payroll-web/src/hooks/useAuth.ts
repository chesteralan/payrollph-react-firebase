import { useContext } from "react";
import { AuthContext } from "@/context/auth";
import type { AuthContextType } from "@/context/auth";

/**
 * Hook to access the current authentication context.
 * Provides access to the current user, company ID, loading state, and permissions.
 * Must be used within an AuthProvider.
 *
 * @returns The AuthContextType containing:
 *  - currentUser / user: The authenticated user object
 *  - currentCompanyId: The ID of the currently selected company
 *  - loading / isAuthLoading: Loading state flags
 *  - hasPermission: Function to check RBAC permissions
 *  - login, logout, etc.
 *
 * @throws {Error} If used outside of an AuthProvider
 *
 * @example
 * ```tsx
 * const { currentUser, hasPermission, loading } = useAuth();
 * if (loading) return <Spinner />;
 * if (!currentUser) return <LoginPage />;
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/**
 * Convenience re-exports from AuthContext for granular subscriptions.
 * Using these selectors avoids re-renders that would occur with the full `useAuth` hook.
 *
 * @returns
 * - `useCurrentCompanyId()` — The currently selected company ID
 * - `useCurrentUser()` — The current authenticated user object
 * - `useAuthLoading()` — The global authentication loading state
 * - `useUserPermissions()` — The current user's permission map
 */
export {
  useCurrentCompanyId,
  useCurrentUser,
  useAuthLoading,
  useUserPermissions,
} from "@/context/AuthContext";
