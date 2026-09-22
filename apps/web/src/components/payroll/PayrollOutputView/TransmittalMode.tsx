import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

import type { CompanyInfo, ProcessingRow } from "./PayrollOutputView.types";
import { formatCurrency, PrintFooter, PrintHeader } from "./shared";

export function TransmittalMode({
  rows,
  getEmployeeNet,
  totals,
  company,
  payroll,
  monthName,
}: {
  rows: ProcessingRow[];
  getEmployeeNet: (row: ProcessingRow) => number;
  totals: { totalNet: number };
  company?: CompanyInfo;
  payroll: { name: string; month: number; year: number };
  monthName: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Transmittal List</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Employee net pay amounts for bank transfer
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <PrintHeader
          company={company}
          payroll={payroll}
          monthName={monthName}
        />
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                #
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Employee ID
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Employee Name
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Net Pay
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, index) => (
              <tr key={row.nameId} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                <td className="px-4 py-2 text-sm font-medium">
                  {row.employeeCode}
                </td>
                <td className="px-4 py-2 text-sm">
                  {row.lastName}
                  {row.firstName ? `, ${row.firstName}` : ""}
                </td>
                <td className="px-4 py-2 text-right text-sm font-semibold">
                  {formatCurrency(getEmployeeNet(row))}
                </td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <td className="px-4 py-2" colSpan={3}>
                  Total ({rows.length} employees)
                </td>
                <td className="px-4 py-2 text-right">
                  {formatCurrency(totals.totalNet)}
                </td>
              </tr>
            )}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No employees in this payroll.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PrintFooter company={company} />
      </CardContent>
    </Card>
  );
}
