import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { PrintFormat } from "./PrintFormatsPage.types";
import { DEFAULT_COLUMNS, DEFAULT_SIGNATURE_LABELS, OUTPUT_TYPES, WIZARD_STEPS } from "./PrintFormatsPage.constants";
import {
  WizardBasicInfoStep,
  WizardColumnsStep,
  WizardHeaderFooterStep,
  WizardLayoutStep,
  WizardReviewStep,
} from "./PrintFormatsPage.wizard";
import type {
  BasicFormState,
  HeaderFormState,
  LayoutFormState,
} from "./PrintFormatsPage.wizard";

const INITIAL_BASIC: BasicFormState = {
  name: "",
  description: "",
  outputType: "register",
};

const INITIAL_LAYOUT: LayoutFormState = {
  paperSize: "A4",
  orientation: "portrait",
  fontSize: "sm",
};

const INITIAL_HEADER: HeaderFormState = {
  showHeader: true,
  showFooter: false,
  headerHtml: "",
  footerHtml: "",
  showCompanyLogo: true,
  showCompanyName: true,
  showCompanyAddress: true,
  showCompanyTIN: true,
  showTitle: true,
  showPeriod: true,
  showSignatureLines: false,
  signatureLabels: [...DEFAULT_SIGNATURE_LABELS],
};

const INITIAL_COLUMNS = [...DEFAULT_COLUMNS];

/* ── Component ───────────────────────────────────────── */

