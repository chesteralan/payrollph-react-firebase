import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { EmployeeReportData } from "./EmployeeReportPage.types";
import { formatCurrency, getPrimaryContact } from "./useEmployeeReport";

interface EmployeeReportTableProps {
  employees: EmployeeReportData[];
  expandedRows: Set<string>;
  onToggleRow: (id: string) => void;
}

function ExpandedDetail({ emp }: { emp: EmployeeReportData }) {
  return (
    <tr className="bg-gray-50 print:bg-transparent">
      <td colSpan={10} className="px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">SSS</div>
            <div className="text-gray-900">{emp.profile?.sss || "-"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">TIN</div>
            <div className="text-gray-900">{emp.profile?.tin || "-"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">PhilHealth</div>
            <div className="text-gray-900">{emp.profile?.philhealth || "-"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">HDMF/Pag-IBIG</div>
            <div className="text-gray-900">{emp.profile?.hdmf || "-"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Bank</div>
            <div className="text-gray-900">{emp.profile?.bankName || "-"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Bank Account</div>
            <div className="text-gray-900">{emp.profile?.bankAccount || "-"}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Email</div>
            <div className="text-gray-900">
              {getPrimaryContact(emp.contacts, "email") || "-"}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase">Address</div>
            <div className="text-gray-900">
              {getPrimaryContact(emp.contacts, "address") || "-"}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function EmployeeReportTable({
  employees,
  expandedRows,
  onToggleRow,
}: EmployeeReportTableProps) {
  return (
    <Card>
      <CardHeader className="print:hidden">
        <CardTitle>Employee Master List</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm print:text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 print:bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase w-8"></th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Code
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Group
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Position
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Area
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Salary
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Hire Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((emp) => (
                <>
                  <tr
                    key={emp.id}
                    className="hover:bg-gray-50 print:hover:bg-transparent"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onToggleRow(emp.id)}
                        className="text-gray-500 hover:text-gray-700 print:hidden"
                      >
                        {expandedRows.has(emp.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {emp.employeeCode}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {emp.name || emp.nameId}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {emp.groupName || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {emp.positionName || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {emp.areaName || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${emp.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {emp.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {emp.salary ? formatCurrency(emp.salary) : "-"}
                      {emp.salaryFrequency && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({emp.salaryFrequency})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {emp.hireDate
                        ? new Date(emp.hireDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {getPrimaryContact(emp.contacts, "phone")}
                    </td>
                  </tr>
                  {expandedRows.has(emp.id) && <ExpandedDetail emp={emp} />}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
