import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useEmployeeReport } from "./useEmployeeReport";
import { EmployeeReportFilters } from "./EmployeeReportFilters";
import { EmployeeReportSummaryCards } from "./EmployeeReportSummaryCards";
import { EmployeeReportTable } from "./EmployeeReportTable";

export function EmployeeReportPage() {
  const {
    canView,
    loading,
    employees,
    groups,
    positions,
    areas,
    hasGenerated,
    filters,
    setFilters,
    expandedRows,
    generateReport,
    toggleRow,
    handleExportXLS,
    handleExportCSV,
    handlePrint,
  } = useEmployeeReport();

  if (!canView("reports", "employees"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">
          Employee Master List Report
        </h1>
        {hasGenerated && employees.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportXLS}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export XLS
            </Button>
            <Button variant="secondary" onClick={handleExportCSV}>
              <FileText className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        )}
      </div>

      <EmployeeReportFilters
        filters={filters}
        loading={loading}
        groups={groups}
        positions={positions}
        areas={areas}
        onFilterChange={setFilters}
        onGenerate={generateReport}
      />

      {hasGenerated && (
        <>
          {employees.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">
                  No employees found with the selected filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <EmployeeReportSummaryCards employees={employees} />
              <EmployeeReportTable
                employees={employees}
                expandedRows={expandedRows}
                onToggleRow={toggleRow}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
