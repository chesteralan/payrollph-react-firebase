import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { usePermissions } from "../../hooks/usePermissions";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
} from "lucide-react";
import type {
  PayrollTemplate,
  EmployeeGroup,
  EmployeePosition,
  EmployeeArea,
  EmployeeStatus,
  PrintFormat,
} from "../../types";

const WIZARD_STEPS = [
  "Basic Info",
  "Groups & Filters",
  "Columns",
  "Print Settings",
  "Review",
];

export function TemplatesPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const { addToast } = useToast();
  const [templates, setTemplates] = useState<PayrollTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(0);

  const [basicForm, setBasicForm] = useState({
    name: "",
    description: "",
    printFormat: "register",
    groupBy: "group",
  });
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedEarnings, setSelectedEarnings] = useState<string[]>([]);
  const [selectedDeductions, setSelectedDeductions] = useState<string[]>([]);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [selectedPrintColumns, setSelectedPrintColumns] = useState<string[]>([
    "basic",
    "earnings",
    "gross",
    "deductions",
    "benefits",
    "net",
  ]);

  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [positions, setPositions] = useState<EmployeePosition[]>([]);
  const [areas, setAreas] = useState<EmployeeArea[]>([]);
  const [statuses, setStatuses] = useState<EmployeeStatus[]>([]);
  const [earningsList, setEarningsList] = useState<
    { id: string; name: string }[]
  >([]);
  const [deductionsList, setDeductionsList] = useState<
    { id: string; name: string }[]
  >([]);
  const [benefitsList, setBenefitsList] = useState<
    { id: string; name: string }[]
  >([]);
  const [printFormats, setPrintFormats] = useState<PrintFormat[]>([]);

  const fetchTemplates = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "payroll_templates"));
    setTemplates(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PayrollTemplate[],
    );
    setLoading(false);
  };

  const fetchLookups = async () => {
    const [gSnap, pSnap, aSnap, sSnap, eSnap, dSnap, bSnap, pfSnap] =
      await Promise.all([
        getDocs(
          query(
            collection(db, "employee_groups"),
            where("isActive", "==", true),
          ),
        ),
        getDocs(
          query(
            collection(db, "employee_positions"),
            where("isActive", "==", true),
          ),
        ),
        getDocs(
          query(
            collection(db, "employee_areas"),
            where("isActive", "==", true),
          ),
        ),
        getDocs(
          query(
            collection(db, "employee_statuses"),
            where("isActive", "==", true),
          ),
        ),
        getDocs(query(collection(db, "earnings"))),
        getDocs(query(collection(db, "deductions"))),
        getDocs(query(collection(db, "benefits"))),
        getDocs(query(collection(db, "print_formats"))),
      ]);
    setGroups(
      gSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as EmployeeGroup[],
    );
    setPositions(
      pSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as EmployeePosition[],
    );
    setAreas(
      aSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as EmployeeArea[],
    );
    setStatuses(
      sSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as EmployeeStatus[],
    );
    setEarningsList(
      eSnap.docs.map((d) => ({
        id: d.id,
        name: (d.data() as { name: string }).name,
      })),
    );
    setDeductionsList(
      dSnap.docs.map((d) => ({
        id: d.id,
        name: (d.data() as { name: string }).name,
      })),
    );
    setBenefitsList(
      bSnap.docs.map((d) => ({
        id: d.id,
        name: (d.data() as { name: string }).name,
      })),
    );
    setPrintFormats(
      pfSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as PrintFormat[],
    );
  };

  useEffect(() => {
    fetchTemplates();
  }, []); // eslint-disable-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchLookups();
  }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const resetWizard = () => {
    setWizardStep(0);
    setBasicForm({
      name: "",
      description: "",
      printFormat: "register",
      groupBy: "group",
    });
    setSelectedGroups([]);
    setSelectedPositions([]);
    setSelectedAreas([]);
    setSelectedStatuses([]);
    setSelectedEarnings([]);
    setSelectedDeductions([]);
    setSelectedBenefits([]);
    setSelectedPrintColumns([
      "basic",
      "earnings",
      "gross",
      "deductions",
      "benefits",
      "net",
    ]);
  };

  const openWizard = (template?: PayrollTemplate) => {
    resetWizard();
    if (template) {
      setEditingId(template.id);
      setBasicForm({
        name: template.name,
        description: template.description || "",
        printFormat: template.printFormat || "register",
        groupBy: template.groupBy || "group",
      });
      setSelectedEarnings(template.earnings || []);
      setSelectedDeductions(template.deductions || []);
      setSelectedBenefits(template.benefits || []);
      setSelectedPrintColumns(
        template.printColumns || [
          "basic",
          "earnings",
          "gross",
          "deductions",
          "benefits",
          "net",
        ],
      );
    }
    setShowWizard(true);
  };

  const handleClone = async (template: PayrollTemplate) => {
    const cloneData = {
      name: `${template.name} (Copy)`,
      description: template.description || "",
      companyId: template.companyId || "",
      pages: template.pages || 1,
      printFormat: template.printFormat || "register",
      groupBy: template.groupBy || "group",
      isActive: true,
      earnings: template.earnings || [],
      deductions: template.deductions || [],
      benefits: template.benefits || [],
      printColumns: template.printColumns || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await addDoc(collection(db, "payroll_templates"), cloneData);
    addToast({ type: "success", title: "Template cloned" });
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "payroll_templates", id));
    addToast({ type: "success", title: "Template deleted" });
    fetchTemplates();
  };

  const handleSubmit = async () => {
    const data = {
      name: basicForm.name,
      description: basicForm.description,
      companyId: "default",
      pages: 1,
      printFormat: basicForm.printFormat,
      groupBy: basicForm.groupBy,
      isActive: true,
      earnings: selectedEarnings,
      deductions: selectedDeductions,
      benefits: selectedBenefits,
      printColumns: selectedPrintColumns,
      updatedAt: new Date(),
    };

    if (editingId) {
      await updateDoc(doc(db, "payroll_templates", editingId), data);
      addToast({ type: "success", title: "Template updated" });
    } else {
      await addDoc(collection(db, "payroll_templates"), {
        ...data,
        createdAt: new Date(),
      });
      addToast({ type: "success", title: "Template created" });
    }
    setShowWizard(false);
    setEditingId(null);
    resetWizard();
    fetchTemplates();
  };

  const toggleItem = (
    list: string[],
    id: string,
    setter: (l: string[]) => void,
  ) => {
    setter(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
  };

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

  if (!canView("payroll", "templates"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Templates</h1>
        {canAdd("payroll", "templates") && (
          <Button onClick={() => openWizard()}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {showWizard && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? "Edit" : "Create"} Template</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowWizard(false);
                  setEditingId(null);
                  resetWizard();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-4">
              {WIZARD_STEPS.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => i <= wizardStep && setWizardStep(i)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${i === wizardStep ? "bg-primary-600 text-white" : i < wizardStep ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
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
                      setBasicForm({
                        ...basicForm,
                        printFormat: e.target.value,
                      })
                    }
                  >
                    <option value="register">Default: Payroll Register</option>
                    <option value="payslip">Default: Payslip</option>
                    <option value="transmittal">
                      Default: Bank Transmittal
                    </option>
                    <option value="journal">Default: Journal Entry</option>
                    <option value="denomination">
                      Default: Cash Denomination
                    </option>
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
                  onToggle={(id) =>
                    toggleItem(selectedGroups, id, setSelectedGroups)
                  }
                />
                <SelectionPanel
                  title="Positions"
                  items={positions.map((p) => ({ id: p.id, label: p.name }))}
                  selected={selectedPositions}
                  onToggle={(id) =>
                    toggleItem(selectedPositions, id, setSelectedPositions)
                  }
                />
                <SelectionPanel
                  title="Areas"
                  items={areas.map((a) => ({ id: a.id, label: a.name }))}
                  selected={selectedAreas}
                  onToggle={(id) =>
                    toggleItem(selectedAreas, id, setSelectedAreas)
                  }
                />
                <SelectionPanel
                  title="Statuses"
                  items={statuses.map((s) => ({ id: s.id, label: s.name }))}
                  selected={selectedStatuses}
                  onToggle={(id) =>
                    toggleItem(selectedStatuses, id, setSelectedStatuses)
                  }
                />
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-6">
                <SelectionPanel
                  title="Earnings"
                  items={earningsList}
                  selected={selectedEarnings}
                  onToggle={(id) =>
                    toggleItem(selectedEarnings, id, setSelectedEarnings)
                  }
                />
                <SelectionPanel
                  title="Deductions"
                  items={deductionsList}
                  selected={selectedDeductions}
                  onToggle={(id) =>
                    toggleItem(selectedDeductions, id, setSelectedDeductions)
                  }
                />
                <SelectionPanel
                  title="Benefits"
                  items={benefitsList}
                  selected={selectedBenefits}
                  onToggle={(id) =>
                    toggleItem(selectedBenefits, id, setSelectedBenefits)
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
                        toggleItem(
                          selectedPrintColumns,
                          col.id,
                          setSelectedPrintColumns,
                        )
                      }
                      className={`flex items-center gap-2 p-3 border rounded-lg text-sm transition-colors ${selectedPrintColumns.includes(col.id) ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
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
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Print Format
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Components
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No templates found
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {t.name}
                      </div>
                      {t.description && (
                        <div className="text-xs text-gray-500">
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(() => {
                        const pf = printFormats.find(
                          (f) => f.id === t.printFormat,
                        );
                        return pf
                          ? pf.name
                          : (t.printFormat || "register")
                              .charAt(0)
                              .toUpperCase() +
                              (t.printFormat || "register").slice(1);
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(t.earnings?.length || 0) +
                        (t.deductions?.length || 0) +
                        (t.benefits?.length || 0)}{" "}
                      items
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canAdd("payroll", "templates") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClone(t)}
                            title="Clone"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        {canEdit("payroll", "templates") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openWizard(t)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete("payroll", "templates") && (
                          <ConfirmDialog
                            title="Delete Template"
                            message={`Delete "${t.name}"?`}
                            confirmText="Delete"
                            onConfirm={() => handleDelete(t.id)}
                          >
                            {(open) => (
                              <Button variant="ghost" size="sm" onClick={open}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </ConfirmDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function SelectionPanel({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <span className="text-xs text-gray-500">
          {selected.length}/{items.length} selected
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-colors ${selected.includes(item.id) ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
          >
            {selected.includes(item.id) ? (
              <Check className="w-3 h-3 shrink-0" />
            ) : (
              <div className="w-3 h-3 border rounded shrink-0" />
            )}
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
