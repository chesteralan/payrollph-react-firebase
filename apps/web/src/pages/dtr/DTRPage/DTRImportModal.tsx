import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
import type { DTREntry } from "@/types/dtr";

interface DTRImportModalProps {
  show: boolean;
  importPreview: Partial<DTREntry>[];
  importErrors: string[];
  onClose: () => void;
  onImport: () => void;
}

export function DTRImportModal({
  show,
  importPreview,
  importErrors,
  onClose,
  onImport,
}: DTRImportModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Import DTR Entries</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        {importErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-1">
              {importErrors.length} error(s) found:
            </p>
            <ul className="text-xs text-red-700 space-y-0.5">
              {importErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        {importPreview.length > 0 && (
          <>
            <p className="text-sm text-gray-600 mb-2">
              {importPreview.length} entries ready to import
            </p>
            <div className="overflow-x-auto border rounded-lg mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Time In</th>
                    <th className="text-left px-3 py-2">Time Out</th>
                    <th className="text-right px-3 py-2">Hours</th>
                    <th className="text-right px-3 py-2">OT</th>
                    <th className="text-right px-3 py-2">Late</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {importPreview.slice(0, 20).map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{p.date}</td>
                      <td className="px-3 py-2">{p.timeIn || "-"}</td>
                      <td className="px-3 py-2">{p.timeOut || "-"}</td>
                      <td className="px-3 py-2 text-right">
                        {p.hoursWorked || 0}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.overtimeHours || 0}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.lateHours || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importPreview.length > 20 && (
              <p className="text-xs text-gray-500 mb-4">
                ...and {importPreview.length - 20} more entries
              </p>
            )}
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onImport}>
            Import {importPreview.length} Entries
          </Button>
        </div>
      </div>
    </div>
  );
}
