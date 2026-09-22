import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
import { useTableSort } from "@/hooks/useTableSort";
import type { Company } from "@/types";
import type { CompanyColumnGroup } from "./CompaniesPage.types";

export interface CompanyFormData {
  name: string;
  address: string;
  tin: string;
  printHeader: string;
  printFooter: string;
  printCss: string;
  defaultWorkdays: number;
  currency: string;
  payrollPeriods: Array<{
    type: "monthly" | "semi-monthly" | "bi-weekly" | "weekly";
    cutOff1Day?: number;
    cutOff2Day?: number;
    payDay?: number;
    frequency?: string;
  }>;
}

const DEFAULT_FORM_DATA: CompanyFormData = {
  name: "",
  address: "",
  tin: "",
  printHeader: "",
  printFooter: "",
  printCss: "",
  defaultWorkdays: 22,
  currency: "PHP",
  payrollPeriods: [],
};

const DEFAULT_COLUMN_GROUP: CompanyColumnGroup = {
  dtr: true,
  salaries: true,
  earnings: true,
  benefits: true,
  deductions: true,
};

export function useCompanies() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions();
  const { addToast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<CompanyFormData>({ ...DEFAULT_FORM_DATA });
  const [columnGroup, setColumnGroup] = useState<CompanyColumnGroup>({ ...DEFAULT_COLUMN_GROUP });

  const fetchCompanies = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "companies"));
    setCompanies(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Company[]);
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      await fetchCompanies();
    };
    load();
  }, []);

  const resetForm = () => {
    setFormData({ ...DEFAULT_FORM_DATA });
    setColumnGroup({ ...DEFAULT_COLUMN_GROUP });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { payrollPeriods, ...rest } = formData;
    const dataToSave = {
      ...rest,
      payrollPeriods: payrollPeriods.length > 0 ? payrollPeriods : null,
      columnGroup,
    };
    if (editingId) {
      await updateDoc(doc(db, "companies", editingId), dataToSave);
      addToast({
        type: "success",
        title: "Company updated",
        message: `${formData.name} has been updated`,
      });
    } else {
      await addDoc(collection(db, "companies"), {
        ...dataToSave,
        isActive: true,
        createdAt: new Date(),
      });
      addToast({
        type: "success",
        title: "Company created",
        message: `${formData.name} has been added`,
      });
    }
    resetForm();
    fetchCompanies();
  };

  const handleEdit = (company: Company) => {
    setEditingId(company.id);
    setFormData({
      name: company.name,
      address: company.address || "",
      tin: company.tin || "",
      printHeader: company.printHeader || "",
      printFooter: company.printFooter || "",
      printCss: company.printCss || "",
      defaultWorkdays: company.defaultWorkdays || 22,
      currency: company.currency || "PHP",
      payrollPeriods: company.payrollPeriods || [],
    });
    setColumnGroup(company.columnGroup || { ...DEFAULT_COLUMN_GROUP });
    setShowForm(true);
  };

  const addPayrollPeriod = () => {
    setFormData({
      ...formData,
      payrollPeriods: [
        ...formData.payrollPeriods,
        { type: "monthly" as const, cutOff1Day: 15, payDay: 5 },
      ],
    });
  };

  const removePayrollPeriod = (index: number) => {
    setFormData({
      ...formData,
      payrollPeriods: formData.payrollPeriods.filter((_, i) => i !== index),
    });
  };

  const updatePayrollPeriod = (
    index: number,
    field: string,
    value: string | number | undefined,
  ) => {
    const updated = [...formData.payrollPeriods] as {
      type: "monthly" | "semi-monthly" | "bi-weekly" | "weekly";
      cutOff1Day?: number;
      cutOff2Day?: number;
      payDay?: number;
      frequency?: string;
    }[];
    (updated[index] as Record<string, string | number | undefined>)[field] = value;
    setFormData({ ...formData, payrollPeriods: updated });
  };

  const handleToggleStatus = async (company: Company) => {
    const newStatus = !company.isActive;
    await updateDoc(doc(db, "companies", company.id), { isActive: newStatus });
    addToast({
      type: "info",
      title: "Status updated",
      message: `${company.name} is now ${newStatus ? "active" : "inactive"}`,
    });
    fetchCompanies();
  };

  const handleSoftDelete = async (company: Company) => {
    await updateDoc(doc(db, "companies", company.id), {
      isDeleted: true,
      isActive: false,
      deletedAt: new Date(),
    });
    addToast({
      type: "success",
      title: "Company archived",
      message: `${company.name} has been archived`,
    });
    fetchCompanies();
  };

  const handleRestore = async (company: Company) => {
    await updateDoc(doc(db, "companies", company.id), {
      isDeleted: false,
      isActive: true,
      deletedAt: null,
    });
    addToast({
      type: "success",
      title: "Company restored",
      message: `${company.name} has been restored`,
    });
    fetchCompanies();
  };

  const handlePermanentDelete = async (id: string) => {
    await deleteDoc(doc(db, "companies", id));
    addToast({ type: "success", title: "Company permanently deleted" });
    fetchCompanies();
  };

  const preFiltered = companies.filter((c) => {
    const matchesSearch =
      searchQuery === "" ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDeleted = showDeleted ? c.isDeleted : !c.isDeleted;
    return matchesSearch && matchesDeleted;
  });

  const {
    items: sortedCompanies,
    handleSort,
    sortConfig,
  } = useTableSort(preFiltered, "name");

  return {
    // State
    companies,
    loading,
    showForm,
    editingId,
    showDeleted,
    searchQuery,
    formData,
    columnGroup,
    // Derived
    sortedCompanies,
    sortConfig,
    // Permissions
    canView,
    canAdd,
    canEdit,
    canDelete,
    // Setters
    setShowForm,
    setEditingId,
    setShowDeleted,
    setSearchQuery,
    setFormData,
    setColumnGroup,
    // Actions
    fetchCompanies,
    handleSort,
    handleSubmit,
    handleEdit,
    addPayrollPeriod,
    removePayrollPeriod,
    updatePayrollPeriod,
    handleToggleStatus,
    handleSoftDelete,
    handleRestore,
    handlePermanentDelete,
  };
}
