import { Link } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SelectionPanel } from "@/components/ui/SelectionPanel";
import type { EmployeeArea, EmployeeGroup, EmployeePosition, EmployeeStatus, PrintFormat } from "./TemplatesPage.types";

const WIZARD_STEPS = [
  "Basic Info",
  "Groups & Filters",
  "Columns",
  "Print Settings",
  "Review",
];

interface BasicForm {
  name: string;
  description: string;
  printFormat: string;
  groupBy: string;
}

interface WizardContentProps {
  wizardStep: number;
  setWizardStep: (step: number | ((prev: number) => number)) => void;
  editingId: string | null;
  basicForm: BasicForm;
  setBasicForm: (form: BasicForm | ((prev: BasicForm) => BasicForm)) => void;
  selectedGroups: string[];
  selectedPositions: string[];
  selectedAreas: string[];
  selectedStatuses: string[];
  selectedEarnings: string[];
  selectedDeductions: string[];
  selectedBenefits: string[];
  selectedPrintColumns: string[];
  groups: EmployeeGroup[];
  positions: EmployeePosition[];
  areas: EmployeeArea[];
  statuses: EmployeeStatus[];
  earningsList: { id: string; name: string }[];
  deductionsList: { id: string; name: string }[];
  benefitsList: { id: string; name: string }[];
  printFormats: PrintFormat[];
  onToggle: (list: string[], id: string, setter: (l: string[]) => void) => void;
  setSelectedGroups: (l: string[]) => void;
  setSelectedPositions: (l: string[]) => void;
  setSelectedAreas: (l: string[]) => void;
  setSelectedStatuses: (l: string[]) => void;
  setSelectedEarnings: (l: string[]) => void;
  setSelectedDeductions: (l: string[]) => void;
  setSelectedBenefits: (l: string[]) => void;
  setSelectedPrintColumns: (l: string[]) => void;
  handleSubmit: () => Promise<void>;
  onClose: () => void;
}