export function PrintFormatsPage() {
  const { currentCompanyId } = useAuth();
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const { addToast } = useToast();
  const [formats, setFormats] = useState<PrintFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(0);

  const [basicForm, setBasicForm] = useState<BasicFormState>({ ...INITIAL_BASIC });
  const [layoutForm, setLayoutForm] = useState<LayoutFormState>({ ...INITIAL_LAYOUT });
  const [headerForm, setHeaderForm] = useState<HeaderFormState>({ ...INITIAL_HEADER });
  const [selectedColumns, setSelectedColumns] = useState<string[]>([...INITIAL_COLUMNS]);
  const [includeTotals, setIncludeTotals] = useState(true);

  const fetchFormats = async () => {
    setLoading(true);
    const q = currentCompanyId
      ? query(
          collection(db, "print_formats"),
          where("companyId", "==", currentCompanyId),
        )
      : query(collection(db, "print_formats"));
    const snap = await getDocs(q);
    setFormats(
      snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PrintFormat[],
    );
    setLoading(false);
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */ fetchFormats(); /* eslint-enable react-hooks/set-state-in-effect */
  }, [currentCompanyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetWizard = () => {
    setWizardStep(0);
    setBasicForm({ ...INITIAL_BASIC });
    setLayoutForm({ ...INITIAL_LAYOUT });
    setHeaderForm({ ...INITIAL_HEADER, signatureLabels: [...DEFAULT_SIGNATURE_LABELS] });
    setSelectedColumns([...INITIAL_COLUMNS]);
    setIncludeTotals(true);
  };

  const openWizard = (format?: PrintFormat) => {
    resetWizard();
    if (format) {
      setEditingId(format.id);
      setBasicForm({
        name: format.name,
        description: format.description || "",
        outputType: format.outputType,
      });
      setLayoutForm({
        paperSize: format.paperSize,
        orientation: format.orientation,
        fontSize: format.fontSize,
      });
      setHeaderForm({
        showHeader: format.showHeader,
        showFooter: format.showFooter,
        headerHtml: format.headerHtml || "",
        footerHtml: format.footerHtml || "",
        showCompanyLogo: format.showCompanyLogo,
        showCompanyName: format.showCompanyName,
        showCompanyAddress: format.showCompanyAddress,
        showCompanyTIN: format.showCompanyTIN,
        showTitle: format.showTitle,
        showPeriod: format.showPeriod,
        showSignatureLines: format.showSignatureLines,
        signatureLabels: format.signatureLabels || [...DEFAULT_SIGNATURE_LABELS],
      });
      setSelectedColumns(format.columnOrder || [...INITIAL_COLUMNS]);
      setIncludeTotals(format.includeTotals);
    }
    setShowWizard(true);
  };

  const handleClone = async (format: PrintFormat) => {
    const cloneData = {
      name: `${format.name} (Copy)`,
      description: format.description || "",
      companyId: currentCompanyId || format.companyId || "",
      outputType: format.outputType,
      paperSize: format.paperSize,
      orientation: format.orientation,
      fontSize: format.fontSize,
      showHeader: format.showHeader,
      showFooter: format.showFooter,
      headerHtml: format.headerHtml || null,
      footerHtml: format.footerHtml || null,
      showCompanyLogo: format.showCompanyLogo,
      showCompanyName: format.showCompanyName,
      showCompanyAddress: format.showCompanyAddress,
      showCompanyTIN: format.showCompanyTIN,
      showTitle: format.showTitle,
      showPeriod: format.showPeriod,
      showSignatureLines: format.showSignatureLines,
      signatureLabels: format.signatureLabels || [],
      columnOrder: format.columnOrder || [],
      includeTotals: format.includeTotals,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await addDoc(collection(db, "print_formats"), cloneData);
    addToast({ type: "success", title: "Print format cloned" });
    fetchFormats();
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "print_formats", id));
    addToast({ type: "success", title: "Print format deleted" });
    fetchFormats();
  };

  const handleSubmit = async () => {
    const data: Record<string, unknown> = {
      name: basicForm.name,
      description: basicForm.description,
      companyId: currentCompanyId || "",
      outputType: basicForm.outputType,
      paperSize: layoutForm.paperSize,
      orientation: layoutForm.orientation,
      fontSize: layoutForm.fontSize,
      showHeader: headerForm.showHeader,
      showFooter: headerForm.showFooter,
      headerHtml: headerForm.headerHtml || null,
      footerHtml: headerForm.footerHtml || null,
      showCompanyLogo: headerForm.showCompanyLogo,
      showCompanyName: headerForm.showCompanyName,
      showCompanyAddress: headerForm.showCompanyAddress,
      showCompanyTIN: headerForm.showCompanyTIN,
      showTitle: headerForm.showTitle,
      showPeriod: headerForm.showPeriod,
      showSignatureLines: headerForm.showSignatureLines,
      signatureLabels: headerForm.signatureLabels,
      columnOrder: selectedColumns,
      includeTotals,
      isActive: true,
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "print_formats", editingId), data);
      addToast({ type: "success", title: "Print format updated" });
    } else {
      await addDoc(collection(db, "print_formats"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      addToast({ type: "success", title: "Print format created" });
    }
    setShowWizard(false);
    setEditingId(null);
    resetWizard();
    fetchFormats();
  };

  const canProceed = () => {
    if (wizardStep === 0) return basicForm.name.trim().length > 0;
    return true;
  };

  if (!canView("payroll", "templates"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Print Format Templates
          </h1>
          <p className="text-gray-500 mt-1">
            Configure print layouts for payroll output views
          </p>
        </div>
        {canAdd("payroll", "templates") && (
          <Button onClick={() => openWizard()}>
            <Plus className="w-4 h-4 mr-2" />
            New Print Format
          </Button>
        )}
      </div>

      {/* ── Wizard ──────────────────────────────────── */}
      {showWizard && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {editingId ? "Edit" : "Create"} Print Format
              </CardTitle>
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
              <WizardBasicInfoStep
                basicForm={basicForm}
                setBasicForm={setBasicForm}
              />
            )}
            {wizardStep === 1 && (
              <WizardLayoutStep
                layoutForm={layoutForm}
                setLayoutForm={setLayoutForm}
              />
            )}
            {wizardStep === 2 && (
              <WizardHeaderFooterStep
                headerForm={headerForm}
                setHeaderForm={setHeaderForm}
              />
            )}
            {wizardStep === 3 && (
              <WizardColumnsStep
                selectedColumns={selectedColumns}
                setSelectedColumns={setSelectedColumns}
                includeTotals={includeTotals}
                setIncludeTotals={setIncludeTotals}
              />
            )}
            {wizardStep === 4 && (
              <WizardReviewStep
                basicForm={basicForm}
                layoutForm={layoutForm}
                headerForm={headerForm}
                selectedColumns={selectedColumns}
                includeTotals={includeTotals}
              />
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
                  {editingId ? "Update" : "Create"} Format
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Format List Table ────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Output Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Paper
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  Columns
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
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : formats.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No print formats found
                  </td>
                </tr>
              ) : (
                formats.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {f.name}
                      </div>
                      {f.description && (
                        <div className="text-xs text-gray-500">
                          {f.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-gray-500">
                      {OUTPUT_TYPES.find((t) => t.value === f.outputType)
                        ?.label || f.outputType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {f.paperSize} {f.orientation}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {f.columnOrder?.length || 0} columns
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canAdd("payroll", "templates") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClone(f)}
                            title="Clone"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        {canEdit("payroll", "templates") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openWizard(f)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete("payroll", "templates") && (
                          <ConfirmDialog
                            title="Delete Print Format"
                            message={`Delete "${f.name}"?`}
                            confirmText="Delete"
                            onConfirm={() => handleDelete(f.id)}
                          >
                            {(open: () => void) => (
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
