import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Columns, Filter } from "lucide-react";

import type { CompanyInfo, ProcessingRow } from "./PayrollOutputView.types";
import { formatCurrency, PrintFooter, PrintHeader } from "./shared";

interface RegisterModeProps {
  rows: ProcessingRow[];
  filteredRows: ProcessingRow[];
  earningData: Map<string, Map<string, number>>;
  deductionData: Map<string, Map<string, number>>;
  benefitData: Map<
    string,
    Map<string, { employeeShare: number; employerShare: number }>
  >;
  visibleColumns: Record<string, boolean>;
  setVisibleColumns: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  showColumns: boolean;
  setShowColumns: React.Dispatch<React.SetStateAction<boolean>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  filterGroup: string;
  setFilterGroup: React.Dispatch<React.SetStateAction<string>>;
  filterPosition: string;
  setFilterPosition: React.Dispatch<React.SetStateAction<string>>;
  filterArea: string;
  setFilterArea: React.Dispatch<React.SetStateAction<string>>;
  groups: string[];
  positions: string[];
  areas: string[];
  hasActiveFilters: boolean;
  activeFilterCount: number;
  totals: {
    totalBasic: number;
    totalEarnings: number;
    totalGross: number;
    totalDeductions: number;
    totalBenefitsEE: number;
    totalBenefitsER: number;
    totalNet: number;
  };
  company?: CompanyInfo;
  payroll: { name: string; month: number; year: number };
  monthName: string;
}

