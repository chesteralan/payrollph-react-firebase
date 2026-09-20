import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EditableCell } from "@/components/ui/EditableCell";
import { formatCurrency } from "@/utils/currency";
import type { ProcessingRow } from "../PayrollDetailPage.types";

interface SalariesStageProps {
  rows: ProcessingRow[];
  actualWorkdays: number | null;
  defaultWorkdays: number;
  updateRow: (
    nameId: string,
    field: keyof ProcessingRow,
    value: number,
  ) => void;
}

export function SalariesStage({
  rows,
  actualWorkdays,
  defaultWorkdays,
  updateRow,
}: SalariesStageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Salaries</CardTitle>
        <p className="text-sm text-gray-500">
          Based on{" "}
          {actualWorkdays !== null
            ? `${actualWorkdays} actual workdays (calendar-adjusted)`
            : `${defaultWorkdays} workdays/month (default)`}
          . Rate/Day and Salary Amount auto-calculated.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Employee
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Basic Salary
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Rate/Day
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Days
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Salary Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.nameId} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <div className="text-sm font-medium text-gray-900">
                    {row.employeeCode}
                  </div>
                  <div className="text-xs text-gray-500">{row.lastName}</div>
                </td>
                <td className="px-4 py-2 text-right">
                  <EditableCell
                    value={row.basicSalary}
                    onChange={(v) =>
                      updateRow(row.nameId, "basicSalary", Number(v))
                    }
                    type="number"
                    className="text-right"
                  />
                </td>
                <td className="px-4 py-2 text-right text-sm text-gray-700">
                  {formatCurrency(row.ratePerDay)}
                </td>
                <td className="px-4 py-2 text-right text-sm text-gray-500">
                  {row.daysWorked}
                </td>
                <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(row.salaryAmount)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No employees in this payroll.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
