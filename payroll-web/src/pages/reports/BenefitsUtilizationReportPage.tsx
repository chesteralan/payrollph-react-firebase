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
  BenefitItem,
  PayrollEmployee,
  EmployeeGroup,
} from "../../types";

import type { BenefitSummary, BenefitEmployeeDetail } from "./BenefitsUtilizationReportPage.types";

export function BenefitsUtilizationReportPage() {
  const { currentCompanyId } = useAuth();
  const { canView } = usePermissions();
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [benefits, setBenefits] = useState<BenefitSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [expandedBenefitId, setExpandedBenefitId] = useState<string | null>(
    null,
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (currentCompanyId) {
      setHasGenerated(false);
      setBenefits([]);
    }
  }, [currentCompanyId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const generateReport = async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setHasGenerated(true);
    setExpandedBenefitId(null);

    try {
      let q = query(
        collection(db, "payroll"),
        where("companyId", "==", currentCompanyId),
      );

      if (selectedMonth > 0) {
        q = query(q, where("month", "==", selectedMonth));
      }
      q = query(q, where("year", "==", selectedYear));

      const payrollSnap = await getDocs(q);
      const payrolls = payrollSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Payroll[];

      if (payrolls.length === 0) {
        setBenefits([]);
        return;
      }

      const benefitSnap = await getDocs(collection(db, "benefits"));
      const benefitMap = new Map<string, BenefitItem>();
      benefitSnap.docs.forEach((d) => {
        const data = { id: d.id, ...d.data() } as BenefitItem;
        benefitMap.set(data.id, data);
      });

      const groupSnap = await getDocs(
        query(
          collection(db, "groups"),
          where("companyId", "==", currentCompanyId),
        ),
      );
      const groupMap = new Map<string, EmployeeGroup>();
      groupSnap.docs.forEach((d) => {
        const data = { id: d.id, ...d.data() } as EmployeeGroup;
        groupMap.set(data.id, data);
      });

      const benefitSummaryMap = new Map<string, BenefitSummary>();
      const allBenefitEntries: PayrollEmployeeBenefit[] = [];

      for (const payroll of payrolls) {
        const empBenefitSnap = await getDocs(
          query(
            collection(db, "payroll_employee_benefits"),
            where("payrollId", "==", payroll.id),
          ),
        );
        const empBenefits = empBenefitSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PayrollEmployeeBenefit[];
        allBenefitEntries.push(...empBenefits);

        const empSnap = await getDocs(
          query(
            collection(db, "payroll_employees"),
            where("payrollId", "==", payroll.id),
          ),
        );
        const payrollEmpMap = new Map<string, PayrollEmployee>();
        empSnap.docs.forEach((d) => {
          const data = { id: d.id, ...d.data() } as PayrollEmployee;
          payrollEmpMap.set(data.nameId, data);
        });

        for (const entry of empBenefits) {
          const benefit = benefitMap.get(entry.benefitId);
          const payrollEmp = payrollEmpMap.get(entry.nameId);
          const group = payrollEmp?.groupId
            ? groupMap.get(payrollEmp.groupId)
            : null;
          const period = `${new Date(0, payroll.month - 1).toLocaleString("default", { month: "short" })} ${payroll.year}`;

          const detail: BenefitEmployeeDetail = {
            employeeName: entry.nameId,
            nameId: entry.nameId,
            groupName: group?.name || "Ungrouped",
            employeeShare: entry.employeeShare || 0,
            employerShare: entry.employerShare || 0,
            payrollName: payroll.name,
            period,
          };

          const key = entry.benefitId;
          if (!benefitSummaryMap.has(key)) {
            benefitSummaryMap.set(key, {
              benefitId: key,
              benefitName: benefit?.name || entry.benefitId,
              employeeCount: 0,
              totalEmployeeShare: 0,
              totalEmployerShare: 0,
              totalCost: 0,
              employees: [],
            });
          }

          const summary = benefitSummaryMap.get(key)!;
          summary.employeeCount++;
          summary.totalEmployeeShare += detail.employeeShare;
          summary.totalEmployerShare += detail.employerShare;
          summary.totalCost += detail.employeeShare + detail.employerShare;
          summary.employees.push(detail);
        }
      }

      const result = Array.from(benefitSummaryMap.values());
      result.sort((a, b) => b.totalCost - a.totalCost);
      setBenefits(result);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (benefitId: string) => {
    if (expandedBenefitId === benefitId) {
      setExpandedBenefitId(null);
    } else {
      setExpandedBenefitId(benefitId);
    }
  };

  const totalEE = useMemo(
    () => benefits.reduce((sum, b) => sum + b.totalEmployeeShare, 0),
    [benefits],
  );
  const totalER = useMemo(
    () => benefits.reduce((sum, b) => sum + b.totalEmployerShare, 0),
    [benefits],
  );
  const totalCost = useMemo(
    () => benefits.reduce((sum, b) => sum + b.totalCost, 0),
    [benefits],
  );
  const totalEmployees = useMemo(
    () => benefits.reduce((sum, b) => sum + b.employeeCount, 0),
    [benefits],
  );

  const handleExportXLS = () => {
    const wb = XLSX.utils.book_new();

    const summaryData = benefits.map((b) => ({
      Benefit: b.benefitName,
      "Employees Covered": b.employeeCount,
      "EE Share": b.totalEmployeeShare,
      "ER Share": b.totalEmployerShare,
      "Total Cost": b.totalCost,
    }));

    summaryData.push({
      Benefit: "TOTAL",
      "Employees Covered": totalEmployees,
      "EE Share": totalEE,
      "ER Share": totalER,
      "Total Cost": totalCost,
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [
      { wch: 30 },
      { wch: 16 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    for (const b of benefits) {
      const detailData = b.employees.map((e) => ({
        Employee: e.employeeName,
        Group: e.groupName,
        Payroll: e.payrollName,
        Period: e.period,
        "EE Share": e.employeeShare,
        "ER Share": e.employerShare,
      }));
      const ws = XLSX.utils.json_to_sheet(detailData);
      ws["!cols"] = [
        { wch: 25 },
        { wch: 20 },
        { wch: 25 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, b.benefitName.slice(0, 31));
    }

    XLSX.writeFile(wb, `Benefits_Utilization_${selectedYear}.xlsx`);
  };

  const handleExportCSV = () => {
    const headers = [
      "Benefit",
      "Employees Covered",
      "EE Share",
      "ER Share",
      "Total Cost",
    ];
    const rows = benefits.map((b) => [
      b.benefitName,
      b.employeeCount.toString(),
      b.totalEmployeeShare.toFixed(2),
      b.totalEmployerShare.toFixed(2),
      b.totalCost.toFixed(2),
    ]);

    rows.push([
      "TOTAL",
      totalEmployees.toString(),
      totalEE.toFixed(2),
      totalER.toFixed(2),
      totalCost.toFixed(2),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Benefits_Utilization_${selectedYear}.csv`;
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

  const months = [
    { value: 0, label: "All Months" },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: new Date(0, i).toLocaleString("default", { month: "long" }),
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Benefits Utilization Report
        </h1>
        {hasGenerated && benefits.length > 0 && (
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
                Month
              </label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
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
          {benefits.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">
                  No benefit data found for the selected filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Benefits</div>
                    <div className="text-2xl font-bold">{benefits.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Entries</div>
                    <div className="text-2xl font-bold">{totalEmployees}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total EE Share</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totalEE)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total ER Share</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totalER)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Benefits Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Benefit
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Employees
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          EE Share
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          ER Share
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                          Total Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {benefits.map((b) => (
                        <>
                          <tr
                            key={b.benefitId}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleExpand(b.benefitId)}
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {b.benefitName}
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              {b.employeeCount}
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              {formatCurrency(b.totalEmployeeShare)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              {formatCurrency(b.totalEmployerShare)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-semibold">
                              {formatCurrency(b.totalCost)}
                            </td>
                          </tr>
                          {expandedBenefitId === b.benefitId && (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                <div className="ml-4">
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                    Employee Breakdown
                                  </h4>
                                  <table className="w-full">
                                    <thead>
                                      <tr className="text-xs text-gray-500 border-b">
                                        <th className="text-left pb-2">
                                          Employee
                                        </th>
                                        <th className="text-left pb-2">
                                          Group
                                        </th>
                                        <th className="text-left pb-2">
                                          Payroll
                                        </th>
                                        <th className="text-left pb-2">
                                          Period
                                        </th>
                                        <th className="text-right pb-2">
                                          EE Share
                                        </th>
                                        <th className="text-right pb-2">
                                          ER Share
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {b.employees.map((e, i) => (
                                        <tr
                                          key={i}
                                          className="border-b border-gray-100"
                                        >
                                          <td className="py-2 text-sm text-gray-700">
                                            {e.employeeName}
                                          </td>
                                          <td className="py-2 text-sm text-gray-500">
                                            {e.groupName}
                                          </td>
                                          <td className="py-2 text-sm text-gray-500">
                                            {e.payrollName}
                                          </td>
                                          <td className="py-2 text-sm text-gray-500">
                                            {e.period}
                                          </td>
                                          <td className="py-2 text-sm text-right">
                                            {formatCurrency(e.employeeShare)}
                                          </td>
                                          <td className="py-2 text-sm text-right">
                                            {formatCurrency(e.employerShare)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                        <td className="px-6 py-4">Total</td>
                        <td className="px-6 py-4 text-right">
                          {totalEmployees}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(totalEE)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(totalER)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(totalCost)}
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
