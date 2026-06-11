import {
  useState,
  useRef,
  useMemo,
  useCallback,
  useSyncExternalStore,
  createContext,
  useContext,
} from "react";
import type { Company } from "@/types";
import { CompanyContext } from "@/context/company";

// ──────────────────────────────────────────────
// Minimal observable store for useSyncExternalStore
// ──────────────────────────────────────────────
class ValueStore<T> {
  private value: T;
  private listeners = new Set<() => void>();

  constructor(initial: T) {
    this.value = initial;
  }

  getSnapshot = (): T => this.value;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  set = (newValue: T): void => {
    if (!Object.is(this.value, newValue)) {
      this.value = newValue;
      this.listeners.forEach((l) => l());
    }
  };
}

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

// ──────────────────────────────────────────────
// CompanyProvider component
// ──────────────────────────────────────────────
export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize observable stores for selector hooks
  const storesRef = useRef<CompanyStores | null>(null);
  if (!storesRef.current) {
    storesRef.current = {
      selectedCompany: new ValueStore<Company | null>(null),
      companies: new ValueStore<Company[]>([]),
      loading: new ValueStore<boolean>(false),
    };
  }

  // Sync observable stores when state changes (during render)
  const stores = storesRef.current;
  stores.selectedCompany.set(selectedCompany);
  stores.companies.set(companies);
  stores.loading.set(loading);

  const selectCompany = useCallback((company: Company) => {
    setSelectedCompany(company);
  }, []);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
      companies,
      selectedCompany,
      selectCompany,
      loading,
    }),
    [companies, selectedCompany, selectCompany, loading],
  );

  return (
    <CompanyStoreContext.Provider value={stores}>
      <CompanyContext.Provider value={contextValue}>
        {children}
      </CompanyContext.Provider>
    </CompanyStoreContext.Provider>
  );
}
