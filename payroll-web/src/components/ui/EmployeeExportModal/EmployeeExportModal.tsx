import { useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "../Button";

interface ExportColumn {
  key: string;
  label: string;
}

interface EmployeeExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (columns: string[], format: "csv" | "xlsx" | "json") => void;
  columns: ExportColumn[];
}

export function EmployeeExportModal({
  open,
  onClose,
  onExport,
  columns,
}: EmployeeExportModalProps) {
  const [selected, setSelected] = useState<string[]>(
    columns.map((c) => c.key),
  );
  const [format, setFormat] = useState<"csv" | "xlsx" | "json">("xlsx");

  if (!open) return null;

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Export Employees</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <div className="flex gap-2">
            {(["xlsx", "csv", "json"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  format === f
                    ? "bg-primary-50 border-primary-300 text-primary-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                .{f}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Columns
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(col.key)}
                  onChange={() => toggle(col.key)}
                  className="rounded border-gray-300 text-primary-600"
                />
                <span className="text-sm text-gray-700">{col.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onExport(selected, format)}
            disabled={selected.length === 0}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
