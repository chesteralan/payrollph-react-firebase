import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EditableCell } from "@/components/ui/EditableCell";
import { formatCurrency } from "@/utils/currency";
import type { ProcessingRow } from "../PayrollDetailPage.types";

interface DeductionsStageProps {
  rows: ProcessingRow[];
  deductionsList: { id: string; name: string }[];
  deductionData: Map<string, Map<string, number>>;
  updateDeduction: (nameId: string, deductionId: string, value: number) => void;
  getDeductionTotal: (deductionId: string) => number;
}

export function DeductionsStage({
  rows,
  deductionsList,
  deductionData,
  updateDeduction,
  getDeductionTotal,
}: DeductionsStageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deductions</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                Employee
              </th>
              {deductionsList.map((d) => (
                <th
                  key={d.id}
                  className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-30"
                >
                  {d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.nameId} className="hover:bg-gray-50">
                <td className="px-4 py-2 sticky left-0 bg-white">
                  <div className="text-sm font-medium text-gray-900">
                    {row.employeeCode}
                  </div>
                  <div className="text-xs text-gray-500">{row.lastName}</div>
                </td>
                {deductionsList.map((d) => (
                  <td key={d.id} className="px-4 py-2 text-right">
                    <EditableCell
                      value={deductionData.get(row.nameId)?.get(d.id) || 0}
                      onChange={(v) =>
                        updateDeduction(row.nameId, d.id, Number(v))
                      }
                      type="number"
                      className="text-right"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-gray-50 font-medium">
              <td className="px-4 py-2 sticky left-0 bg-gray-50 text-sm">
                Total
              </td>
              {deductionsList.map((d) => (
                <td key={d.id} className="px-4 py-2 text-right text-sm">
                  {formatCurrency(getDeductionTotal(d.id))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
