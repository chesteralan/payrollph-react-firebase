import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EditableCell } from "@/components/ui/EditableCell";
import type { ProcessingRow } from "../PayrollDetailPage.types";

interface BenefitsStageProps {
  rows: ProcessingRow[];
  benefitsList: { id: string; name: string }[];
  benefitData: Map<
    string,
    Map<string, { employeeShare: number; employerShare: number }>
  >;
  updateBenefit: (
    nameId: string,
    benefitId: string,
    employeeShare: number,
    employerShare: number,
  ) => void;
}

export function BenefitsStage({
  rows,
  benefitsList,
  benefitData,
  updateBenefit,
}: BenefitsStageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Benefits</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                Employee
              </th>
              {benefitsList.map((b) => (
                <th
                  key={b.id}
                  className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-50"
                  colSpan={2}
                >
                  {b.name} (EE / ER)
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
                {benefitsList.map((b) => {
                  const val = benefitData.get(row.nameId)?.get(b.id) || {
                    employeeShare: 0,
                    employerShare: 0,
                  };
                  return (
                    <td key={b.id} className="px-4 py-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <EditableCell
                          value={val.employeeShare}
                          onChange={(v) =>
                            updateBenefit(
                              row.nameId,
                              b.id,
                              Number(v),
                              val.employerShare,
                            )
                          }
                          type="number"
                          className="w-20 text-right"
                        />
                        <EditableCell
                          value={val.employerShare}
                          onChange={(v) =>
                            updateBenefit(
                              row.nameId,
                              b.id,
                              val.employeeShare,
                              Number(v),
                            )
                          }
                          type="number"
                          className="w-20 text-right"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
