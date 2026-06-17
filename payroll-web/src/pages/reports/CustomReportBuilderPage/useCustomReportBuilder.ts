import { useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useCompany } from "@/hooks/useCompany";
import type { Employee, Payroll, PayrollEmployee } from "@/types";
import { exportToXLS } from "@/utils/exportUtils";
import type { ReportFilter, SavedReport } from "./CustomReportBuilderPage.types";
import { AVAILABLE_FIELDS } from "./CustomReportBuilderPage.constants";

export function useCustomReportBuilder() {
  const { selectedCompany: currentCompany } = useCompany();
  const currentCompanyId = currentCompany?.id;

  const [reportName, setReportName] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "emp_name",
    "emp_code",
    "basic_salary",
    "gross_pay",
    "net_pay",
  ]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [groupBy, setGroupBy] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("emp_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [activeTab, setActiveTab] = useState<"builder" | "saved" | "preview">(
    "builder",
  );

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((f) => f !== fieldId)
        : [...prev, fieldId],
    );
  };

  const addFilter = () => {
    setFilters((prev) => [
      ...prev,
      { field: "emp_name", operator: "contains", value: "" },
    ]);
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    setFilters((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f)),
    );
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const generateReport = async () => {
    if (!currentCompanyId || selectedFields.length === 0) return;

    setIsGenerating(true);
    try {
      // Fetch data
      const [employeesSnap, payrollsSnap, payrollEmpsSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "employees"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
        getDocs(
          query(
            collection(db, "payrolls"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
        getDocs(
          query(
            collection(db, "payroll_employees"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
      ]);

      const employees = employeesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Employee[];
      const payrolls = payrollsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Payroll[];
      const payrollEmps = payrollEmpsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PayrollEmployee[];

      // Build report data
      let data: Record<string, unknown>[] = payrollEmps.map((pe) => {
        const emp = employees.find((e) => e.nameId === pe.nameId);
        const payroll = payrolls.find((p) => p.id === pe.payrollId);

        return {
          emp_code: emp?.employeeCode || "",
          emp_name: "", // Would need name lookup
          payroll_name: payroll?.name || "",
          basic_salary: pe.basicSalary || 0,
          gross_pay: pe.grossPay || 0,
          net_pay: pe.netPay || 0,
          days_worked: pe.daysWorked || 0,
          absences: pe.absences || 0,
          late_hours: pe.lateHours || 0,
          overtime_hours: pe.overtimeHours || 0,
        };
      });

      // Apply filters
      filters.forEach((filter) => {
        data = data.filter((row) => {
          const rowValue = row[filter.field as keyof typeof row];
          const filterValue = String(filter.value);
          if (filter.operator === "contains") {
            return String(rowValue)
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          }
          if (filter.operator === "equals") {
            return String(rowValue) === filterValue;
          }
          if (filter.operator === "greater_than") {
            return Number(rowValue) > Number(filterValue);
          }
          if (filter.operator === "less_than") {
            return Number(rowValue) < Number(filterValue);
          }
          return true;
        });
      });

      // Apply sorting
      if (sortBy) {
        data.sort((a, b) => {
          const aVal = a[sortBy as keyof typeof a];
          const bVal = b[sortBy as keyof typeof b];
          const direction = sortDirection === "asc" ? 1 : -1;

          if (typeof aVal === "number" && typeof bVal === "number") {
            return (aVal - bVal) * direction;
          }
          return String(aVal).localeCompare(String(bVal)) * direction;
        });
      }

      // Apply grouping
      if (groupBy) {
        const grouped = data.reduce<
          Record<string, Record<string, unknown>[]>
        >(
          (acc, row) => {
            const key = String(
              row[groupBy as keyof typeof row] || "Unknown",
            );
            if (!acc[key]) acc[key] = [];
            acc[key]!.push(row);
            return acc;
          },
          {},
        );

        data = Object.entries(grouped).flatMap(([key, rows]) => [
          { __isGroupHeader: true, __groupKey: key } as Record<string, unknown>,
          ...rows,
        ]);
      }

      setPreviewData(data);
      setActiveTab("preview");
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = () => {
    const columns = selectedFields
      .map((fieldId) => AVAILABLE_FIELDS.find((f) => f.id === fieldId))
      .filter(Boolean)
      .map((f) => ({
        header: f!.label,
        key: f!.id,
        width: 15,
      }));

    exportToXLS(
      previewData.filter((row) => !row.__isGroupHeader),
      {
        filename: `custom_report_${
          new Date().toISOString().split("T")[0]
        }`,
        columns,
        sheetName: "Custom Report",
      },
    );
  };

  const saveReport = () => {
    if (!reportName) return;

    const newReport: SavedReport = {
      id: `report_${Date.now()}`,
      name: reportName,
      fields: selectedFields,
      filters,
      groupBy,
      sortBy,
      sortDirection,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSavedReports((prev) => [...prev, newReport]);
    setReportName("");
  };

  const loadReport = (report: SavedReport) => {
    setSelectedFields(report.fields);
    setFilters(report.filters);
    setGroupBy(report.groupBy || "");
    setSortBy(report.sortBy || "");
    setSortDirection(report.sortDirection ?? "asc");
    setActiveTab("builder");
  };

  return {
    // State
    reportName,
    setReportName,
    selectedFields,
    filters,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    isGenerating,
    previewData,
    savedReports,
    activeTab,
    setActiveTab,
    // Actions
    toggleField,
    addFilter,
    updateFilter,
    removeFilter,
    generateReport,
    exportReport,
    saveReport,
    loadReport,
    // Constants
    AVAILABLE_FIELDS,
    currentCompanyId,
  };
}