export function PayrollRegisterMode({
  rows,
  filteredRows,
  earningData,
  deductionData,
  benefitData,
  visibleColumns,
  setVisibleColumns,
  showColumns,
  setShowColumns,
  showFilters,
  setShowFilters,
  filterGroup,
  setFilterGroup,
  filterPosition,
  setFilterPosition,
  filterArea,
  setFilterArea,
  groups,
  positions,
  areas,
  hasActiveFilters,
  activeFilterCount,
  totals,
  company,
  payroll,
  monthName,
}: RegisterModeProps) {
  return (
    <>
      <div className="flex gap-2">
        <div className="relative">
          <Button
            variant={hasActiveFilters ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-white/20 px-1.5 rounded-full text-xs">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {showFilters && (
            <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-4 z-10 w-72">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Group
                  </label>
                  <select
                    className="w-full mt-1 px-2 py-1.5 border rounded text-sm"
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                  >
                    <option value="">All Groups</option>
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Position
                  </label>
                  <select
                    className="w-full mt-1 px-2 py-1.5 border rounded text-sm"
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                  >
                    <option value="">All Positions</option>
                    {positions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Area
                  </label>
                  <select
                    className="w-full mt-1 px-2 py-1.5 border rounded text-sm"
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                  >
                    <option value="">All Areas</option>
                    {areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setFilterGroup("");
                      setFilterPosition("");
                      setFilterArea("");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowColumns(!showColumns)}
          >
            <Columns className="w-4 h-4 mr-2" />
            Columns
          </Button>
          {showColumns && (
            <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-4 z-10 w-64">
              <div className="space-y-2">
                {Object.entries({
                  basic: "Basic Salary",
                  earnings: "Earnings",
                  gross: "Gross Pay",
                  deductions: "Deductions",
                  benefits: "Benefits (EE)",
                  net: "Net Pay",
                  daysWorked: "Days Worked",
                  absences: "Absences",
                  late: "Late Hours",
                  overtime: "Overtime Hours",
                }).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(visibleColumns as Record<string, boolean>)[key]}
                      onChange={() =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof prev],
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        {hasActiveFilters && (
          <span className="text-sm text-gray-500 self-center">
            Showing {filteredRows.length} of {rows.length} employees
          </span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Register</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <PrintHeader
            company={company}
            payroll={payroll}
            monthName={monthName}
          />
          <table className="w-full print:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                  Employee
                </th>
                {visibleColumns.daysWorked && (
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Days
                  </th>
                )}
                {visibleColumns.absences && (
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Absences
                  </th>
                )}
                {visibleColumns.late && (
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Late
                  </th>
                )}
                {visibleColumns.overtime && (
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    OT
                  </th>
                )}
                {visibleColumns.basic && (
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Basic
                  </th>
                )}
                {visibleColumns.earnings && (
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Earnings
                  </th>
                )}
                {visibleColumns.gross && (
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Gross
                  </th>
                )}
                {visibleColumns.deductions && (
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Deductions
                  </th>
                )}
                {visibleColumns.benefits && (
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Benefits (EE)
                  </th>
                )}
                {visibleColumns.net && (
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Net Pay
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row) => {
                const earnings = Array.from(
                  earningData.get(row.nameId)?.values() || [],
                ).reduce((s, v) => s + v, 0);
                const deductions = Array.from(
                  deductionData.get(row.nameId)?.values() || [],
                ).reduce((s, v) => s + v, 0);
                const benefits = Array.from(
                  benefitData.get(row.nameId)?.values() || [],
                ).reduce((s, v) => s + v.employeeShare, 0);
                const gross = row.salaryAmount + earnings;
                const net = gross - deductions - benefits;
                return (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 sticky left-0 bg-white">
                      <div className="text-sm font-medium text-gray-900">
                        {row.employeeCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.lastName}
                        {row.firstName ? `, ${row.firstName}` : ""}
                      </div>
                    </td>
                    {visibleColumns.daysWorked && (
                      <td className="px-4 py-2 text-center text-sm">
                        {row.daysWorked}
                      </td>
                    )}
                    {visibleColumns.absences && (
                      <td className="px-4 py-2 text-center text-sm">
                        {row.absences}
                      </td>
                    )}
                    {visibleColumns.late && (
                      <td className="px-4 py-2 text-center text-sm">
                        {row.lateHours}
                      </td>
                    )}
                    {visibleColumns.overtime && (
                      <td className="px-4 py-2 text-center text-sm">
                        {row.overtimeHours}
                      </td>
                    )}
                    {visibleColumns.basic && (
                      <td className="px-4 py-2 text-right text-sm">
                        {formatCurrency(row.salaryAmount)}
                      </td>
                    )}
                    {visibleColumns.earnings && (
                      <td className="px-4 py-2 text-right text-sm text-green-600">
                        {formatCurrency(earnings)}
                      </td>
                    )}
                    {visibleColumns.gross && (
                      <td className="px-4 py-2 text-right text-sm font-medium">
                        {formatCurrency(gross)}
                      </td>
                    )}
                    {visibleColumns.deductions && (
                      <td className="px-4 py-2 text-right text-sm text-red-600">
                        {formatCurrency(deductions)}
                      </td>
                    )}
                    {visibleColumns.benefits && (
                      <td className="px-4 py-2 text-right text-sm">
                        {formatCurrency(benefits)}
                      </td>
                    )}
                    {visibleColumns.net && (
                      <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                        {formatCurrency(net)}
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredRows.length > 0 && (
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                  <td className="px-4 py-2 sticky left-0 bg-gray-50 text-sm">
                    Total ({filteredRows.length} employees)
                  </td>
                  {visibleColumns.daysWorked && (
                    <td className="px-4 py-2 text-center text-sm">
                      {filteredRows.reduce((s, r) => s + r.daysWorked, 0)}
                    </td>
                  )}
                  {visibleColumns.absences && (
                    <td className="px-4 py-2 text-center text-sm">
                      {filteredRows.reduce((s, r) => s + r.absences, 0)}
                    </td>
                  )}
                  {visibleColumns.late && (
                    <td className="px-4 py-2 text-center text-sm">
                      {filteredRows.reduce((s, r) => s + r.lateHours, 0)}
                    </td>
                  )}
                  {visibleColumns.overtime && (
                    <td className="px-4 py-2 text-center text-sm">
                      {filteredRows.reduce((s, r) => s + r.overtimeHours, 0)}
                    </td>
                  )}
                  {visibleColumns.basic && (
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(totals.totalBasic)}
                    </td>
                  )}
                  {visibleColumns.earnings && (
                    <td className="px-4 py-2 text-right text-sm text-green-600">
                      {formatCurrency(totals.totalEarnings)}
                    </td>
                  )}
                  {visibleColumns.gross && (
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(totals.totalGross)}
                    </td>
                  )}
                  {visibleColumns.deductions && (
                    <td className="px-4 py-2 text-right text-sm text-red-600">
                      {formatCurrency(totals.totalDeductions)}
                    </td>
                  )}
                  {visibleColumns.benefits && (
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(totals.totalBenefitsEE)}
                    </td>
                  )}
                  {visibleColumns.net && (
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(totals.totalNet)}
                    </td>
                  )}
                </tr>
              )}
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No employees match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PrintFooter company={company} />
        </CardContent>
      </Card>
    </>
  );
}
