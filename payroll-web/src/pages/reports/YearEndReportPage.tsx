import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { FileSpreadsheet, Download } from "lucide-react";
import * as XLSX from "xlsx";
import type {
  Payroll,
  PayrollEmployeeBenefit,
  PayrollEmployeeEarning,
  PayrollEmployee,
} from "../../types";

interface YearEndSummary {
  employeeName: string;
  nameId: string;
  totalGrossPay: number;
  totalNetPay: number;
  totalBasicSalary: number;
  totalEarnings: number;
  totalBenefits: number;
  totalDeductions: number;
  total13thMonth: number;
  payrollRuns: number;
}

interface YearEndTotals {
  totalGrossPay: number;
  totalNetPay: number;
  totalBasicSalary: number;
  totalEarnings: number;
  totalBenefits: number;
  totalDeductions: number;
  total13thMonth: number;
  totalEmployees: number;
  totalPayrollRuns: number;
}

export function YearEndReportPage() {
  const { currentCompanyId } = useAuth();
  const { canView } = usePermissions();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summaries, setSummaries] = useState<YearEndSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (currentCompanyId) {
      setHasGenerated(false);
      setSummaries([]);
    }
  }, [currentCompanyId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const generateReport = async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setHasGenerated(true);

    try {
      const payrollSnap = await getDocs(
        query(
          collection(db, "payroll"),
          where("companyId", "==", currentCompanyId),
          where("year", "==", selectedYear),
        ),
      );
      const payrolls = payrollSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Payroll[];

      if (payrolls.length === 0) {
        setSummaries([]);
        return;
      }

      const employeeMap = new Map<string, YearEndSummary>();

      for (const payroll of payrolls) {
        const empSnap = await getDocs(
          query(
            collection(db, "payroll_employees"),
            where("payrollId", "==", payroll.id),
          ),
        );
        const payrollEmployees = empSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PayrollEmployee[];

        for (const emp of payrollEmployees) {
          const key = emp.nameId;
          if (!employeeMap.has(key)) {
            employeeMap.set(key, {
              employeeName: emp.nameId,
              nameId: emp.nameId,
              totalGrossPay: 0,
              totalNetPay: 0,
              totalBasicSalary: 0,
              totalEarnings: 0,
              totalBenefits: 0,
              totalDeductions: 0,
              total13thMonth: 0,
              payrollRuns: 0,
            });
          }

          const summary = employeeMap.get(key)!;
          summary.totalGrossPay += emp.grossPay || 0;
          summary.totalNetPay += emp.netPay || 0;
          summary.totalBasicSalary += emp.basicSalary || 0;
          summary.payrollRuns++;

          const earningSnap = await getDocs(
            query(
              collection(db, "payroll_employee_earnings"),
              where("payrollId", "==", payroll.id),
              where("nameId", "==", emp.nameId),
            ),
          );
          earningSnap.docs.forEach((d) => {
            const data = d.data() as PayrollEmployeeEarning;
            summary.totalEarnings += data.amount || 0;
          });

          const benefitSnap = await getDocs(
            query(
              collection(db, "payroll_employee_benefits"),
              where("payrollId", "==", payroll.id),
              where("nameId", "==", emp.nameId),
            ),
          );
          benefitSnap.docs.forEach((d) => {
            const data = d.data() as PayrollEmployeeBenefit;
            summary.totalBenefits +=
              (data.employeeShare || 0) + (data.employerShare || 0);
          });
        }
      }

      const result = Array.from(employeeMap.values());
      result.sort((a, b) => b.totalGrossPay - a.totalGrossPay);
      setSummaries(result);
    } finally {
      setLoading(false);
    }
  };

  const totals: YearEndTotals = useMemo(
    () => ({
      totalGrossPay: summaries.reduce((sum, s) => sum + s.totalGrossPay, 0),
      totalNetPay: summaries.reduce((sum, s) => sum + s.totalNetPay, 0),
      totalBasicSalary: summaries.reduce(
        (sum, s) => sum + s.totalBasicSalary,
        0,
      ),
      totalEarnings: summaries.reduce((sum, s) => sum + s.totalEarnings, 0),
      totalBenefits: summaries.reduce((sum, s) => sum + s.totalBenefits, 0),
      totalDeductions: summaries.reduce(
        (sum, s) =>
          sum +
          (s.totalGrossPay - s.totalNetPay - s.totalEarnings - s.totalBenefits),
        0,
      ),
      total13thMonth: summaries.reduce((sum, s) => sum + s.total13thMonth, 0),
      totalEmployees: summaries.length,
      totalPayrollRuns: summaries.reduce(
        (sum, s) => Math.max(sum, s.payrollRuns),
        0,
      ),
    }),
    [summaries],
  );

  const handleExportXLS = () => {
    const wb = XLSX.utils.book_new();

    const summaryData = summaries.map((s) => ({
      Employee: s.employeeName,
      "Payroll Runs": s.payrollRuns,
      "Basic Salary": s.totalBasicSalary,
      "Total Earnings": s.totalEarnings,
      "Total Benefits": s.totalBenefits,
      "Gross Pay": s.totalGrossPay,
      "Net Pay": s.totalNetPay,
    }));

    summaryData.push({
      Employee: "TOTAL",
      "Payroll Runs": totals.totalPayrollRuns,
      "Basic Salary": totals.totalBasicSalary,
      "Total Earnings": totals.totalEarnings,
      "Total Benefits": totals.totalBenefits,
      "Gross Pay": totals.totalGrossPay,
      "Net Pay": totals.totalNetPay,
    });

    const ws = XLSX.utils.json_to_sheet(summaryData);
    ws["!cols"] = [
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Year End Summary");
    XLSX.writeFile(wb, `Year_End_Report_${selectedYear}.xlsx`);
  };

  const handleExportCSV = () => {
    const headers = [
      "Employee",
      "Payroll Runs",
      "Basic Salary",
      "Total Earnings",
      "Total Benefits",
      "Gross Pay",
      "Net Pay",
    ];
    const rows = summaries.map((s) => [
      s.employeeName,
      s.payrollRuns.toString(),
      s.totalBasicSalary.toFixed(2),
      s.totalEarnings.toFixed(2),
      s.totalBenefits.toFixed(2),
      s.totalGrossPay.toFixed(2),
      s.totalNetPay.toFixed(2),
    ]);

    rows.push([
      "TOTAL",
      totals.totalPayrollRuns.toString(),
      totals.totalBasicSalary.toFixed(2),
      totals.totalEarnings.toFixed(2),
      totals.totalBenefits.toFixed(2),
      totals.totalGrossPay.toFixed(2),
      totals.totalNetPay.toFixed(2),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Year_End_Report_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (!canView("reports", "payroll"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Year-End Report</h1>
        {hasGenerated && summaries.length > 0 && (
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
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
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
            <Button onClick={generateReport} disabled={loading}>
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasGenerated && (
        <>
          {summaries.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">
                  No payroll data found for {selectedYear}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Employees</div>
                    <div className="text-2xl font-bold">
                      {totals.totalEmployees}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">
                      Total Payroll Runs
                    </div>
                    <div className="text-2xl font-bold">
                      {totals.totalPayrollRuns}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Gross Pay</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totals.totalGrossPay)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Net Pay</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totals.totalNetPay)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">
                      Total Basic Salary
                    </div>
                    <div className="text-xl font-semibold">
                      {formatCurrency(totals.totalBasicSalary)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Earnings</div>
                    <div className="text-xl font-semibold text-green-600">
                      {formatCurrency(totals.totalEarnings)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">
                      Total Benefits (EE + ER)
                    </div>
                    <div className="text-xl font-semibold text-blue-600">
                      {formatCurrency(totals.totalBenefits)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Employee Year-End Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Employee
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Runs
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Basic Salary
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Earnings
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Benefits
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Gross Pay
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Net Pay
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {summaries.map((s, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {s.employeeName}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            {s.payrollRuns}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            {formatCurrency(s.totalBasicSalary)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            {formatCurrency(s.totalEarnings)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            {formatCurrency(s.totalBenefits)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-medium">
                            {formatCurrency(s.totalGrossPay)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold">
                            {formatCurrency(s.totalNetPay)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                        <td className="px-6 py-4">Total</td>
                        <td className="px-6 py-4 text-right">
                          {totals.totalPayrollRuns}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(totals.totalBasicSalary)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(totals.totalEarnings)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(totals.totalBenefits)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(totals.totalGrossPay)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(totals.totalNetPay)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
