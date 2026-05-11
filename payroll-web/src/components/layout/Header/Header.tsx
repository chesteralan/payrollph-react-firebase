import { useAuth } from "../../hooks/useAuth";
import {
  Building2,
  ChevronDown,
  Settings,
  Lock,
  LogOut,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import type { Company } from "../../types";

import type { HeaderProps } from "./Header/Header.types";

export function Header({ onMenuClick }: HeaderProps) {
  const { user, currentCompanyId, setCurrentCompanyId, logout } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchCompanies = async () => {
        const snap = await getDocs(
          query(collection(db, "companies"), where("isActive", "==", true)),
        );
        setCompanies(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Company[],
        );
      };
      fetchCompanies();
    }
  }, [user]);

  const selectedCompany = companies.find((c) => c.id === currentCompanyId);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-gray-700 hover:text-gray-900"
          aria-label="Open sidebar menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        {companies.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              aria-expanded={showCompanyDropdown}
              aria-haspopup="listbox"
              aria-label={
                selectedCompany?.name
                  ? `Current company: ${selectedCompany.name}`
                  : "Select company"
              }
            >
              <Building2 className="w-4 h-4" aria-hidden="true" />
              <span>{selectedCompany?.name || "Select Company"}</span>
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </button>
            {showCompanyDropdown && (
              <div
                className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                role="listbox"
                aria-label="Select company"
              >
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setCurrentCompanyId(company.id);
                      setShowCompanyDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    role="option"
                    aria-selected={company.id === currentCompanyId}
                  >
                    <Building2 className="w-4 h-4" aria-hidden="true" />
                    <span>{company.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-md"
            aria-expanded={showUserDropdown}
            aria-haspopup="true"
            aria-label={`User menu for ${user?.displayName || "unknown"}`}
          >
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" aria-hidden="true" />
            </div>
            <span className="text-sm text-gray-700">{user?.displayName}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />
          </button>
          {showUserDropdown && (
            <div
              className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10"
              role="menu"
              aria-label="User menu"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate("/settings");
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  role="menuitem"
                >
                  <Settings className="w-4 h-4" aria-hidden="true" />
                  Settings
                </button>
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate("/change-password");
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  role="menuitem"
                >
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  Change Password
                </button>
              </div>
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
