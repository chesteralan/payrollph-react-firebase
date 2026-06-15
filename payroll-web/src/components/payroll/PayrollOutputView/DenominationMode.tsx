import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

import type { CompanyInfo, ProcessingRow } from "./PayrollOutputView.types";
import { formatCurrency, PrintFooter, PrintHeader } from "./shared";

export function DenominationMode({
  rows,
  totals,
  getEmployeeNet,
  company,
  payroll,
  monthName,
}: {
  rows: ProcessingRow[];
  totals: { totalNet: number };
  getEmployeeNet: (row: ProcessingRow) => number;
  company?: CompanyInfo;
  payroll: { name: string; month: number; year: number };
  monthName: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Denomination Breakdown</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Cash payout preparation</p>
      </CardHeader>
      <CardContent>
        <PrintHeader
          company={company}
          payroll={payroll}
          monthName={monthName}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Denomination Count
            </h3>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                    Denomination
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25, 0.1, 0.05].map(
                  (denom) => {
                    const count = Math.floor(totals.totalNet / denom);
                    return (
                      <tr key={denom} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium">
                          ₱
                          {denom >= 1
                            ? denom.toLocaleString()
                            : denom.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-sm">
                          {count}
                        </td>
                        <td className="px-4 py-2 text-right text-sm">
                          {formatCurrency(count * denom)}
                        </td>
                      </tr>
                    );
                  },
                )}
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                  <td className="px-4 py-2 text-sm">Total</td>
                  <td className="px-4 py-2 text-right text-sm"></td>
                  <td className="px-4 py-2 text-right text-sm">
                    {formatCurrency(totals.totalNet)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Per Employee Cash Breakdown
            </h3>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                    Net Pay
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      <div className="font-medium">{row.employeeCode}</div>
                      <div className="text-xs text-gray-500">
                        {row.lastName}
                        {row.firstName ? `, ${row.firstName}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold">
                      {formatCurrency(getEmployeeNet(row))}
                    </td>
                  </tr>
                ))}
                {rows.length > 0 && (
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                    <td className="px-4 py-2 text-sm">Total</td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(totals.totalNet)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <PrintFooter company={company} />
      </CardContent>
    </Card>
  );
}
