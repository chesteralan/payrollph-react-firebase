import { Card, CardContent } from "@/components/ui/Card";
import type { EmployeeReportData } from "./EmployeeReportPage.types";
import { formatCurrency } from "./useEmployeeReport";

interface EmployeeReportSummaryCardsProps {
  employees: EmployeeReportData[];
}

export function EmployeeReportSummaryCards({
  employees,
}: EmployeeReportSummaryCardsProps) {
  if (employees.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-500">Total Employees</div>
          <div className="text-2xl font-bold">{employees.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-500">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {employees.filter((e) => e.isActive).length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-500">Inactive</div>
          <div className="text-2xl font-bold text-gray-600">
            {employees.filter((e) => !e.isActive).length}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-gray-500">Total Salary</div>
          <div className="text-2xl font-bold">
            {formatCurrency(
              employees.reduce((s, e) => s + (e.salary || 0), 0),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
