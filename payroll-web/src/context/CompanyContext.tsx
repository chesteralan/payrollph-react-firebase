import { createContext, useContext, useState } from 'react'
import type { Company } from '../types'

interface CompanyContextType {
  companies: Company[]
  selectedCompany: Company | null
  selectCompany: (company: Company) => void
  loading: boolean
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [loading] = useState(false)

  const selectCompany = (company: Company) => {
    setSelectedCompany(company)
  }

  return (
    <CompanyContext.Provider value={{ companies, selectedCompany, selectCompany, loading }}>
      {children}
    </CompanyContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompany() {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider')
  }
  return context
}
