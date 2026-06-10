import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "../Button";

interface BatchEditField {
  key: string;
  label: string;
  type: "number" | "text" | "select";
  options?: { value: string; label: string }[];
}

interface BatchEditDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (values: Record<string, string>) => void;
  fields: BatchEditField[];
  selectedCount: number;
}

export function BatchEditDialog({
  open,
  onClose,
  onApply,
  fields,
  selectedCount,
}: BatchEditDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  if (!open) return null;

  const canApply = Object.values(values).some((v) => v.trim() !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Batch Edit {selectedCount} Cells
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Set values for the selected cells. Leave blank to skip.
        </p>

        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              {field.type === "select" && field.options ? (
                <select
                  value={values[field.key] || ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">— Skip —</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={values[field.key] || ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder="Leave blank to skip"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onApply(values)} disabled={!canApply}>
            Apply to {selectedCount} cells
          </Button>
        </div>
      </div>
    </div>
  );
}
