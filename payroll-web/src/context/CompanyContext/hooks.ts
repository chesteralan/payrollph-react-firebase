import { useContext, createContext, useSyncExternalStore } from "react";
import type { Company } from "@/types";
import { ValueStore } from "@/utils/valueStore";

// ──────────────────────────────────────────────
// Store context for subscription-based selector
// ──────────────────────────────────────────────
export interface CompanyStores {
  selectedCompany: ValueStore<Company | null>;
  companies: ValueStore<Company[]>;
  loading: ValueStore<boolean>;
}

export const CompanyStoreContext = createContext<CompanyStores | null>(null);

// ──────────────────────────────────────────────
// Selector hooks (useSyncExternalStore-based)
// ──────────────────────────────────────────────
function useStoreValue<T>(store: ValueStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

/**
 * Returns only the currently selected company — component re-renders ONLY
 * when the selected company changes.
 */
export function useCurrentCompany(): Company | null {
  const stores = useContext(CompanyStoreContext);
  if (!stores) {
    throw new Error("useCurrentCompany must be used within CompanyProvider");
  }
  return useStoreValue(stores.selectedCompany);
}

/**
 * Returns the list of available companies — component re-renders ONLY
 * when the companies list changes.
 */
export function useCompanies(): Company[] {
  const stores = useContext(CompanyStoreContext);
  if (!stores) {
    throw new Error("useCompanies must be used within CompanyProvider");
  }
  return useStoreValue(stores.companies);
}

/**
 * Returns the company loading state — component re-renders ONLY
 * when loading status changes.
 */
export function useCompanyLoading(): boolean {
  const stores = useContext(CompanyStoreContext);
  if (!stores) {
    throw new Error("useCompanyLoading must be used within CompanyProvider");
  }
  return useStoreValue(stores.loading);
}