export function WizardContent({
  wizardStep,
  setWizardStep,
  editingId,
  basicForm,
  setBasicForm,
  selectedGroups,
  selectedPositions,
  selectedAreas,
  selectedStatuses,
  selectedEarnings,
  selectedDeductions,
  selectedBenefits,
  selectedPrintColumns,
  groups,
  positions,
  areas,
  statuses,
  earningsList,
  deductionsList,
  benefitsList,
  printFormats,
  onToggle,
  setSelectedGroups,
  setSelectedPositions,
  setSelectedAreas,
  setSelectedStatuses,
  setSelectedEarnings,
  setSelectedDeductions,
  setSelectedBenefits,
  setSelectedPrintColumns,
  handleSubmit,
  onClose,
}: WizardContentProps) {
  const canProceed = () => {
    if (wizardStep === 0) return basicForm.name.trim().length > 0;
    return true;
  };

  const printColumnOptions = [
    { id: "basic", label: "Basic Salary" },
    { id: "earnings", label: "Earnings" },
    { id: "gross", label: "Gross Pay" },
    { id: "deductions", label: "Deductions" },
    { id: "benefits", label: "Benefits" },
    { id: "net", label: "Net Pay" },
    { id: "daysWorked", label: "Days Worked" },
    { id: "absences", label: "Absences" },
    { id: "late", label: "Late Hours" },
    { id: "overtime", label: "Overtime Hours" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{editingId ? "Edit" : "Create"} Template</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          {WIZARD_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => i <= wizardStep && setWizardStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  i === wizardStep
                    ? "bg-primary-600 text-white"
                    : i < wizardStep
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {i < wizardStep ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center">
                    {i + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{step}</span>
              </button>
              {i < WIZARD_STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {wizardStep === 0 && (
          <div className="space-y-4 max-w-lg">
            <Input
              id="name"
              label="Template Name"
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
                Print Format
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={basicForm.printFormat}
                onChange={(e) =>
                  setBasicForm({ ...basicForm, printFormat: e.target.value })
                }
              >
                <option value="register">Default: Payroll Register</option>
                <option value="payslip">Default: Payslip</option>
                <option value="transmittal">Default: Bank Transmittal</option>
                <option value="journal">Default: Journal Entry</option>
                <option value="denomination">Default: Cash Denomination</option>
                {printFormats.length > 0 && (
                  <option disabled>──────────</option>
                )}
                {printFormats
                  .filter((f) => f.isActive)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.outputType})
                    </option>
                  ))}
              </select>
              {printFormats.length === 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  Create custom formats in{" "}
                  <Link
                    to="/payroll/print-formats"
                    className="text-primary-600 hover:underline"
                  >
                    Print Formats
                  </Link>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Group By
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={basicForm.groupBy}
                onChange={(e) =>
                  setBasicForm({ ...basicForm, groupBy: e.target.value })
                }
              >
                <option value="group">Group</option>
                <option value="area">Area</option>
                <option value="position">Position</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        )}

        {wizardStep === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Select which groups, positions, areas, and statuses to
              include. Leave all unchecked to include all employees.
            </p>
            <SelectionPanel
              title="Employee Groups"
              items={groups.map((g) => ({ id: g.id, label: g.name }))}
              selected={selectedGroups}
              onToggle={(id) => onToggle(selectedGroups, id, setSelectedGroups)}
            />
            <SelectionPanel
              title="Positions"
              items={positions.map((p) => ({ id: p.id, label: p.name }))}
              selected={selectedPositions}
              onToggle={(id) =>
                onToggle(selectedPositions, id, setSelectedPositions)
              }
            />
            <SelectionPanel
              title="Areas"
              items={areas.map((a) => ({ id: a.id, label: a.name }))}
              selected={selectedAreas}
              onToggle={(id) => onToggle(selectedAreas, id, setSelectedAreas)}
            />
            <SelectionPanel
              title="Statuses"
              items={statuses.map((s) => ({ id: s.id, label: s.name }))}
              selected={selectedStatuses}
              onToggle={(id) =>
                onToggle(selectedStatuses, id, setSelectedStatuses)
              }
            />
          </div>
        )}

        {wizardStep === 2 && (
          <div className="space-y-6">
            <SelectionPanel
              title="Earnings"
              items={earningsList.map((e) => ({ id: e.id, label: e.name }))}
              selected={selectedEarnings}
              onToggle={(id) =>
                onToggle(selectedEarnings, id, setSelectedEarnings)
              }
            />
            <SelectionPanel
              title="Deductions"
              items={deductionsList.map((d) => ({ id: d.id, label: d.name }))}
              selected={selectedDeductions}
              onToggle={(id) =>
                onToggle(selectedDeductions, id, setSelectedDeductions)
              }
            />
            <SelectionPanel
              title="Benefits"
              items={benefitsList.map((b) => ({ id: b.id, label: b.name }))}
              selected={selectedBenefits}
              onToggle={(id) =>
                onToggle(selectedBenefits, id, setSelectedBenefits)
              }
            />
          </div>
        )}

        {wizardStep === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select columns to include in print output.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {printColumnOptions.map((col) => (
                <button
                  key={col.id}
                  onClick={() =>
                    onToggle(
                      selectedPrintColumns,
                      col.id,
                      setSelectedPrintColumns,
                    )
                  }
                  className={`flex items-center gap-2 p-3 border rounded-lg text-sm transition-colors ${
                    selectedPrintColumns.includes(col.id)
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {selectedPrintColumns.includes(col.id) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4 border rounded" />
                  )}
                  {col.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {wizardStep === 4 && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <h3 className="font-medium">Template Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{basicForm.name}</span>
                <span className="text-gray-500">Print Format:</span>
                <span className="font-medium">
                  {(() => {
                    const pf = printFormats.find(
                      (f) => f.id === basicForm.printFormat,
                    );
                    return pf
                      ? `${pf.name} (${pf.outputType})`
                      : basicForm.printFormat.charAt(0).toUpperCase() +
                          basicForm.printFormat.slice(1);
                  })()}
                </span>
                <span className="text-gray-500">Group By:</span>
                <span className="capitalize">{basicForm.groupBy}</span>
                <span className="text-gray-500">Groups:</span>
                <span>
                  {selectedGroups.length > 0
                    ? `${selectedGroups.length} selected`
                    : "All"}
                </span>
                <span className="text-gray-500">Earnings:</span>
                <span>{selectedEarnings.length} items</span>
                <span className="text-gray-500">Deductions:</span>
                <span>{selectedDeductions.length} items</span>
                <span className="text-gray-500">Benefits:</span>
                <span>{selectedBenefits.length} items</span>
                <span className="text-gray-500">Print Columns:</span>
                <span>{selectedPrintColumns.length} columns</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="ghost"
            disabled={wizardStep === 0}
            onClick={() => setWizardStep((s) => s - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {wizardStep < 4 ? (
            <Button
              disabled={!canProceed()}
              onClick={() => setWizardStep((s) => s + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              {editingId ? "Update" : "Create"} Template
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
