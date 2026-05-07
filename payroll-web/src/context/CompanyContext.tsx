import { useState } from "react";
import type { Company } from "../types";
import { CompanyContext } from "./company";

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading] = useState(false);

  const selectCompany = (company: Company) => {
    setSelectedCompany(company);
  };

  return (
    <CompanyContext.Provider
      value={{ companies, selectedCompany, selectCompany, loading }}
    >
      {children}
    </CompanyContext.Provider>
  );
}
