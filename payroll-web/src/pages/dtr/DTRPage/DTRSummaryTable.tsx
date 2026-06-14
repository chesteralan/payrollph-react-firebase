import { SearchBar } from "@/components/ui/SearchBar";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MONTH_NAMES } from "./DTRPage.constants";
import type { DTREntry } from "@/types/dtr";

interface SummaryEntry extends DTREntry {
  employeeName?: string;
  employeeCode?: string;
}

interface DTRSummaryTableProps {
  entries: SummaryEntry[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMonth: number;
  selectedYear: number;
}

export function DTRSummaryTable({
  entries,
  searchQuery,
  onSearchChange,
  selectedMonth,
  selectedYear,
}: DTRSummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            DTR Summary - {MONTH_NAMES[selectedMonth]} {selectedYear}
          </CardTitle>
        </div>
      </CardHeader>
      <CardHeader className="py-3">
        <div className="flex items-center gap-4">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search by employee name or code..."
          />
          <span className="text-sm text-gray-500 ml-auto">
            {entries.length} entr
            {entries.length !== 1 ? "ies" : "y"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Employee
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Time In
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Time Out
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Hours
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                OT
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Late
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  No entries for this period
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {entry.employeeName || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {entry.employeeCode || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {entry.date}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {entry.timeIn || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {entry.timeOut || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {entry.hoursWorked || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {entry.overtimeHours || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {entry.lateHours || 0}
                  </td>
                  <td className="px-4 py-3">
                    {entry.absenceType ? (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 capitalize">
                        {entry.absenceType}
                      </span>
                    ) : entry.timeIn && entry.timeOut ? (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Present
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Incomplete
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
