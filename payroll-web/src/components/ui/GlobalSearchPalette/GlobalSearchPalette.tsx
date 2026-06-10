import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import {
  Search,
  Users,
  FileText,
  Layout,
  Settings,
  Command,
  ArrowRight,
} from "lucide-react";

interface SearchResult {
  id: string;
  label: string;
  description?: string;
  category: "page" | "action";
  icon?: typeof Layout;
  path?: string;
  action?: () => void;
}

const PAGE_SEARCH: SearchResult[] = [
  { id: "dashboard", label: "Dashboard", category: "page", icon: Layout, path: "/" },
  { id: "employees", label: "Employees", description: "Manage employee records", category: "page", icon: Users, path: "/employees" },
  { id: "employee-calendar", label: "Employee Calendar", description: "View employee calendar", category: "page", icon: Layout, path: "/employees/calendar" },
  { id: "employee-groups", label: "Employee Groups", description: "Manage groups", category: "page", icon: Layout, path: "/employees/groups" },
  { id: "positions", label: "Positions", description: "Manage positions", category: "page", icon: Layout, path: "/employees/positions" },
  { id: "areas", label: "Areas", description: "Manage areas", category: "page", icon: Layout, path: "/employees/areas" },
  { id: "payroll", label: "Payroll Runs", description: "View payroll runs", category: "page", icon: FileText, path: "/payroll" },
  { id: "payroll-new", label: "New Payroll", description: "Create a new payroll run", category: "action", icon: FileText, path: "/payroll/new" },
  { id: "names-list", label: "Names List", description: "Manage employee names", category: "page", icon: Users, path: "/lists/names" },
  { id: "earnings", label: "Earnings", description: "Manage earning items", category: "page", icon: Layout, path: "/lists/earnings" },
  { id: "deductions", label: "Deductions", description: "Manage deduction items", category: "page", icon: Layout, path: "/lists/deductions" },
  { id: "benefits", label: "Benefits", description: "Manage benefit items", category: "page", icon: Layout, path: "/lists/benefits" },
  { id: "13th-month", label: "13th Month Report", description: "Generate 13th month report", category: "page", icon: Layout, path: "/reports/13th-month" },
  { id: "payroll-summary", label: "Payroll Summary Report", description: "View payroll summary", category: "page", icon: Layout, path: "/reports/payroll-summary" },
  { id: "attendance", label: "Attendance Report", description: "View attendance report", category: "page", icon: Layout, path: "/reports/attendance" },
  { id: "year-end", label: "Year-End Report", description: "View year-end report", category: "page", icon: Layout, path: "/reports/year-end" },
  { id: "companies", label: "Companies", description: "Manage companies", category: "page", icon: Settings, path: "/system/companies" },
  { id: "users", label: "Users", description: "Manage user accounts", category: "page", icon: Users, path: "/system/users" },
  { id: "audit-log", label: "Audit Log", description: "View audit log", category: "page", icon: Layout, path: "/system/audit" },
  { id: "database", label: "Database", description: "Database management", category: "page", icon: Layout, path: "/system/database" },
  { id: "calendar", label: "System Calendar", description: "Manage holidays", category: "page", icon: Layout, path: "/system/calendar" },
  { id: "settings", label: "System Settings", description: "System configuration", category: "page", icon: Settings, path: "/system/settings" },
  { id: "health", label: "Health Check", description: "System health status", category: "page", icon: Layout, path: "/system/health" },
];

export function GlobalSearchPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedIndex(0);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [query]);

  const filtered = query.trim()
    ? PAGE_SEARCH.filter((r) => {
        const q = query.toLowerCase();
        return (
          r.label.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
        );
      })
    : PAGE_SEARCH;

  const grouped = filtered.reduce<
    Record<string, SearchResult[]>
  >((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const execute = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");
      if (result.action) {
        result.action();
      } else if (result.path) {
        navigate(result.path);
      }
    },
    [navigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = filtered.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      execute(filtered[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    const el = resultsRef.current;
    if (!el) return;
    const selected = el.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-xl mx-4 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, employees, payrolls..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
            aria-label="Search query"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 rounded">
            <Command className="w-3 h-3" />
            K
          </kbd>
        </div>

        <div ref={resultsRef} className="max-h-80 overflow-y-auto p-2">
          {Object.entries(grouped).map(([category, results]) => (
            <div key={category}>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                {category === "page" ? "Pages" : "Actions"}
              </div>
              {results.map((result) => {
                const globalIndex = filtered.indexOf(result);
                const Icon = result.icon || ArrowRight;
                return (
                  <button
                    key={result.id}
                    type="button"
                    data-index={globalIndex}
                    onClick={() => execute(result)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      globalIndex === selectedIndex
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate">
                        {result.label}
                      </span>
                      {result.description && (
                        <span className="text-xs text-gray-400 block truncate">
                          {result.description}
                        </span>
                      )}
                    </div>
                    <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">
                No results found for "{query}"
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">Enter</kbd>
            Open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
