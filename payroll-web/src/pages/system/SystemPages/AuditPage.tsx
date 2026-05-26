import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usePermissions } from "@/hooks/usePermissions";
import { useTableSort } from "@/hooks/useTableSort";
import {
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { AuditEntry } from "@/services/audit";

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  login: "bg-purple-100 text-purple-800",
  logout: "bg-gray-100 text-gray-800",
  lock: "bg-yellow-100 text-yellow-800",
  unlock: "bg-orange-100 text-orange-800",
  publish: "bg-indigo-100 text-indigo-800",
  import: "bg-teal-100 text-teal-800",
  export: "bg-cyan-100 text-cyan-800",
};

const modules = [
  "",
  "payroll",
  "employees",
  "lists",
  "users",
  "calendar",
  "system",
];

export function AuditPage() {
  const { canView } = usePermissions();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string>("");
  const [filterUser, setFilterUser] = useState<string>("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const q = query(
      collection(db, "system_audit"),
      orderBy("timestamp", "desc"),
      limit(200),
    );
    const snap = await getDocs(q);
    let allLogs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as AuditEntry[];
    if (filterModule)
      allLogs = allLogs.filter((l) => l.module === filterModule);
    if (filterUser) allLogs = allLogs.filter((l) => l.userId === filterUser);
    setLogs(allLogs);
    setLoading(false);
  }, [filterModule, filterUser]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchLogs();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [fetchLogs, filterModule, filterUser]);

  const {
    items: sortedLogs,
    handleSort,
    sortConfig,
  } = useTableSort(logs, "timestamp");

  const handleExportCSV = () => {
    const headers = [
      "Date/Time",
      "User",
      "Action",
      "Module",
      "Description",
      "Entity ID",
      "Entity Type",
    ];
    const csvRows = [headers.join(",")];
    for (const log of sortedLogs) {
      const row = [
        log.timestamp ? new Date(log.timestamp).toLocaleString() : "",
        log.userName || log.userId,
        log.action,
        log.module,
        `"${(log.description || "").replace(/"/g, '""')}"`,
        log.entityId || "",
        log.entityType || "",
      ];
      csvRows.push(row.join(","));
    }
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXLS = () => {
    const data = sortedLogs.map((log) => ({
      "Date/Time": log.timestamp
        ? new Date(log.timestamp).toLocaleString()
        : "",
      User: log.userName || log.userId,
      Action: log.action,
      Module: log.module,
      Description: log.description || "",
      "Entity ID": log.entityId || "",
      "Entity Type": log.entityType || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit Log");
    XLSX.writeFile(
      wb,
      `audit_log_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  if (!canView("system", "audit"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={handleExportXLS}>
            <Download className="w-4 h-4 mr-2" />
            Export XLS
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Module
              </label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
              >
                <option value="">All Modules</option>
                {modules
                  .filter((m) => m)
                  .map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Filter by user ID"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort("timestamp")}
                >
                  <div className="flex items-center gap-1">
                    Timestamp
                    {sortConfig?.key === "timestamp" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort("userName")}
                >
                  <div className="flex items-center gap-1">
                    User
                    {sortConfig?.key === "userName" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort("action")}
                >
                  <div className="flex items-center gap-1">
                    Action
                    {sortConfig?.key === "action" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort("module")}
                >
                  <div className="flex items-center gap-1">
                    Module
                    {sortConfig?.key === "module" ? (
                      sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : sortedLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No audit logs found
                  </td>
                </tr>
              ) : (
                sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {log.userName || log.userId}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${actionColors[log.action] || "bg-gray-100 text-gray-800"}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-gray-900">
                      {log.module}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                      {log.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
