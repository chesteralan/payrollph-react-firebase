import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EditableCell } from "@/components/ui/EditableCell";
import { formatCurrency } from "@/utils/currency";
import type { ProcessingRow } from "../PayrollDetailPage.types";

interface EarningsStageProps {
  rows: ProcessingRow[];
  earningsList: { id: string; name: string }[];
  earningData: Map<string, Map<string, number>>;
  updateEarning: (nameId: string, earningId: string, value: number) => void;
  getEarningTotal: (earningId: string) => number;
}

export function EarningsStage({
  rows,
  earningsList,
  earningData,
  updateEarning,
  getEarningTotal,
}: EarningsStageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                Employee
              </th>
              {earningsList.map((e) => (
                <th
                  key={e.id}
                  className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-30"
                >
                  {e.name}
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
                {earningsList.map((e) => (
                  <td key={e.id} className="px-4 py-2 text-right">
                    <EditableCell
                      value={earningData.get(row.nameId)?.get(e.id) || 0}
                      onChange={(v) =>
                        updateEarning(row.nameId, e.id, Number(v))
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
              {earningsList.map((e) => (
                <td key={e.id} className="px-4 py-2 text-right text-sm">
                  {formatCurrency(getEarningTotal(e.id))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
