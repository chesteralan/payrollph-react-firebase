import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Building2, ChevronDown, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { useRef, useState } from "react";

import { navigation } from "./navConfig";
import type { NavItem, SidebarProps } from "./Sidebar.types";
import type { Department, Section } from "../../../types";

function NavItemComponent({
  item,
  level = 0,
  onItemClick,
}: {
  item: NavItem;
  level?: number;
  onItemClick?: () => void;
}) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const { canView } = usePermissions();

  const isActive = item.path === location.pathname;
  const isChildActive = item.children?.some(
    (child) => child.path === location.pathname,
  );

  if (
    item.department &&
    item.section &&
    !canView(item.department as Department, item.section as Section)
  ) {
    return null;
  }

  if (item.children) {
    const hasVisibleChildren = item.children.some(
      (child) =>
        !child.department ||
        !child.section ||
        canView(child.department as Department, child.section as Section),
    );

    if (!hasVisibleChildren) return null;

    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
            isChildActive
              ? "bg-sidebar-active text-white"
              : "text-gray-300 hover:bg-sidebar-hover hover:text-white",
          )}
          aria-expanded={expanded}
          aria-label={`${item.label} section`}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.label}</span>
          {expanded ? (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
        {expanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children.map((child, i) => (
              <NavItemComponent
                key={i}
                item={child}
                level={level + 1}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.path || "#"}
      onClick={onItemClick}
      className={clsx(
        "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
        isActive
          ? "bg-sidebar-active text-white"
          : "text-gray-300 hover:bg-sidebar-hover hover:text-white",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { userCompanies, currentCompanyId, setCurrentCompanyId } = useAuth();
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCompany = userCompanies.find(
    (c) => c.companyId === currentCompanyId,
  );

  const handleCompanyChange = (companyId: string) => {
    setCurrentCompanyId(companyId);
    setShowCompanyDropdown(false);
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <>
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h1 className="text-xl font-bold text-white">SMB Payroll</h1>
            <p className="text-xs text-gray-400 mt-1">v2.0</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-300 hover:text-white"
            aria-label="Close sidebar menu"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
          aria-label="Main navigation"
        >
          {navigation.map((item, i) => (
            <NavItemComponent
              key={i}
              item={item}
              onItemClick={handleNavClick}
            />
          ))}
        </nav>

        {userCompanies.length > 1 && (
          <div className="px-3 py-4 border-t border-gray-700" ref={dropdownRef}>
            <div className="relative mb-2">
              <button
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover hover:text-white rounded-md transition-colors"
                aria-label="Change company"
                aria-expanded={showCompanyDropdown}
                aria-haspopup="listbox"
              >
                <Building2 className="w-4 h-4" aria-hidden="true" />
                <span className="flex-1 text-left truncate">
                  {currentCompany?.companyId || "Select Company"}
                </span>
                <ChevronDown
                  className={clsx(
                    "w-4 h-4 transition-transform",
                    showCompanyDropdown && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>
              {showCompanyDropdown && (
                <div
                  className="absolute bottom-full left-0 right-0 mb-1 bg-sidebar-hover rounded-md shadow-lg py-1 z-10"
                  role="listbox"
                  aria-label="Select company"
                >
                  {userCompanies.map((company) => (
                    <button
                      key={company.companyId}
                      onClick={() => handleCompanyChange(company.companyId)}
                      className={clsx(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md transition-colors",
                        company.companyId === currentCompanyId
                          ? "bg-sidebar-active text-white"
                          : "text-gray-300 hover:bg-sidebar-hover hover:text-white",
                      )}
                      role="option"
                      aria-selected={company.companyId === currentCompanyId}
                    >
                      <Building2 className="w-4 h-4" aria-hidden="true" />
                      <span className="truncate">{company.companyId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
