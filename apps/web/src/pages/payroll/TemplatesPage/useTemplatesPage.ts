import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
import type {
  EmployeeArea,
  EmployeeGroup,
  EmployeePosition,
  EmployeeStatus,
  PayrollTemplate,
  PrintFormat,
} from "./TemplatesPage.types";

interface BasicForm {
  name: string;
  description: string;
  printFormat: string;
  groupBy: string;
}

export function useTemplatesPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const { addToast } = useToast();

  // Data state
  const [templates, setTemplates] = useState<PayrollTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(0);

  // Wizard form state
  const [basicForm, setBasicForm] = useState<BasicForm>({
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

  // Lookup data state
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
  }, []);
   
   
  useEffect(() => {
    fetchLookups();
  }, []);
   

  const toggleItem = (
    list: string[],
    id: string,
    setter: (l: string[]) => void,
  ) => {
    setter(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
  };

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

  const closeWizard = () => {
    setShowWizard(false);
    setEditingId(null);
    resetWizard();
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

  return {
    // Data
    templates,
    loading,
    // Wizard visibility
    showWizard,
    editingId,
    wizardStep,
    setWizardStep,
    // Wizard form state
    basicForm,
    setBasicForm,
    selectedGroups,
    setSelectedGroups,
    selectedPositions,
    setSelectedPositions,
    selectedAreas,
    setSelectedAreas,
    selectedStatuses,
    setSelectedStatuses,
    selectedEarnings,
    setSelectedEarnings,
    selectedDeductions,
    setSelectedDeductions,
    selectedBenefits,
    setSelectedBenefits,
    selectedPrintColumns,
    setSelectedPrintColumns,
    // Lookup data
    groups,
    positions,
    areas,
    statuses,
    earningsList,
    deductionsList,
    benefitsList,
    printFormats,
    // Actions
    openWizard,
    closeWizard,
    handleClone,
    handleDelete,
    handleSubmit,
    toggleItem,
    // Permissions
    canView,
    canAdd,
    canEdit,
    canDelete,
  };
}
