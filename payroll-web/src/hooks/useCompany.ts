import { useContext } from "react";
import { CompanyContext } from "@/context/company";

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
}

// Re-export selector hooks for convenience
export {
  useCurrentCompany,
  useCompanies,
  useCompanyLoading,
} from "@/context/CompanyContext";
