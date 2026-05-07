import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const routeLabels: Record<string, string> = {
  employees: "Employees",
  calendar: "Calendar",
  groups: "Groups",
  positions: "Positions",
  areas: "Areas",
  names: "Names List",
  benefits: "Benefits",
  earnings: "Earnings",
  deductions: "Deductions",
  payroll: "Payroll",
  new: "New Payroll",
  templates: "Templates",
  "print-formats": "Print Formats",
  dtr: "DTR",
  reports: "Reports",
  "13th-month": "13th Month",
  "payroll-summary": "Payroll Summary",
  employees: "Employee Master List",
  "earnings-deductions": "Earnings/Deductions",
  attendance: "Attendance",
  "benefits-utilization": "Benefits Utilization",
  system: "System",
  companies: "Companies",
  "company-settings": "Company Settings",
  calendar: "Calendar",
  terms: "Terms",
  users: "Users",
  restrictions: "Restrictions",
  audit: "Audit Log",
  database: "Database",
  settings: "Settings",
  trash: "Trash",
  health: "Health Check",
};
function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", path: "/" }];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || segment;
    const isLast = index === segments.length - 1;
    breadcrumbs.push({
      label,
      path: isLast ? undefined : currentPath,
    });
  });

  if (breadcrumbs.length === 2) {
    breadcrumbs[1].label = routeLabels[segments[0]] || segments[0];
  }

  return breadcrumbs;
}

export function Breadcrumb() {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav
      className="flex items-center gap-1 text-sm text-gray-500 mb-4"
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
          {crumb.path ? (
            <Link
              to={crumb.path}
              className="hover:text-gray-700 transition-colors flex items-center gap-1"
            >
              {index === 0 && <Home className="w-3 h-3" />}
              <span>{crumb.label}</span>
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
