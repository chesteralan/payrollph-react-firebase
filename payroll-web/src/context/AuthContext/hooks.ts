import {
  useCallback,
  useMemo,
  useContext,
  createContext,
  useSyncExternalStore,
} from "react";
import type { UserRestriction, Department, Section } from "@/types";
import { ValueStore } from "@/utils/valueStore";

// ──────────────────────────────────────────────
// Store context for subscription-based selector hooks
// ──────────────────────────────────────────────
export interface AuthStores {
  user: ValueStore<UserAccount | null>;
  currentCompanyId: ValueStore<string | null>;
  loading: ValueStore<boolean>;
  restrictions: ValueStore<UserRestriction[]>;
}

export const AuthStoreContext = createContext<AuthStores | null>(null);

// Need to import UserAccount type without circular dependency
import type { UserAccount } from "@/types";

// ──────────────────────────────────────────────
// Selector hooks (useSyncExternalStore-based)
// ──────────────────────────────────────────────
function useStoreValue<T>(store: ValueStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

/**
 * Returns only the currentCompanyId — component re-renders ONLY when
 * this specific value changes, not when any other auth state changes.
 */
export function useCurrentCompanyId(): string | null {
  const stores = useContext(AuthStoreContext);
  if (!stores) {
    throw new Error("useCurrentCompanyId must be used within AuthProvider");
  }
  return useStoreValue(stores.currentCompanyId);
}

/**
 * Returns only the current user — component re-renders ONLY when
 * the user object changes.
 */
export function useCurrentUser(): UserAccount | null {
  const stores = useContext(AuthStoreContext);
  if (!stores) {
    throw new Error("useCurrentUser must be used within AuthProvider");
  }
  return useStoreValue(stores.user);
}

/**
 * Returns only the loading state — component re-renders ONLY when
 * loading status changes.
 */
export function useAuthLoading(): boolean {
  const stores = useContext(AuthStoreContext);
  if (!stores) {
    throw new Error("useAuthLoading must be used within AuthProvider");
  }
  return useStoreValue(stores.loading);
}

/**
 * Returns restrictions and a hasPermission checker — component re-renders
 * ONLY when restrictions change.
 */
export function useUserPermissions(): {
  restrictions: UserRestriction[];
  hasPermission: (
    department: Department,
    section: Section,
    action: "view" | "add" | "edit" | "delete",
  ) => boolean;
} {
  const stores = useContext(AuthStoreContext);
  if (!stores) {
    throw new Error("useUserPermissions must be used within AuthProvider");
  }
  const restrictions = useStoreValue(stores.restrictions);

  const hasPermission = useCallback(
    (
      department: Department,
      section: Section,
      action: "view" | "add" | "edit" | "delete",
    ): boolean => {
      const restriction = restrictions.find(
        (r) => r.department === department && r.section === section,
      );
      if (!restriction) return false;
      if (action === "view") return restriction.canView;
      if (action === "add") return restriction.canAdd;
      if (action === "edit") return restriction.canEdit;
      if (action === "delete") return restriction.canDelete;
      return false;
    },
    [restrictions],
  );

  return useMemo(
    () => ({ restrictions, hasPermission }),
    [restrictions, hasPermission],
  );
}
