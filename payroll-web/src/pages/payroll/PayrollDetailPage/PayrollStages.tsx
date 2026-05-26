import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EditableCell } from "@/components/ui/EditableCell";
import { ArrowLeft } from "lucide-react";
import type { ProcessingRow } from "../PayrollDetailPage.types";

interface StageSelectorProps {
  stages: string[];
  activeStage: string;
  onStageChange: (stage: string) => void;
}

export function StageSelector({ stages, activeStage, onStageChange }: StageSelectorProps) {
  return (
    <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
      {stages.map((stage) => (
        <button
          key={stage}
          onClick={() => onStageChange(stage)}
          className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap ${
            activeStage === stage
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {stage}
        </button>
      ))}
    </div>
  );
}

interface DTRStageProps {
  rows: ProcessingRow[];
  startDate: string | null;
  endDate: string | null;
  updateRow: (nameId: string, field: keyof ProcessingRow, value: number) => void;
  onManageDTR: () => void;
}

export function DTRStage({ rows, startDate, endDate, updateRow, onManageDTR }: DTRStageProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Time Record</CardTitle>
            {startDate && endDate && (
              <p className="text-sm text-gray-500">
                Auto-populated from DTR entries ({startDate} to {endDate})
              </p>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={onManageDTR}>
            Manage DTR Entries
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Days Worked</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Absences</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Late (hrs)</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Overtime (hrs)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.nameId} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <div className="text-sm font-medium text-gray-900">{row.employeeCode}</div>
                  <div className="text-xs text-gray-500">{row.lastName}</div>
                </td>
                <td className="px-4 py-2 text-center">
                  <EditableCell value={row.daysWorked} onChange={(v) => updateRow(row.nameId, "daysWorked", Number(v))} type="number" className="text-center" />
                </td>
                <td className="px-4 py-2 text-center">
                  <EditableCell value={row.absences} onChange={(v) => updateRow(row.nameId, "absences", Number(v))} type="number" className="text-center" />
                </td>
                <td className="px-4 py-2 text-center">
                  <EditableCell value={row.lateHours} onChange={(v) => updateRow(row.nameId, "lateHours", Number(v))} type="number" className="text-center" />
                </td>
                <td className="px-4 py-2 text-center">
                  <EditableCell value={row.overtimeHours} onChange={(v) => updateRow(row.nameId, "overtimeHours", Number(v))} type="number" className="text-center" />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No employees in this payroll. Go to the wizard to add employees.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
