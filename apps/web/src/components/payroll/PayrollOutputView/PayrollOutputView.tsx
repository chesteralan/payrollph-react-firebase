import { useCallback, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { Button } from "@/components/ui/Button";
import { Download, FileSpreadsheet, Printer } from "lucide-react";

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
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
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
    },
  );

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

  const handleExportXLS = async () => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Payroll Register");

    ws.columns = [
      { header: "Employee ID", key: "employeeId", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Basic Salary", key: "basicSalary", width: 15 },
      { header: "Earnings", key: "earnings", width: 15 },
      { header: "Gross Pay", key: "grossPay", width: 15 },
      { header: "Deductions", key: "deductions", width: 15 },
      { header: "Benefits (EE)", key: "benefitsEE", width: 15 },
      { header: "Net Pay", key: "netPay", width: 15 },
    ];

    rows.forEach((row) => {
      ws.addRow({
        employeeId: row.employeeCode,
        name: `${row.firstName} ${row.lastName}`,
        basicSalary: row.salaryAmount,
        earnings: Array.from(
          earningData.get(row.nameId)?.values() || [],
        ).reduce((s, v) => s + v, 0),
        grossPay: getEmployeeGross(row),
        deductions: Array.from(
          deductionData.get(row.nameId)?.values() || [],
        ).reduce((s, v) => s + v, 0),
        benefitsEE: Array.from(
          benefitData.get(row.nameId)?.values() || [],
        ).reduce((s, v) => s + v.employeeShare, 0),
        netPay: getEmployeeNet(row),
      });
    });

    ws.addRow({
      employeeId: "TOTAL",
      name: "",
      basicSalary: totals.totalBasic,
      earnings: totals.totalEarnings,
      grossPay: totals.totalGross,
      deductions: totals.totalDeductions,
      benefitsEE: totals.totalBenefitsEE,
      netPay: totals.totalNet,
    });

    ws.views = [{ state: "frozen", ySplit: 1 }];

    const borderStyle: Partial<ExcelJS.Border> = {
      style: "thin",
      color: { argb: "FF000000" },
    };
    const thinBorders: ExcelJS.Borders = {
      top: borderStyle,
      bottom: borderStyle,
      left: borderStyle,
      right: borderStyle,
      diagonal: {
        style: "thin",
        color: { argb: "FF000000" },
        up: false,
        down: false,
      },
    };

    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.border = thinBorders;
    });

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const isTotalRow = r === ws.rowCount;
      for (let c = 3; c <= 8; c++) {
        const cell = row.getCell(c);
        cell.numFmt = "₱#,##0.00";
        if (isTotalRow) {
          cell.font = { bold: true };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9E1F2" },
          };
          cell.border = {
            top: { style: "medium", color: { argb: "FF000000" } },
            bottom: thinBorders.bottom,
            left: thinBorders.left,
            right: thinBorders.right,
          };
        }
      }
      if (isTotalRow) {
        row.getCell(1).font = { bold: true };
        row.getCell(2).font = { bold: true };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payroll_${payroll.name}_${monthName}_${payroll.year}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
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
