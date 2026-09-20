import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { CleanupResult } from "./DatabasePage.types";

interface DataCleanupSectionProps {
  dtrMonths: number;
  onDtrMonthsChange: (value: number) => void;
  softDeleteDays: number;
  onSoftDeleteDaysChange: (value: number) => void;
  archiveYears: number;
  onArchiveYearsChange: (value: number) => void;
  runCleanup: (operation: string) => void;
  cleanupLoading: string;
  cleanupResults: CleanupResult[];
}

const CLEANUP_OPERATIONS = [
  {
    id: "orphaned",
    name: "Remove Orphaned Records",
    desc: "Delete employees with invalid name refs and payroll_employees without valid payroll",
    variant: "danger" as const,
  },
  {
    id: "duplicates",
    name: "Remove Duplicate Names",
    desc: "Delete duplicate names in the names collection (keeps first occurrence)",
    variant: "warning" as const,
  },
  {
    id: "oldDtr",
    name: "Clear Old DTR Entries",
    desc: "Delete DTR entries older than the configured months",
    variant: "warning" as const,
  },
  {
    id: "expiredLeave",
    name: "Expire Old Leave Applications",
    desc: "Mark approved/pending leave applications as expired if end date passed",
    variant: "info" as const,
  },
  {
    id: "softDeleted",
    name: "Purge Soft-Deleted Records",
    desc: "Permanently delete soft-deleted records older than the configured days",
    variant: "danger" as const,
  },
  {
    id: "archivePayroll",
    name: "Archive Old Payroll Runs",
    desc: "Mark payroll runs and related data older than the configured years as archived",
    variant: "info" as const,
  },
];

export function DataCleanupSection({
  dtrMonths,
  onDtrMonthsChange,
  softDeleteDays,
  onSoftDeleteDaysChange,
  archiveYears,
  onArchiveYearsChange,
  runCleanup,
  cleanupLoading,
  cleanupResults,
}: DataCleanupSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Cleanup</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">DTR cutoff:</span>
            <input
              type="number"
              value={dtrMonths}
              onChange={(e) => onDtrMonthsChange(Number(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
              min={1}
              max={36}
            />
            <span className="text-sm text-gray-500">mo</span>
            <span className="text-sm text-gray-500 ml-4">
              Soft-delete cutoff:
            </span>
            <input
              type="number"
              value={softDeleteDays}
              onChange={(e) => onSoftDeleteDaysChange(Number(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
              min={1}
              max={365}
            />
            <span className="text-sm text-gray-500">days</span>
            <span className="text-sm text-gray-500 ml-4">
              Archive cutoff:
            </span>
            <input
              type="number"
              value={archiveYears}
              onChange={(e) => onArchiveYearsChange(Number(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
              min={1}
              max={20}
            />
            <span className="text-sm text-gray-500">years</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CLEANUP_OPERATIONS.map((op) => (
            <div
              key={op.id}
              className="border border-gray-200 rounded-lg p-4 space-y-3"
            >
              <div>
                <h4 className="font-medium text-gray-900">{op.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{op.desc}</p>
              </div>
              <ConfirmDialog
                title={`Confirm: ${op.name}`}
                message={`This operation cannot be undone. Are you sure you want to proceed?`}
                confirmText="Run Cleanup"
                variant={op.variant}
                onConfirm={() => runCleanup(op.id)}
              >
                {(open) => (
                  <Button
                    variant={
                      op.variant === "danger"
                        ? "danger"
                        : op.variant === "info"
                          ? "secondary"
                          : "secondary"
                    }
                    size="sm"
                    onClick={() => open()}
                    disabled={!!cleanupLoading}
                    className="w-full"
                  >
                    {cleanupLoading === op.id ? "Running..." : "Run"}
                  </Button>
                )}
              </ConfirmDialog>
            </div>
          ))}
        </div>

        {cleanupResults.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Cleanup History
            </h4>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Operation
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Records
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Time (ms)
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cleanupResults.map((result, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {result.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">
                      {result.count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">
                      {result.time}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {result.success ? "Success" : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
