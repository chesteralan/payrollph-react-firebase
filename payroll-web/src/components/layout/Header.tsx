import { useAuth } from '../../hooks/useAuth'
import { Building2, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import type { Company } from '../../types'

export function Header() {
  const { user, currentCompanyId, setCurrentCompanyId } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (user) {
      const fetchCompanies = async () => {
        const snap = await getDocs(query(collection(db, 'companies'), where('isActive', '==', true)))
        setCompanies(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Company[])
      }
      fetchCompanies()
    }
  }, [user])

  const selectedCompany = companies.find((c) => c.id === currentCompanyId)

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        {companies.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Building2 className="w-4 h-4" />
              <span>{selectedCompany?.name || 'Select Company'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setCurrentCompanyId(company.id)
                      setShowDropdown(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{company.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.displayName}</span>
      </div>
    </header>
  )
}
