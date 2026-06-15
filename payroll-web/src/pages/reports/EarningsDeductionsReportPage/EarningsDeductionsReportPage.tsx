import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Download, FileSpreadsheet } from "lucide-react";

import { useEarningsDeductionsReport } from "./useEarningsDeductionsReport";
import { SummaryCards } from "./SummaryCards";
import { EarningsByTypeTable } from "./EarningsByTypeTable";
import { DeductionsByTypeTable } from "./DeductionsByTypeTable";
import { BenefitsSummaryTable } from "./BenefitsSummaryTable";
import { EmployeeBreakdownTable } from "./EmployeeBreakdownTable";

export function EarningsDeductionsReportPage() {
  const {
    startMonth,
    setStartMonth,
    startYear,
    setStartYear,
    endMonth,
    setEndMonth,
    endYear,
    setEndYear,
    payrollOptions,
    selectedPayrolls,
    setSelectedPayrolls,
    groupFilter,
    setGroupFilter,
    groups,
    loading,
    hasGenerated,
    earningSummaries,
    deductionSummaries,
    benefitSummaries,
    employeeBreakdowns,
    totalEarnings,
    totalDeductions,
    totalBenefitsEE,
    totalBenefitsER,
    formatCurrency,
    months,
    generateReport,
    handleExportXLS,
    handleExportCSV,
    canView,
  } = useEarningsDeductionsReport();

  if (!canView("reports", "payroll"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Earnings/Deductions Breakdown Report
        </h1>
        {hasGenerated && employeeBreakdowns.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handleExportXLS}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export XLS
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={startMonth}
                  onChange={(e) => setStartMonth(Number(e.target.value))}
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={startYear}
                  onChange={(e) => setStartYear(Number(e.target.value))}
                >
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - 2 + i,
                  ).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <span className="text-gray-500">to</span>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={endMonth}
                  onChange={(e) => setEndMonth(Number(e.target.value))}
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={endYear}
                  onChange={(e) => setEndYear(Number(e.target.value))}
                >
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - 2 + i,
                  ).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payroll Selection (leave empty for date range)
              </label>
              <select
                multiple
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-32"
                value={selectedPayrolls}
                onChange={(e) =>
                  setSelectedPayrolls(
                    Array.from(e.target.selectedOptions, (opt) => opt.value),
                  )
                }
              >
                {payrollOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Filter
              </label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
              >
                <option value="all">All Groups</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={generateReport} disabled={loading}>
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasGenerated && (
        <>
          {employeeBreakdowns.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">
                  No data found for the selected filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <SummaryCards
                totalEarnings={totalEarnings}
                totalDeductions={totalDeductions}
                totalBenefitsEE={totalBenefitsEE}
                totalBenefitsER={totalBenefitsER}
                formatCurrency={formatCurrency}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings by Type</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <EarningsByTypeTable
                      earningSummaries={earningSummaries}
                      totalEarnings={totalEarnings}
                      formatCurrency={formatCurrency}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Deductions by Type</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <DeductionsByTypeTable
                      deductionSummaries={deductionSummaries}
                      totalDeductions={totalDeductions}
                      formatCurrency={formatCurrency}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Benefits Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <BenefitsSummaryTable
                    benefitSummaries={benefitSummaries}
                    totalBenefitsEE={totalBenefitsEE}
                    totalBenefitsER={totalBenefitsER}
                    formatCurrency={formatCurrency}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Employee Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmployeeBreakdownTable
                    employeeBreakdowns={employeeBreakdowns}
                    totalEarnings={totalEarnings}
                    totalDeductions={totalDeductions}
                    totalBenefitsEE={totalBenefitsEE}
                    totalBenefitsER={totalBenefitsER}
                    formatCurrency={formatCurrency}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
