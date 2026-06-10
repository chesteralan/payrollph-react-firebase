import { useState } from "react";
import { clsx } from "clsx";
import { Search, Filter, Calendar } from "lucide-react";

interface AuditLogFilters {
  query: string;
  action: string;
  userId: string;
  dateFrom: string;
  dateTo: string;
}

interface AuditLogSearchProps {
  onFilter: (filters: AuditLogFilters) => void;
  className?: string;
}

export function AuditLogSearch({
  onFilter,
  className,
}: AuditLogSearchProps) {
  const [filters, setFilters] = useState<AuditLogFilters>({
    query: "",
    action: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [expanded, setExpanded] = useState(false);

  const update = (key: keyof AuditLogFilters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFilter(next);
  };

  return (
    <div className={clsx("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => update("query", e.target.value)}
            placeholder="Search audit log..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:border-primary-300 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={clsx(
            "p-2 rounded-lg border transition-colors",
            expanded
              ? "bg-primary-50 border-primary-200 text-primary-600"
              : "border-gray-200 text-gray-400 hover:text-gray-600",
          )}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>
      {expanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <select
            value={filters.action}
            onChange={(e) => update("action", e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
          <input
            type="text"
            value={filters.userId}
            onChange={(e) => update("userId", e.target.value)}
            placeholder="User ID"
            className="px-2 py-1.5 text-xs border border-gray-200 rounded"
          />
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => update("dateFrom", e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded flex-1"
              placeholder="From"
            />
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => update("dateTo", e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded flex-1"
              placeholder="To"
            />
          </div>
        </div>
      )}
    </div>
  );
}
