import {
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import type { Company } from "@/types";
import { CompanyContext } from "@/context/company";
import { ValueStore } from "@/utils/valueStore";
import { CompanyStoreContext } from "./hooks";
import type { CompanyStores } from "./hooks";

// ──────────────────────────────────────────────
// CompanyProvider component
// ──────────────────────────────────────────────
export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading] = useState(false);

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
