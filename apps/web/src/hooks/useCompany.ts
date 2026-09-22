import { useContext } from "react";
import { CompanyContext } from "@/context/company";

/**
 * Hook to access the current company context.
 * Provides the currently selected company, the list of all companies,
 * and loading state. Must be used within a CompanyProvider.
 *
 * @returns The CompanyContext containing:
 *  - `company` / `currentCompany`: The currently selected company object
 *  - `companies`: List of all companies accessible to the user
 *  - `loading` / `companyLoading`: Whether company data is still loading
 *  - `switchCompany(id)`: Function to change the active company
 *
 * @throws {Error} If used outside of a CompanyProvider
 *
 * @example
 * ```tsx
 * const { company, companies, switchCompany } = useCompany();
 * if (!company) return <CompanySelector companies={companies} onSelect={switchCompany} />;
 * ```
 */
export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
}

/**
 * Convenience re-exports from CompanyContext for granular subscriptions.
 * Using these selectors avoids re-renders that would occur with the full `useCompany` hook.
 *
 * @returns
 * - `useCurrentCompany()` — The currently selected company
 * - `useCompanies()` — The full list of accessible companies
 * - `useCompanyLoading()` — The company data loading state
 */
export {
  useCurrentCompany,
  useCompanies,
  useCompanyLoading,
} from "@/context/CompanyContext";
