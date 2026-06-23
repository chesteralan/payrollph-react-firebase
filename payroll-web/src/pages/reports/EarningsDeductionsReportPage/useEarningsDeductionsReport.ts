import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import * as XLSX from "xlsx";
import type {
  Payroll,
  PayrollEmployee,
  PayrollEmployeeBenefit,
  PayrollEmployeeDeduction,
  PayrollEmployeeEarning,
} from "@/types";

import type {
  BenefitSummary,
  DeductionTypeSummary,
  EarningTypeSummary,
  EmployeeBreakdown,
  PayrollOption,
} from "./EarningsDeductionsReportPage.types";

export function useEarningsDeductionsReport() {
  const { currentCompanyId } = useAuth();
  const { canView } = usePermissions();

  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [endMonth, setEndMonth] = useState(new Date().getMonth() + 1);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [payrollOptions, setPayrollOptions] = useState<PayrollOption[]>([]);
  const [selectedPayrolls, setSelectedPayrolls] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [earningSummaries, setEarningSummaries] = useState<
    EarningTypeSummary[]
  >([]);
  const [deductionSummaries, setDeductionSummaries] = useState<
    DeductionTypeSummary[]
  >([]);
  const [benefitSummaries, setBenefitSummaries] = useState<BenefitSummary[]>(
    [],
  );
  const [employeeBreakdowns, setEmployeeBreakdowns] = useState<
    EmployeeBreakdown[]
  >([]);

  const [earningNames, setEarningNames] = useState<Map<string, string>>(
    new Map(),
  );
  const [deductionNames, setDeductionNames] = useState<Map<string, string>>(
    new Map(),
  );
  const [benefitNames, setBenefitNames] = useState<Map<string, string>>(
    new Map(),
  );

  const loadPayrolls = async () => {
    if (!currentCompanyId) return;
    const snap = await getDocs(
      query(
        collection(db, "payroll"),
        where("companyId", "==", currentCompanyId),
      ),
    );
    const payrolls = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Payroll[];
    payrolls.sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1).getTime();
      const dateB = new Date(b.year, b.month - 1).getTime();
      return dateB - dateA;
    });
    setPayrollOptions(
      payrolls.map((p) => ({
        id: p.id,
        name: p.name,
        month: p.month,
        year: p.year,
      })),
    );
  };

  const loadLists = async () => {
    if (!currentCompanyId) return;
    const [earningsSnap, deductionsSnap, benefitsSnap, groupsSnap] =
      await Promise.all([
        getDocs(
          query(
            collection(db, "earnings"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
        getDocs(
          query(
            collection(db, "deductions"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
        getDocs(
          query(
            collection(db, "benefits"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
        getDocs(
          query(
            collection(db, "groups"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
      ]);

    const eNames = new Map<string, string>();
    earningsSnap.docs.forEach((d) => eNames.set(d.id, d.data().name || d.id));
    setEarningNames(eNames);

    const dNames = new Map<string, string>();
    deductionsSnap.docs.forEach((d) => dNames.set(d.id, d.data().name || d.id));
    setDeductionNames(dNames);

    const bNames = new Map<string, string>();
    benefitsSnap.docs.forEach((d) => bNames.set(d.id, d.data().name || d.id));
    setBenefitNames(bNames);

    setGroups(
      groupsSnap.docs.map((d) => ({ id: d.id, name: d.data().name || d.id })),
    );
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (currentCompanyId) {
      loadPayrolls();
      loadLists();
    }
  }, [currentCompanyId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const generateReport = async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setHasGenerated(true);

    try {
      let targetPayrollIds = selectedPayrolls;

      if (targetPayrollIds.length === 0) {
        const snap = await getDocs(
          query(
            collection(db, "payroll"),
            where("companyId", "==", currentCompanyId),
          ),
        );
        const payrolls = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Payroll[];
        targetPayrollIds = payrolls
          .filter((p) => {
            const start = startYear * 12 + startMonth;
            const end = endYear * 12 + endMonth;
            const payrollDate = p.year * 12 + p.month;
            return payrollDate >= start && payrollDate <= end;
          })
          .map((p) => p.id);
      }

      if (targetPayrollIds.length === 0) {
        setEarningSummaries([]);
        setDeductionSummaries([]);
        setBenefitSummaries([]);
        setEmployeeBreakdowns([]);
        setLoading(false);
        return;
      }

      const [empSnap, earnSnap, dedSnap, benSnap, employeesSnap] =
        await Promise.all([
          getDocs(
            query(
              collection(db, "payroll_employees"),
              where("payrollId", "in", targetPayrollIds),
            ),
          ),
          getDocs(
            query(
              collection(db, "payroll_employee_earnings"),
              where("payrollId", "in", targetPayrollIds),
            ),
          ),
          getDocs(
            query(
              collection(db, "payroll_employee_deductions"),
              where("payrollId", "in", targetPayrollIds),
            ),
          ),
          getDocs(
            query(
              collection(db, "payroll_employee_benefits"),
              where("payrollId", "in", targetPayrollIds),
            ),
          ),
          getDocs(
            query(
              collection(db, "employees"),
              where("companyId", "==", currentCompanyId),
            ),
          ),
        ]);

      const employees = new Map<string, Record<string, unknown>>(
        employeesSnap.docs.map((d) => [
          d.data().nameId,
          { id: d.id, ...d.data() },
        ]),
      );
      const payrollEmps = empSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PayrollEmployee[];

      let filteredEmps = payrollEmps;
      if (groupFilter !== "all") {
        filteredEmps = filteredEmps.filter((e) => e.groupId === groupFilter);
      }

      const earnings = earnSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PayrollEmployeeEarning[];
      const deductions = dedSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PayrollEmployeeDeduction[];
      const benefits = benSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PayrollEmployeeBenefit[];

      const earningMap = new Map<string, EarningTypeSummary>();
      const deductionMap = new Map<string, DeductionTypeSummary>();
      const benefitMap = new Map<string, BenefitSummary>();
      const empBreakdownMap = new Map<string, EmployeeBreakdown>();

      for (const emp of filteredEmps) {
        const empData = employees.get(emp.nameId);
        const key = emp.nameId;
        if (!empBreakdownMap.has(key)) {
          empBreakdownMap.set(key, {
            nameId: emp.nameId,
            employeeCode: (empData?.employeeCode as string) || emp.nameId,
            firstName: (empData?.firstName as string) || "",
            lastName: (empData?.lastName as string) || emp.nameId,
            groupName: emp.groupId || "Ungrouped",
            earnings: [],
            deductions: [],
            benefits: [],
            totalEarnings: 0,
            totalDeductions: 0,
            totalBenefits: 0,
          });
        }
      }

      for (const earn of earnings) {
        const emp = filteredEmps.find((e) => e.nameId === earn.nameId);
        if (!emp) continue;

        const name = earningNames.get(earn.earningId) || earn.earningId;
        const amount = earn.amount || 0;

        if (!earningMap.has(earn.earningId)) {
          earningMap.set(earn.earningId, {
            earningId: earn.earningId,
            name,
            totalAmount: 0,
            employeeCount: 0,
          });
        }
        const summary = earningMap.get(earn.earningId)!;
        summary.totalAmount += amount;
        summary.employeeCount = new Set(
          earnings
            .filter((e) => e.earningId === earn.earningId)
            .map((e) => e.nameId),
        ).size;

        const breakdown = empBreakdownMap.get(earn.nameId);
        if (breakdown) {
          breakdown.earnings.push({ name, amount });
          breakdown.totalEarnings += amount;
        }
      }

      for (const ded of deductions) {
        const emp = filteredEmps.find((e) => e.nameId === ded.nameId);
        if (!emp) continue;

        const name = deductionNames.get(ded.deductionId) || ded.deductionId;
        const amount = ded.amount || 0;

        if (!deductionMap.has(ded.deductionId)) {
          deductionMap.set(ded.deductionId, {
            deductionId: ded.deductionId,
            name,
            totalAmount: 0,
            employeeCount: 0,
          });
        }
        const summary = deductionMap.get(ded.deductionId)!;
        summary.totalAmount += amount;
        summary.employeeCount = new Set(
          deductions
            .filter((d) => d.deductionId === ded.deductionId)
            .map((d) => d.nameId),
        ).size;

        const breakdown = empBreakdownMap.get(ded.nameId);
        if (breakdown) {
          breakdown.deductions.push({ name, amount });
          breakdown.totalDeductions += amount;
        }
      }

      for (const ben of benefits) {
        const emp = filteredEmps.find((e) => e.nameId === ben.nameId);
        if (!emp) continue;

        const name = benefitNames.get(ben.benefitId) || ben.benefitId;
        const eeShare = ben.employeeShare || 0;
        const erShare = ben.employerShare || 0;

        if (!benefitMap.has(ben.benefitId)) {
          benefitMap.set(ben.benefitId, {
            benefitId: ben.benefitId,
            name,
            totalEE: 0,
            totalER: 0,
            employeeCount: 0,
          });
        }
        const summary = benefitMap.get(ben.benefitId)!;
        summary.totalEE += eeShare;
        summary.totalER += erShare;
        summary.employeeCount = new Set(
          benefits
            .filter((b) => b.benefitId === ben.benefitId)
            .map((b) => b.nameId),
        ).size;

        const breakdown = empBreakdownMap.get(ben.nameId);
        if (breakdown) {
          breakdown.benefits.push({ name, eeShare, erShare });
          breakdown.totalBenefits += eeShare + erShare;
        }
      }

      setEarningSummaries(
        Array.from(earningMap.values()).sort(
          (a, b) => b.totalAmount - a.totalAmount,
        ),
      );
      setDeductionSummaries(
        Array.from(deductionMap.values()).sort(
          (a, b) => b.totalAmount - a.totalAmount,
        ),
      );
      setBenefitSummaries(
        Array.from(benefitMap.values()).sort(
          (a, b) => b.totalEE + b.totalER - (a.totalEE + a.totalER),
        ),
      );
      setEmployeeBreakdowns(
        Array.from(empBreakdownMap.values()).sort((a, b) =>
          a.lastName.localeCompare(b.lastName),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = useMemo(
    () => earningSummaries.reduce((sum, e) => sum + e.totalAmount, 0),
    [earningSummaries],
  );
  const totalDeductions = useMemo(
    () => deductionSummaries.reduce((sum, d) => sum + d.totalAmount, 0),
    [deductionSummaries],
  );
  const totalBenefitsEE = useMemo(
    () => benefitSummaries.reduce((sum, b) => sum + b.totalEE, 0),
    [benefitSummaries],
  );
  const totalBenefitsER = useMemo(
    () => benefitSummaries.reduce((sum, b) => sum + b.totalER, 0),
    [benefitSummaries],
  );

  const handleExportXLS = () => {
    const wb = XLSX.utils.book_new();

    const summaryData = [
      { Type: "EARNINGS", Name: "", "Total Amount": "", "Employee Count": "" },
      ...earningSummaries.map((e) => ({
        Type: "",
        Name: e.name,
        "Total Amount": e.totalAmount,
        "Employee Count": e.employeeCount,
      })),
      {
        Type: "TOTAL EARNINGS",
        Name: "",
        "Total Amount": totalEarnings,
        "Employee Count": "",
      },
      { Type: "", Name: "", "Total Amount": "", "Employee Count": "" },
      {
        Type: "DEDUCTIONS",
        Name: "",
        "Total Amount": "",
        "Employee Count": "",
      },
      ...deductionSummaries.map((d) => ({
        Type: "",
        Name: d.name,
        "Total Amount": d.totalAmount,
        "Employee Count": d.employeeCount,
      })),
      {
        Type: "TOTAL DEDUCTIONS",
        Name: "",
        "Total Amount": totalDeductions,
        "Employee Count": "",
      },
      { Type: "", Name: "", "Total Amount": "", "Employee Count": "" },
      { Type: "BENEFITS", Name: "", "Total Amount": "", "Employee Count": "" },
      ...benefitSummaries.map((b) => ({
        Type: "",
        Name: b.name,
        "Total Amount": b.totalEE + b.totalER,
        "Employee Count": b.employeeCount,
      })),
      {
        Type: "TOTAL BENEFITS",
        Name: "",
        "Total Amount": totalBenefitsEE + totalBenefitsER,
        "Employee Count": "",
      },
    ];

    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    ws1["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    const detailData = employeeBreakdowns.map((emp) => ({
      "Employee Code": emp.employeeCode,
      Name: `${emp.firstName} ${emp.lastName}`,
      Group: emp.groupName,
      "Total Earnings": emp.totalEarnings,
      "Total Deductions": emp.totalDeductions,
      "Total Benefits": emp.totalBenefits,
    }));

    const ws2 = XLSX.utils.json_to_sheet(detailData);
    ws2["!cols"] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "Employee Details");

    XLSX.writeFile(
      wb,
      `Earnings_Deductions_Report_${startYear}_${endYear}.xlsx`,
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "Employee Code",
      "Name",
      "Group",
      "Total Earnings",
      "Total Deductions",
      "Total Benefits",
    ];
    const rows = employeeBreakdowns.map((emp) => [
      emp.employeeCode,
      `${emp.firstName} ${emp.lastName}`,
      emp.groupName,
      emp.totalEarnings.toFixed(2),
      emp.totalDeductions.toFixed(2),
      emp.totalBenefits.toFixed(2),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Earnings_Deductions_Report_${startYear}_${endYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));

  return {
    // State
    startMonth, setStartMonth,
    startYear, setStartYear,
    endMonth, setEndMonth,
    endYear, setEndYear,
    payrollOptions,
    selectedPayrolls, setSelectedPayrolls,
    groupFilter, setGroupFilter,
    groups,
    loading,
    hasGenerated,
    earningSummaries,
    deductionSummaries,
    benefitSummaries,
    employeeBreakdowns,
    // Computed
    totalEarnings,
    totalDeductions,
    totalBenefitsEE,
    totalBenefitsER,
    formatCurrency,
    months,
    // Actions
    generateReport,
    handleExportXLS,
    handleExportCSV,
    canView,
  };
}
