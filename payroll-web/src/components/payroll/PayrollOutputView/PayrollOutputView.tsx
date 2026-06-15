import { useCallback, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/Button";
import {
  Download,
  FileSpreadsheet,
  Printer,
} from "lucide-react";

import type {
  OutputMode,
  PayrollOutputViewProps,
  ProcessingRow,
} from "./PayrollOutputView.types";
import { PayrollRegisterMode } from "./RegisterMode";
import { PayslipMode } from "./PayslipMode";
import { TransmittalMode } from "./TransmittalMode";
import { JournalMode } from "./JournalMode";
import { DenominationMode } from "./DenominationMode";

export function PayrollOutputView({
  payroll,
  company,
  rows,
  earningData,
  deductionData,
  benefitData,
  earningsList,
  deductionsList,
  benefitsList,
}: PayrollOutputViewProps) {
  const [activeMode, setActiveMode] = useState<OutputMode>("register");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [filterGroup, setFilterGroup] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    basic: true,
    earnings: true,
    gross: true,
    deductions: true,
    benefits: true,
    net: true,
    daysWorked: false,
    absences: false,
    late: false,
    overtime: false,
  });

  const groups = useMemo(
    () => [...new Set(rows.map((r) => r.groupId).filter(Boolean))],
    [rows],
  );
  const positions = useMemo(
    () => [...new Set(rows.map((r) => r.positionId).filter(Boolean))],
    [rows],
  );
  const areas = useMemo(
    () => [...new Set(rows.map((r) => r.areaId).filter(Boolean))],
    [rows],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterGroup && r.groupId !== filterGroup) return false;
      if (filterPosition && r.positionId !== filterPosition) return false;
      if (filterArea && r.areaId !== filterArea) return false;
      return true;
    });
  }, [rows, filterGroup, filterPosition, filterArea]);

  const hasActiveFilters = !!(filterGroup || filterPosition || filterArea);
  const activeFilterCount = [filterGroup, filterPosition, filterArea].filter(
    Boolean,
  ).length;
  const monthName = new Date(0, payroll.month - 1).toLocaleString("default", {
    month: "long",
  });

  const getEmployeeEarnings = (row: ProcessingRow) => {
    const empEarnings = earningData.get(row.nameId) || new Map();
    return earningsList
      .map((e) => ({
        name: e.name,
        amount: empEarnings.get(e.id) || 0,
      }))
      .filter((e) => e.amount > 0);
  };

  const getEmployeeDeductions = (row: ProcessingRow) => {
    const empDeductions = deductionData.get(row.nameId) || new Map();
    return deductionsList
      .map((d) => ({
        name: d.name,
        amount: empDeductions.get(d.id) || 0,
      }))
      .filter((d) => d.amount > 0);
  };

  const getEmployeeBenefits = (row: ProcessingRow) => {
    const empBenefits = benefitData.get(row.nameId) || new Map();
    return benefitsList
      .map((b) => {
        const val = empBenefits.get(b.id) || {
          employeeShare: 0,
          employerShare: 0,
        };
        return {
          name: b.name,
          employeeShare: val.employeeShare,
          employerShare: val.employerShare,
        };
      })
      .filter((b) => b.employeeShare > 0 || b.employerShare > 0);
  };

  const getEmployeeGross = useCallback(
    (row: ProcessingRow) => {
      const earnings = Array.from(
        earningData.get(row.nameId)?.values() || [],
      ).reduce((s, v) => s + v, 0);
      return row.salaryAmount + earnings;
    },
    [earningData],
  );

  const getEmployeeNet = useCallback(
    (row: ProcessingRow) => {
      const deductions = Array.from(
        deductionData.get(row.nameId)?.values() || [],
      ).reduce((s, v) => s + v, 0);
      const benefits = Array.from(
        benefitData.get(row.nameId)?.values() || [],
      ).reduce((s, v) => s + v.employeeShare, 0);
      return getEmployeeGross(row) - deductions - benefits;
    },
    [deductionData, benefitData, getEmployeeGross],
  );

  const totals = useMemo(() => {
    const totalBasic = filteredRows.reduce((s, r) => s + r.salaryAmount, 0);
    const totalEarnings = filteredRows.reduce(
      (s, r) =>
        s +
        Array.from(earningData.get(r.nameId)?.values() || []).reduce(
          (a, v) => a + v,
          0,
        ),
      0,
    );
    const totalGross = filteredRows.reduce(
      (s, r) => s + getEmployeeGross(r),
      0,
    );
    const totalDeductions = filteredRows.reduce(
      (s, r) =>
        s +
        Array.from(deductionData.get(r.nameId)?.values() || []).reduce(
          (a, v) => a + v,
          0,
        ),
      0,
    );
    const totalBenefitsEE = filteredRows.reduce(
      (s, r) =>
        s +
        Array.from(benefitData.get(r.nameId)?.values() || []).reduce(
          (a, v) => a + v.employeeShare,
          0,
        ),
      0,
    );
    const totalBenefitsER = filteredRows.reduce(
      (s, r) =>
        s +
        Array.from(benefitData.get(r.nameId)?.values() || []).reduce(
          (a, v) => a + v.employerShare,
          0,
        ),
      0,
    );
    const totalNet = filteredRows.reduce((s, r) => s + getEmployeeNet(r), 0);
    return {
      totalBasic,
      totalEarnings,
      totalGross,
      totalDeductions,
      totalBenefitsEE,
      totalBenefitsER,
      totalNet,
    };
  }, [
    filteredRows,
    earningData,
    deductionData,
    benefitData,
    getEmployeeGross,
    getEmployeeNet,
  ]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportXLS = () => {
    const wb = XLSX.utils.book_new();

    const registerData = rows.map((row) => ({
      "Employee ID": row.employeeCode,
      Name: `${row.firstName} ${row.lastName}`,
      "Basic Salary": row.salaryAmount,
      Earnings: Array.from(earningData.get(row.nameId)?.values() || []).reduce(
        (s, v) => s + v,
        0,
      ),
      "Gross Pay": getEmployeeGross(row),
      Deductions: Array.from(
        deductionData.get(row.nameId)?.values() || [],
      ).reduce((s, v) => s + v, 0),
      "Benefits (EE)": Array.from(
        benefitData.get(row.nameId)?.values() || [],
      ).reduce((s, v) => s + v.employeeShare, 0),
      "Net Pay": getEmployeeNet(row),
    }));

    registerData.push({
      "Employee ID": "TOTAL",
      Name: "",
      "Basic Salary": totals.totalBasic,
      Earnings: totals.totalEarnings,
      "Gross Pay": totals.totalGross,
      Deductions: totals.totalDeductions,
      "Benefits (EE)": totals.totalBenefitsEE,
      "Net Pay": totals.totalNet,
    });

    const ws = XLSX.utils.json_to_sheet(registerData);
    XLSX.utils.book_append_sheet(wb, ws, "Payroll Register");

    // Column widths
    ws["!cols"] = [
      { wch: 15 }, // Employee ID
      { wch: 25 }, // Name
      { wch: 15 }, // Basic Salary
      { wch: 15 }, // Earnings
      { wch: 15 }, // Gross Pay
      { wch: 15 }, // Deductions
      { wch: 15 }, // Benefits (EE)
      { wch: 15 }, // Net Pay
    ];

    // Freeze header row
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    // Apply header row styles (row 1, 0-indexed r=0)
    for (let c = 0; c < 8; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c });
      const cell = ws[cellAddr];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFFFF" } },
          fill: { fgColor: { rgb: "FF4472C4" } },
          border: {
            top: { style: "thin", color: { rgb: "FF000000" } },
            bottom: { style: "thin", color: { rgb: "FF000000" } },
            left: { style: "thin", color: { rgb: "FF000000" } },
            right: { style: "thin", color: { rgb: "FF000000" } },
          },
        };
      }
    }

    // Apply data and total row styles
    const totalRowIndex = registerData.length - 1;
    for (let r = 1; r < registerData.length; r++) {
      const isTotalRow = r === totalRowIndex;
      // Numeric columns: C to H (c=2 to 7)
      for (let c = 2; c < 8; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[cellAddr];
        if (!cell) continue;

        if (isTotalRow) {
          cell.s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "FFD9E1F2" } },
            border: {
              top: { style: "medium", color: { rgb: "FF000000" } },
              bottom: { style: "thin", color: { rgb: "FF000000" } },
              left: { style: "thin", color: { rgb: "FF000000" } },
              right: { style: "thin", color: { rgb: "FF000000" } },
            },
            numFmt: "₱#,##0.00",
          };
        } else {
          cell.s = { ...cell.s, numFmt: "₱#,##0.00" };
        }
      }
      // Total row label styling
      if (isTotalRow) {
        const labelCell = ws[XLSX.utils.encode_cell({ r, c: 0 })];
        if (labelCell) labelCell.s = { ...labelCell.s, font: { bold: true } };
        const nameCell = ws[XLSX.utils.encode_cell({ r, c: 1 })];
        if (nameCell) nameCell.s = { ...nameCell.s, font: { bold: true } };
      }
    }

    XLSX.writeFile(
      wb,
      `Payroll_${payroll.name}_${monthName}_${payroll.year}.xlsx`,
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "Employee ID",
      "Name",
      "Basic Salary",
      "Earnings",
      "Gross Pay",
      "Deductions",
      "Benefits (EE)",
      "Net Pay",
    ];
    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        [
          row.employeeCode,
          `${row.firstName} ${row.lastName}`,
          row.salaryAmount,
          Array.from(earningData.get(row.nameId)?.values() || []).reduce(
            (s, v) => s + v,
            0,
          ),
          getEmployeeGross(row),
          Array.from(deductionData.get(row.nameId)?.values() || []).reduce(
            (s, v) => s + v,
            0,
          ),
          Array.from(benefitData.get(row.nameId)?.values() || []).reduce(
            (s, v) => s + v.employeeShare,
            0,
          ),
          getEmployeeNet(row),
        ].join(","),
      ),
      [
        "TOTAL",
        "",
        totals.totalBasic,
        totals.totalEarnings,
        totals.totalGross,
        totals.totalDeductions,
        totals.totalBenefitsEE,
        totals.totalNet,
      ].join(","),
    ];
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payroll_${payroll.name}_${payroll.month}_${payroll.year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const MODES: { key: OutputMode; label: string }[] = [
    { key: "register", label: "Payroll Register" },
    { key: "payslip", label: "Payslips" },
    { key: "transmittal", label: "Transmittal" },
    { key: "journal", label: "Journal Entry" },
    { key: "denomination", label: "Denomination" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{payroll.name}</h1>
          <p className="text-gray-500">
            {monthName} {payroll.year}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="secondary" onClick={handleExportXLS}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export XLS
          </Button>
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setActiveMode(mode.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeMode === mode.key
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {activeMode === "register" && (
        <PayrollRegisterMode
          rows={rows}
          filteredRows={filteredRows}
          earningData={earningData}
          deductionData={deductionData}
          benefitData={benefitData}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          showColumns={showColumns}
          setShowColumns={setShowColumns}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          filterGroup={filterGroup}
          setFilterGroup={setFilterGroup}
          filterPosition={filterPosition}
          setFilterPosition={setFilterPosition}
          filterArea={filterArea}
          setFilterArea={setFilterArea}
          groups={groups}
          positions={positions}
          areas={areas}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          totals={totals}
          company={company}
          payroll={payroll}
          monthName={monthName}
        />
      )}

      {activeMode === "payslip" && (
        <PayslipMode
          rows={rows}
          filteredRows={filteredRows}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          getEmployeeEarnings={getEmployeeEarnings}
          getEmployeeDeductions={getEmployeeDeductions}
          getEmployeeBenefits={getEmployeeBenefits}
          getEmployeeNet={getEmployeeNet}
          payroll={payroll}
          monthName={monthName}
        />
      )}

      {activeMode === "transmittal" && (
        <TransmittalMode
          rows={rows}
          getEmployeeNet={getEmployeeNet}
          totals={totals}
          company={company}
          payroll={payroll}
          monthName={monthName}
        />
      )}

      {activeMode === "journal" && (
        <JournalMode
          totals={totals}
          company={company}
          payroll={payroll}
          monthName={monthName}
        />
      )}

      {activeMode === "denomination" && (
        <DenominationMode
          rows={rows}
          totals={totals}
          getEmployeeNet={getEmployeeNet}
          company={company}
          payroll={payroll}
          monthName={monthName}
        />
      )}
    </div>
  );
}
