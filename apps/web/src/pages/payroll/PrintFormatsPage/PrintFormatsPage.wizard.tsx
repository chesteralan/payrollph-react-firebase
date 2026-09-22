import { Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { PrintFormat } from "./PrintFormatsPage.types";
import {
  AVAILABLE_COLUMNS,
  FONT_SIZES,
  OUTPUT_TYPES,
  PAPER_SIZES,
} from "./PrintFormatsPage.constants";

/* ── ToggleField ─────────────────────────────────────── */

export function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

/* ── Types ───────────────────────────────────────────── */

export interface BasicFormState {
  name: string;
  description: string;
  outputType: string;
}

export interface LayoutFormState {
  paperSize: string;
  orientation: string;
  fontSize: PrintFormat["fontSize"];
}

export interface HeaderFormState {
  showHeader: boolean;
  showFooter: boolean;
  headerHtml: string;
  footerHtml: string;
  showCompanyLogo: boolean;
  showCompanyName: boolean;
  showCompanyAddress: boolean;
  showCompanyTIN: boolean;
  showTitle: boolean;
  showPeriod: boolean;
  showSignatureLines: boolean;
  signatureLabels: string[];
}

/* ── Step 0: Basic Info ──────────────────────────────── */

export function WizardBasicInfoStep({
  basicForm,
  setBasicForm,
}: {
  basicForm: BasicFormState;
  setBasicForm: React.Dispatch<React.SetStateAction<BasicFormState>>;
}) {
  return (
    <div className="space-y-4 max-w-lg">
      <Input
        id="name"
        label="Format Name"
        value={basicForm.name}
        onChange={(e) =>
          setBasicForm({ ...basicForm, name: e.target.value })
        }
        required
      />
      <Input
        id="description"
        label="Description"
        value={basicForm.description}
        onChange={(e) =>
          setBasicForm({ ...basicForm, description: e.target.value })
        }
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Output Type
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          value={basicForm.outputType}
          onChange={(e) =>
            setBasicForm({
              ...basicForm,
              outputType: e.target.value as PrintFormat["outputType"],
            })
          }
        >
          {OUTPUT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ── Step 1: Layout ──────────────────────────────────── */

export function WizardLayoutStep({
  layoutForm,
  setLayoutForm,
}: {
  layoutForm: LayoutFormState;
  setLayoutForm: React.Dispatch<React.SetStateAction<LayoutFormState>>;
}) {
  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Paper Size
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          value={layoutForm.paperSize}
          onChange={(e) =>
            setLayoutForm({
              ...layoutForm,
              paperSize: e.target.value as PrintFormat["paperSize"],
            })
          }
        >
          {PAPER_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Orientation
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          value={layoutForm.orientation}
          onChange={(e) =>
            setLayoutForm({
              ...layoutForm,
              orientation: e.target.value as PrintFormat["orientation"],
            })
          }
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Font Size
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          value={layoutForm.fontSize}
          onChange={(e) =>
            setLayoutForm({
              ...layoutForm,
              fontSize: e.target.value as PrintFormat["fontSize"],
            })
          }
        >
          {FONT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ── Step 2: Header/Footer ───────────────────────────── */

export function WizardHeaderFooterStep({
  headerForm,
  setHeaderForm,
}: {
  headerForm: HeaderFormState;
  setHeaderForm: React.Dispatch<React.SetStateAction<HeaderFormState>>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <ToggleField
          label="Show Header"
          checked={headerForm.showHeader}
          onChange={(v) => setHeaderForm({ ...headerForm, showHeader: v })}
        />
        <ToggleField
          label="Show Footer"
          checked={headerForm.showFooter}
          onChange={(v) => setHeaderForm({ ...headerForm, showFooter: v })}
        />
        <ToggleField
          label="Company Logo"
          checked={headerForm.showCompanyLogo}
          onChange={(v) =>
            setHeaderForm({ ...headerForm, showCompanyLogo: v })
          }
        />
        <ToggleField
          label="Company Name"
          checked={headerForm.showCompanyName}
          onChange={(v) =>
            setHeaderForm({ ...headerForm, showCompanyName: v })
          }
        />
        <ToggleField
          label="Company Address"
          checked={headerForm.showCompanyAddress}
          onChange={(v) =>
            setHeaderForm({ ...headerForm, showCompanyAddress: v })
          }
        />
        <ToggleField
          label="Company TIN"
          checked={headerForm.showCompanyTIN}
          onChange={(v) =>
            setHeaderForm({ ...headerForm, showCompanyTIN: v })
          }
        />
        <ToggleField
          label="Report Title"
          checked={headerForm.showTitle}
          onChange={(v) => setHeaderForm({ ...headerForm, showTitle: v })}
        />
        <ToggleField
          label="Payroll Period"
          checked={headerForm.showPeriod}
          onChange={(v) => setHeaderForm({ ...headerForm, showPeriod: v })}
        />
        <ToggleField
          label="Signature Lines"
          checked={headerForm.showSignatureLines}
          onChange={(v) =>
            setHeaderForm({ ...headerForm, showSignatureLines: v })
          }
        />
      </div>
      {headerForm.showSignatureLines && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Signature Labels (comma-separated)
          </label>
          <Input
            id="sigLabels"
            value={headerForm.signatureLabels.join(", ")}
            onChange={(e) =>
              setHeaderForm({
                ...headerForm,
                signatureLabels: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      )}
      {headerForm.showHeader && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Header HTML (optional)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
            rows={3}
            value={headerForm.headerHtml}
            onChange={(e) =>
              setHeaderForm({ ...headerForm, headerHtml: e.target.value })
            }
            placeholder="<div>Custom header content...</div>"
          />
        </div>
      )}
      {headerForm.showFooter && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Footer HTML (optional)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
            rows={3}
            value={headerForm.footerHtml}
            onChange={(e) =>
              setHeaderForm({ ...headerForm, footerHtml: e.target.value })
            }
            placeholder="<div>Custom footer content...</div>"
          />
        </div>
      )}
    </div>
  );
}

/* ── Step 3: Columns ─────────────────────────────────── */

export function WizardColumnsStep({
  selectedColumns,
  setSelectedColumns,
  includeTotals,
  setIncludeTotals,
}: {
  selectedColumns: string[];
  setSelectedColumns: React.Dispatch<React.SetStateAction<string[]>>;
  includeTotals: boolean;
  setIncludeTotals: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const toggleItem = (id: string) => {
    setSelectedColumns((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Select and order columns for register output. Drag not supported -
        order is saved as listed.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {AVAILABLE_COLUMNS.map((col) => (
          <button
            key={col.id}
            onClick={() => toggleItem(col.id)}
            className={`flex items-center gap-2 p-3 border rounded-lg text-sm transition-colors ${
              selectedColumns.includes(col.id)
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {selectedColumns.includes(col.id) ? (
              <Check className="w-4 h-4" />
            ) : (
              <div className="w-4 h-4 border rounded" />
            )}
            {col.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4">
        <input
          type="checkbox"
          id="includeTotals"
          checked={includeTotals}
          onChange={(e) => setIncludeTotals(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="includeTotals" className="text-sm text-gray-700">
          Include totals row
        </label>
      </div>
    </div>
  );
}

/* ── Step 4: Review ──────────────────────────────────── */

export function WizardReviewStep({
  basicForm,
  layoutForm,
  headerForm,
  selectedColumns,
  includeTotals,
}: {
  basicForm: BasicFormState;
  layoutForm: LayoutFormState;
  headerForm: HeaderFormState;
  selectedColumns: string[];
  includeTotals: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg space-y-3">
        <h3 className="font-medium">Format Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-500">Name:</span>
          <span className="font-medium">{basicForm.name}</span>
          <span className="text-gray-500">Output Type:</span>
          <span className="capitalize">
            {OUTPUT_TYPES.find((t) => t.value === basicForm.outputType)
              ?.label ?? basicForm.outputType}
          </span>
          <span className="text-gray-500">Paper:</span>
          <span>
            {layoutForm.paperSize} {layoutForm.orientation}
          </span>
          <span className="text-gray-500">Font Size:</span>
          <span className="capitalize">{layoutForm.fontSize}</span>
          <span className="text-gray-500">Header:</span>
          <span>{headerForm.showHeader ? "Yes" : "No"}</span>
          <span className="text-gray-500">Footer:</span>
          <span>{headerForm.showFooter ? "Yes" : "No"}</span>
          <span className="text-gray-500">Signature Lines:</span>
          <span>
            {headerForm.showSignatureLines
              ? `${headerForm.signatureLabels.length} labels`
              : "No"}
          </span>
          <span className="text-gray-500">Columns:</span>
          <span>{selectedColumns.length} selected</span>
          <span className="text-gray-500">Totals:</span>
          <span>{includeTotals ? "Yes" : "No"}</span>
        </div>
      </div>
    </div>
  );
}
