import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Layers,
  MapPin,
  Briefcase,
  FileText,
  ListChecks,
  Banknote,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  CopyPlus,
  Lock,
  BarChart3,
  Settings,
  Building2,
  Calendar,
  UserCog,
  ShieldCheck,
  Database,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Activity,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

import type { NavItem, SidebarProps } from "./Sidebar/Sidebar.types";

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    path: "/",
  },
  {
    label: "Employees",
    icon: <Users className="w-4 h-4" />,
    department: "employees",
    children: [
      {
        label: "Employee Registry",
        icon: <Users className="w-4 h-4" />,
        path: "/employees",
        department: "employees",
        section: "employees",
      },
      {
        label: "Calendar",
        icon: <CalendarDays className="w-4 h-4" />,
        path: "/employees/calendar",
        department: "employees",
        section: "calendar",
      },
      {
        label: "Groups",
        icon: <Layers className="w-4 h-4" />,
        path: "/employees/groups",
        department: "employees",
        section: "groups",
      },
      {
        label: "Positions",
        icon: <Briefcase className="w-4 h-4" />,
        path: "/employees/positions",
        department: "employees",
        section: "positions",
      },
      {
        label: "Areas",
        icon: <MapPin className="w-4 h-4" />,
        path: "/employees/areas",
        department: "employees",
        section: "areas",
      },
    ],
  },
  {
    label: "Lists",
    icon: <ListChecks className="w-4 h-4" />,
    department: "lists",
    children: [
      {
        label: "Names",
        icon: <FileText className="w-4 h-4" />,
        path: "/lists/names",
        department: "lists",
        section: "names",
      },
      {
        label: "Benefits",
        icon: <Banknote className="w-4 h-4" />,
        path: "/lists/benefits",
        department: "lists",
        section: "benefits",
      },
      {
        label: "Earnings",
        icon: <ArrowUpFromLine className="w-4 h-4" />,
        path: "/lists/earnings",
        department: "lists",
        section: "earnings",
      },
      {
        label: "Deductions",
        icon: <ArrowDownToLine className="w-4 h-4" />,
        path: "/lists/deductions",
        department: "lists",
        section: "deductions",
      },
    ],
  },
  {
    label: "Payroll",
    icon: <CreditCard className="w-4 h-4" />,
    department: "payroll",
    children: [
      {
        label: "Payroll Runs",
        icon: <CreditCard className="w-4 h-4" />,
        path: "/payroll",
        department: "payroll",
        section: "payroll",
      },
      {
        label: "New Payroll",
        icon: <Plus className="w-4 h-4" />,
        path: "/payroll/new",
        department: "payroll",
        section: "payroll",
      },
      {
        label: "Templates",
        icon: <CopyPlus className="w-4 h-4" />,
        path: "/payroll/templates",
        department: "payroll",
        section: "templates",
      },
      {
        label: "Print Formats",
        icon: <FileText className="w-4 h-4" />,
        path: "/payroll/print-formats",
        department: "payroll",
        section: "templates",
      },
    ],
  },
  {
    label: "Reports",
    icon: <BarChart3 className="w-4 h-4" />,
    department: "reports",
    children: [
      {
        label: "13th Month",
        icon: <BarChart3 className="w-4 h-4" />,
        path: "/reports/13th-month",
        department: "reports",
        section: "13month",
      },
      {
        label: "Payroll Summary",
        icon: <BarChart3 className="w-4 h-4" />,
        path: "/reports/payroll-summary",
        department: "reports",
        section: "payroll",
      },
      {
        label: "Employee Master List",
        icon: <Users className="w-4 h-4" />,
        path: "/reports/employees",
        department: "reports",
        section: "employees",
      },
      {
        label: "Earnings/Deductions",
        icon: <BarChart3 className="w-4 h-4" />,
        path: "/reports/earnings-deductions",
        department: "reports",
        section: "payroll",
      },
      {
        label: "Attendance",
        icon: <BarChart3 className="w-4 h-4" />,
        path: "/reports/attendance",
        department: "reports",
        section: "attendance",
      },
      {
        label: "Benefits Utilization",
        icon: <BarChart3 className="w-4 h-4" />,
        path: "/reports/benefits-utilization",
        department: "reports",
        section: "payroll",
      },
      {
        label: "Year-End",
        icon: <BarChart3 className="w-4 h-4" />,
        path: "/reports/year-end",
        department: "reports",
        section: "payroll",
      },
    ],
  },
  {
    label: "System",
    icon: <Settings className="w-4 h-4" />,
    department: "system",
    children: [
      {
        label: "Companies",
        icon: <Building2 className="w-4 h-4" />,
        path: "/system/companies",
        department: "system",
        section: "companies",
      },
      {
        label: "Company Settings",
        icon: <Settings className="w-4 h-4" />,
        path: "/system/company-settings",
        department: "system",
        section: "companies",
      },
      {
        label: "Calendar",
        icon: <Calendar className="w-4 h-4" />,
        path: "/system/calendar",
        department: "system",
        section: "calendar",
      },
      {
        label: "Terms",
        icon: <FileText className="w-4 h-4" />,
        path: "/system/terms",
        department: "system",
        section: "terms",
      },
      {
        label: "Users",
        icon: <UserCog className="w-4 h-4" />,
        path: "/system/users",
        department: "system",
        section: "users",
      },
      {
        label: "Restrictions",
        icon: <ShieldCheck className="w-4 h-4" />,
        path: "/system/restrictions",
        department: "system",
        section: "users",
      },
      {
        label: "Audit Log",
        icon: <Lock className="w-4 h-4" />,
        path: "/system/audit",
        department: "system",
        section: "audit",
      },
      {
        label: "Database",
        icon: <Database className="w-4 h-4" />,
        path: "/system/database",
        department: "system",
        section: "database",
      },
      {
        label: "Settings",
        icon: <Settings className="w-4 h-4" />,
        path: "/system/settings",
        department: "system",
        section: "companies",
      },
      {
        label: "Trash",
        icon: <Trash2 className="w-4 h-4" />,
        path: "/system/trash",
        department: "system",
        section: "companies",
      },
      {
        label: "Health Check",
        icon: <Activity className="w-4 h-4" />,
        path: "/system/health",
        department: "system",
        section: "database",
      },
      {
        label: "Activity Monitor",
        icon: <Activity className="w-4 h-4" />,
        path: "/system/activity",
        department: "system",
        section: "users",
      },
    ],
  },
];

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (
    item.department &&
    item.section &&
    !canView(item.department as any, item.section as any)
  ) {
    return null;
  }

  if (item.children) {
    const hasVisibleChildren = item.children.some(
      (child) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !child.department ||
        !child.section ||
        canView(child.department as any, child.section as any),
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

// ...existing code...

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
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

        <div className="px-3 py-4 border-t border-gray-700">
          <div className="px-3 py-2">
            <p className="text-sm text-white font-medium">
              {user?.displayName}
            </p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-sidebar-hover hover:text-white rounded-md transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
