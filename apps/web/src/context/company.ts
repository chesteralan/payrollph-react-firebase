import { createContext } from "react";
import type { Company } from "../types";

export interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  selectCompany: (company: Company) => void;
  loading: boolean;
}

export const CompanyContext = createContext<CompanyContextType | undefined>(
  undefined,
);
