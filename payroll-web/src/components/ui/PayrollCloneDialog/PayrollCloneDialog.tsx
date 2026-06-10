import { useState } from "react";
import { clsx } from "clsx";
import { Copy, X } from "lucide-react";
import { Button } from "../Button";

interface CloneOption {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

interface PayrollCloneDialogProps {
  open: boolean;
  onClose: () => void;
  onClone: (options: Record<string, boolean>) => void;
  sourceName: string;
}

const CLONE_OPTIONS: CloneOption[] = [
  {
    key: "groups",
    label: "Employee Groups",
    description: "Copy group assignments and print order",
    defaultEnabled: true,
  },
  {
    key: "employees",
    label: "Employee Selection",
    description: "Copy selected employee list",
    defaultEnabled: true,
  },
  {
    key: "dates",
    label: "Inclusive Dates",
    description: "Copy payroll period dates",
    defaultEnabled: true,
  },
  {
    key: "columns",
    label: "Print Columns",
    description: "Copy column layout and visibility settings",
    defaultEnabled: true,
  },
  {
    key: "dtr-data",
    label: "DTR Data",
    description: "Carry over days worked, absences, overtime",
    defaultEnabled: false,
  },
  {
    key: "earnings",
    label: "Earnings Data",
    description: "Carry over earning amounts",
    defaultEnabled: false,
  },
  {
    key: "deductions",
    label: "Deductions Data",
    description: "Carry over deduction amounts",
    defaultEnabled: false,
  },
];

export function PayrollCloneDialog({
  open,
  onClose,
  onClone,
  sourceName,
}: PayrollCloneDialogProps) {
  const [options, setOptions] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      CLONE_OPTIONS.map((opt) => [opt.key, opt.defaultEnabled]),
    ),
  );

  if (!open) return null;

  const toggle = (key: string) =>
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Clone Payroll
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            Create a new payroll based on <strong>{sourceName}</strong>.
            Select what data to carry over:
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {CLONE_OPTIONS.map((opt) => (
              <label
                key={opt.key}
                className={clsx(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  options[opt.key]
                    ? "border-primary-200 bg-primary-50"
                    : "border-gray-200 hover:bg-gray-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={options[opt.key]}
                  onChange={() => toggle(opt.key)}
                  className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {opt.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {opt.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onClone(options)}>
            <Copy className="w-4 h-4 mr-1.5" />
            Clone Payroll
          </Button>
        </div>
      </div>
    </div>
  );
}
