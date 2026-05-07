import { useState } from "react";
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
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface Employee13thMonth {
  employeeCode: string;
  firstName: string;
  lastName: string;
  hireDate: Date | null;
  totalBasicSalary: number;
  monthsWorked: number;
  thirteenthMonth: number;
}

interface EmployeeDoc {
  id: string;
  employeeCode: string;
  nameId: string;
  firstName?: string;
  lastName?: string;
  hireDate?: Date;
}

interface PayrollDoc {
  id: string;
  month: number;
  year: number;
  employees?: { nameId: string }[];
  totalBasic?: number;
}

export function Report13thMonthPage() {
  const { currentCompanyId } = useAuth();
  const { canView } = usePermissions();
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Employee13thMonth[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateReport = async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setHasGenerated(true);

    try {
      const [employeesSnap, payrollSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "employees"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
        getDocs(
          query(
            collection(db, "payroll"),
            where("companyId", "==", currentCompanyId),
            where("year", "==", year),
          ),
        ),
      ]);

      const employees = employeesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as EmployeeDoc[];
      const payrolls = payrollSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PayrollDoc[];

      const results: Employee13thMonth[] = [];

      for (const emp of employees) {
        const hireDate = emp.hireDate ? new Date(emp.hireDate) : null;

        if (hireDate && hireDate.getFullYear() > year) continue;

        const empPayrolls = payrolls.filter((p) => {
          const payrollEmps = (p.employees || []).filter(
            (e: { nameId: string }) => e.nameId === emp.nameId,
          );
          return payrollEmps.length > 0;
        });

        let totalBasic = 0;
        const monthsWorked = new Set<number>();

        for (const payroll of empPayrolls) {
          const month = payroll.month;
          monthsWorked.add(month);
          totalBasic += payroll.totalBasic || 0;
        }

        const computedMonths =
          hireDate && hireDate.getFullYear() === year
            ? 12 - hireDate.getMonth()
            : monthsWorked.size || 12;

        const thirteenthMonth = totalBasic / 12;

        results.push({
          employeeCode: emp.employeeCode,
          firstName: emp.firstName || "",
          lastName: emp.lastName || emp.nameId,
          hireDate,
          totalBasicSalary: totalBasic,
          monthsWorked: computedMonths,
          thirteenthMonth,
        });
      }

      results.sort((a, b) => a.lastName.localeCompare(b.lastName));
      setResults(results);
    } finally {
      setLoading(false);
    }
  };

  const handleExportXLS = () => {
    const wb = XLSX.utils.book_new();

    const data = results.map((r) => ({
      "Employee Code": r.employeeCode,
      Name: `${r.firstName} ${r.lastName}`,
      "Hire Date": r.hireDate
        ? new Date(r.hireDate).toLocaleDateString()
        : "N/A",
      "Months Worked": r.monthsWorked,
      "Total Basic Salary": r.totalBasicSalary,
      "13th Month Pay": r.thirteenthMonth,
    }));

    const totalRow = {
      "Employee Code": "",
      Name: "TOTAL",
      "Hire Date": "",
      "Months Worked": 0,
      "Total Basic Salary": results.reduce((s, r) => s + r.totalBasicSalary, 0),
      "13th Month Pay": results.reduce((s, r) => s + r.thirteenthMonth, 0),
    };
    data.push(totalRow);

    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "13th Month Report");
    XLSX.writeFile(wb, `13th_Month_Report_${year}.xlsx`);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (!canView("reports", "13month"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">13th Month Report</h1>
        {hasGenerated && results.length > 0 && (
          <Button variant="secondary" onClick={handleExportXLS}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export XLS
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
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
          {results.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">
                  No data found for the selected year.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Employees</div>
                    <div className="text-2xl font-bold">{results.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">
                      Total Basic Salary
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        results.reduce((s, r) => s + r.totalBasicSalary, 0),
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">
                      Total 13th Month Pay
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        results.reduce((s, r) => s + r.thirteenthMonth, 0),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>13th Month Pay Details</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Employee Code
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Hire Date
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Months Worked
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Total Basic
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          13th Month Pay
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.map((r, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {r.employeeCode}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {r.firstName} {r.lastName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {r.hireDate
                              ? new Date(r.hireDate).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            {r.monthsWorked}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            {formatCurrency(r.totalBasicSalary)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-semibold">
                            {formatCurrency(r.thirteenthMonth)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                        <td className="px-6 py-4" colSpan={3}>
                          Total
                        </td>
                        <td className="px-6 py-4 text-right"></td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(
                            results.reduce((s, r) => s + r.totalBasicSalary, 0),
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(
                            results.reduce((s, r) => s + r.thirteenthMonth, 0),
                          )}
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
