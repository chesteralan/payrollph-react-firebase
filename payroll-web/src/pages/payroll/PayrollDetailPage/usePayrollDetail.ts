import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/utils/currency";
import { calculateWorkingDaysSync } from "@/utils/calendarUtils";
import type {
  Payroll,
  PayrollEmployee,
  PayrollValidationError,
  Term,
} from "@/types";
import type { CalendarEntry } from "@/types/system";
import type { ProcessingRow } from "../PayrollDetailPage.types";

const STAGES = [
  "dtr",
  "salaries",
  "earnings",
  "benefits",
  "deductions",
  "summary",
  "output",
];

export function usePayrollDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [activeStage, setActiveStage] = useState("dtr");
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [rows, setRows] = useState<ProcessingRow[]>([]);
  const [earningsList, setEarningsList] = useState<
    { id: string; name: string }[]
  >([]);
  const [deductionsList, setDeductionsList] = useState<
    { id: string; name: string }[]
  >([]);
  const [benefitsList, setBenefitsList] = useState<
    { id: string; name: string }[]
  >([]);
  const [earningData, setEarningData] = useState<
    Map<string, Map<string, number>>
  >(new Map());
  const [deductionData, setDeductionData] = useState<
    Map<string, Map<string, number>>
  >(new Map());
  const [benefitData, setBenefitData] = useState<
    Map<string, Map<string, { employeeShare: number; employerShare: number }>>
  >(new Map());
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    PayrollValidationError[]
  >([]);
  const [defaultWorkdays, setDefaultWorkdays] = useState(22);
  const [actualWorkdays, setActualWorkdays] = useState<number | null>(null);
  const [company, setCompany] = useState<{
    name: string;
    address?: string;
    tin?: string;
    printHeader?: string;
    printFooter?: string;
  } | null>(null);
  const [term, setTerm] = useState<Term | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const loadPayroll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [
        payrollSnap,
        empSnap,
        earningsSnap,
        deductionsSnap,
        benefitsSnap,
        inclusiveDatesSnap,
      ] = await Promise.all([
        getDoc(doc(db, "payroll", id)),
        getDocs(
          query(
            collection(db, "payroll_employees"),
            where("payrollId", "==", id),
          ),
        ),
        getDocs(query(collection(db, "earnings"))),
        getDocs(query(collection(db, "deductions"))),
        getDocs(query(collection(db, "benefits"))),
        getDocs(
          query(
            collection(db, "payroll_inclusive_dates"),
            where("payrollId", "==", id),
          ),
        ),
      ]);

      const calendarSnap = payrollSnap.exists()
        ? await getDocs(
            query(
              collection(db, "calendar"),
              where(
                "companyId",
                "==",
                (payrollSnap.data() as Record<string, unknown>)?.companyId ||
                  "global",
              ),
            ),
          )
        : await getDocs(
            query(
              collection(db, "calendar"),
              where("companyId", "==", "global"),
            ),
          );

      if (payrollSnap.exists()) {
        const payrollData = {
          id: payrollSnap.id,
          ...payrollSnap.data(),
        } as Payroll;
        setPayroll(payrollData);

        if (payrollData.termId) {
          const termSnap = await getDoc(
            doc(db, "payroll_terms", payrollData.termId),
          );
          if (termSnap.exists()) {
            setTerm({ id: termSnap.id, ...termSnap.data() } as Term);
          }
        }

        const companySnap = await getDoc(
          doc(db, "companies", payrollData.companyId),
        );
        if (companySnap.exists()) {
          const companyData = companySnap.data() as {
            defaultWorkdays?: number;
            name?: string;
            address?: string;
            tin?: string;
            printHeader?: string;
            printFooter?: string;
          };
          setDefaultWorkdays(companyData.defaultWorkdays || 22);
          setCompany({
            name: companyData.name || "",
            address: companyData.address,
            tin: companyData.tin,
            printHeader: companyData.printHeader,
            printFooter: companyData.printFooter,
          });
        }

        const inclusiveDateData = inclusiveDatesSnap.docs
          .map((d) => d.data() as { startDate?: string; endDate?: string })
          .find(Boolean);
        const sd = inclusiveDateData?.startDate || null;
        const ed = inclusiveDateData?.endDate || null;
        if (sd && ed) {
          const calendarEntries = calendarSnap.docs.map(
            (d) =>
              ({
                id: d.id,
                ...d.data(),
              }) as CalendarEntry & { isPaid?: boolean },
          );
          const workDaysResult = calculateWorkingDaysSync(
            sd,
            ed,
            calendarEntries,
          );
          setActualWorkdays(workDaysResult.totalWorkingDays);
        }
      }

      const payEmps = empSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as PayrollEmployee[];
      setEmployees(payEmps);

      const dateRange = inclusiveDatesSnap.docs
        .map((d) => d.data() as { startDate?: string; endDate?: string })
        .find(Boolean);
      const sd = dateRange?.startDate || null;
      const ed = dateRange?.endDate || null;
      setStartDate(sd);
      setEndDate(ed);

      const dtrData = new Map<
        string,
        {
          daysWorked: number;
          absences: number;
          lateHours: number;
          overtimeHours: number;
        }
      >();
      if (sd && ed && payEmps.length > 0) {
        const dtrSnap = await getDocs(
          query(
            collection(db, "dtr_entries"),
            where(
              "employeeId",
              "in",
              payEmps.map((e) => e.nameId).slice(0, 10),
            ),
          ),
        );
        const filteredEntries = dtrSnap.docs
          .map(
            (d) =>
              d.data() as {
                employeeId?: string;
                date?: string;
                hoursWorked?: number;
                overtimeHours?: number;
                lateHours?: number;
                absenceType?: string;
              },
          )
          .filter((e) => e.date && e.date >= sd && e.date <= ed);
        for (const entry of filteredEntries) {
          const empKey = entry.employeeId || "";
          if (!dtrData.has(empKey))
            dtrData.set(empKey, {
              daysWorked: 0,
              absences: 0,
              lateHours: 0,
              overtimeHours: 0,
            });
          const current = dtrData.get(empKey)!;
          if ((entry.hoursWorked || 0) > 0) current.daysWorked++;
          if (entry.absenceType) current.absences++;
          current.lateHours += entry.lateHours || 0;
          current.overtimeHours += entry.overtimeHours || 0;
        }
      }

      setEarningsList(
        earningsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as { name: string }),
        })),
      );
      setDeductionsList(
        deductionsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as { name: string }),
        })),
      );
      setBenefitsList(
        benefitsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as { name: string }),
        })),
      );

      const rowsData: ProcessingRow[] = [];
      const effectiveWorkdays = actualWorkdays ?? defaultWorkdays;
      for (const emp of payEmps) {
        const basicSalary = emp.basicSalary || 0;
        const ratePerDay = basicSalary / effectiveWorkdays;
        const empDtr = dtrData.get(emp.nameId || "");
        const daysWorked = empDtr?.daysWorked ?? emp.daysWorked ?? 0;
        const absences = empDtr?.absences ?? emp.absences ?? 0;
        const lateHours = empDtr?.lateHours
          ? Math.round(empDtr.lateHours * 100) / 100
          : (emp.lateHours ?? 0);
        const overtimeHours = empDtr?.overtimeHours
          ? Math.round(empDtr.overtimeHours * 100) / 100
          : (emp.overtimeHours ?? 0);
        const salaryAmount = ratePerDay * daysWorked;

        rowsData.push({
          nameId: emp.nameId,
          employeeCode: emp.nameId.substring(0, 6),
          firstName: "",
          lastName: emp.nameId,
          groupId: emp.groupId || "",
          positionId: emp.positionId || "",
          areaId: emp.areaId || "",
          daysWorked,
          absences,
          lateHours,
          overtimeHours,
          basicSalary,
          ratePerDay,
          salaryAmount,
        });
      }
      setRows(rowsData);

      const earningDataMap = new Map<string, Map<string, number>>();
      const deductionDataMap = new Map<string, Map<string, number>>();
      const benefitDataMap = new Map<
        string,
        Map<string, { employeeShare: number; employerShare: number }>
      >();
      for (const emp of payEmps) {
        earningDataMap.set(emp.nameId, new Map());
        deductionDataMap.set(emp.nameId, new Map());
        benefitDataMap.set(emp.nameId, new Map());
      }
      setEarningData(earningDataMap);
      setDeductionData(deductionDataMap);
      setBenefitData(benefitDataMap);
    } finally {
      setLoading(false);
    }
  }, [id, actualWorkdays, defaultWorkdays]);

  useEffect(() => {
    if (id) loadPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const recalculateSalaries = useCallback(
    (updatedRows: ProcessingRow[], workdays: number) => {
      return updatedRows.map((row) => {
        const effectiveWorkdays = actualWorkdays ?? workdays;
        const ratePerDay = row.basicSalary / effectiveWorkdays;
        const salaryAmount = ratePerDay * row.daysWorked;
        return { ...row, ratePerDay, salaryAmount };
      });
    },
    [actualWorkdays],
  );

  const toggleLock = async () => {
    if (!payroll || !id) return;
    const newLocked = !payroll.isLocked;
    await updateDoc(doc(db, "payroll", id), { isLocked: newLocked });
    setPayroll({ ...payroll, isLocked: newLocked });
    addToast({
      type: "info",
      title: newLocked ? "Payroll locked" : "Payroll unlocked",
      message: payroll.name,
    });
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

  const getEarningTotal = useCallback(
    (earningId: string) => {
      let total = 0;
      earningData.forEach((empEarnings) => {
        total += empEarnings.get(earningId) || 0;
      });
      return total;
    },
    [earningData],
  );

  const getDeductionTotal = useCallback(
    (deductionId: string) => {
      let total = 0;
      deductionData.forEach((empDeductions) => {
        total += empDeductions.get(deductionId) || 0;
      });
      return total;
    },
    [deductionData],
  );

  const validatePayroll = useCallback((): PayrollValidationError[] => {
    const errors: PayrollValidationError[] = [];

    if (rows.length === 0) {
      errors.push({
        field: "employees",
        message: "No employees in this payroll",
        severity: "error",
      });
      return errors;
    }

    for (const row of rows) {
      if (row.daysWorked === 0 && row.absences === 0) {
        errors.push({
          field: "dtr",
          nameId: row.nameId,
          employeeName: row.lastName,
          message: "No DTR data entered",
          severity: "warning",
        });
      }

      if (row.basicSalary <= 0) {
        errors.push({
          field: "salary",
          nameId: row.nameId,
          employeeName: row.lastName,
          message: "Basic salary is not set",
          severity: "error",
        });
      }

      if (
        row.daysWorked < 0 ||
        row.absences < 0 ||
        row.lateHours < 0 ||
        row.overtimeHours < 0
      ) {
        errors.push({
          field: "dtr",
          nameId: row.nameId,
          employeeName: row.lastName,
          message: "Negative values detected in DTR",
          severity: "error",
        });
      }

      const empEarnings = earningData.get(row.nameId);
      if (empEarnings) {
        empEarnings.forEach((amount, earningId) => {
          if (amount < 0) {
            const earning = earningsList.find((e) => e.id === earningId);
            errors.push({
              field: "earnings",
              nameId: row.nameId,
              employeeName: row.lastName,
              message: `Negative earning: ${earning?.name || "Unknown"}`,
              severity: "error",
            });
          }
        });
      }

      const empDeductions = deductionData.get(row.nameId);
      if (empDeductions) {
        empDeductions.forEach((amount, deductionId) => {
          if (amount < 0) {
            const deduction = deductionsList.find((d) => d.id === deductionId);
            errors.push({
              field: "deductions",
              nameId: row.nameId,
              employeeName: row.lastName,
              message: `Negative deduction: ${deduction?.name || "Unknown"}`,
              severity: "error",
            });
          }
        });
      }

      const empBenefits = benefitData.get(row.nameId);
      if (empBenefits) {
        empBenefits.forEach(({ employeeShare, employerShare }, benefitId) => {
          if (employeeShare < 0 || employerShare < 0) {
            const benefit = benefitsList.find((b) => b.id === benefitId);
            errors.push({
              field: "benefits",
              nameId: row.nameId,
              employeeName: row.lastName,
              message: `Negative benefit: ${benefit?.name || "Unknown"}`,
              severity: "error",
            });
          }
        });
      }

      const netPay = getEmployeeNet(row);
      if (netPay < 0) {
        errors.push({
          field: "summary",
          nameId: row.nameId,
          employeeName: row.lastName,
          message: `Negative net pay: ${formatCurrency(netPay)}`,
          severity: "error",
        });
      }
    }

    const errorCount = errors.filter((e) => e.severity === "error").length;
    if (errorCount > 0) {
      errors.unshift({
        field: "general",
        message: `${errorCount} error(s) must be resolved before publishing`,
        severity: "error",
      });
    }

    return errors;
  }, [
    rows,
    earningData,
    deductionData,
    benefitData,
    earningsList,
    deductionsList,
    benefitsList,
    getEmployeeNet,
  ]);

  const handlePublish = async () => {
    if (!id || !payroll) return;

    const errors = validatePayroll();
    setValidationErrors(errors);
    setShowValidation(true);

    const hasErrors = errors.some((e) => e.severity === "error");
    if (hasErrors) {
      addToast({
        type: "error",
        title: "Validation failed",
        message: "Please fix all errors before publishing",
      });
      return;
    }

    if (
      !confirm(
        "Publish this payroll? This will finalize all calculations and make it read-only.",
      )
    ) {
      return;
    }

    try {
      await updateDoc(doc(db, "payroll", id), {
        isPublished: true,
        status: "published",
        publishedAt: new Date(),
        isLocked: true,
      });
      setPayroll({
        ...payroll,
        isPublished: true,
        status: "published",
        publishedAt: new Date(),
        isLocked: true,
      });
      addToast({
        type: "success",
        title: "Payroll published",
        message: `${payroll.name} has been finalized`,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Failed to publish",
        message: String(err),
      });
    }
  };

  const updateRow = useCallback(
    (nameId: string, field: keyof ProcessingRow, value: number) => {
      setRows((prev) => {
        const updated = prev.map((r) =>
          r.nameId === nameId ? { ...r, [field]: value } : r,
        );
        return recalculateSalaries(updated, defaultWorkdays);
      });
    },
    [defaultWorkdays, recalculateSalaries],
  );

  const updateEarning = (nameId: string, earningId: string, value: number) => {
    setEarningData((prev) => {
      const next = new Map(prev);
      const empMap = new Map(next.get(nameId) || new Map());
      empMap.set(earningId, value);
      next.set(nameId, empMap);
      return next;
    });
  };

  const updateDeduction = (
    nameId: string,
    deductionId: string,
    value: number,
  ) => {
    setDeductionData((prev) => {
      const next = new Map(prev);
      const empMap = new Map(next.get(nameId) || new Map());
      empMap.set(deductionId, value);
      next.set(nameId, empMap);
      return next;
    });
  };

  const updateBenefit = (
    nameId: string,
    benefitId: string,
    employeeShare: number,
    employerShare: number,
  ) => {
    setBenefitData((prev) => {
      const next = new Map(prev);
      const empMap = new Map(next.get(nameId) || new Map());
      empMap.set(benefitId, { employeeShare, employerShare });
      next.set(nameId, empMap);
      return next;
    });
  };

  const handleSaveStage = async () => {
    if (!id || saving) return;
    setSaving(true);
    try {
      const savePromises: Promise<unknown>[] = [];

      for (const row of rows) {
        const emp = employees.find((e) => e.nameId === row.nameId);
        if (emp) {
          savePromises.push(
            updateDoc(doc(db, "payroll_employees", emp.id), {
              daysWorked: row.daysWorked,
              absences: row.absences,
              lateHours: row.lateHours,
              overtimeHours: row.overtimeHours,
              basicSalary: row.basicSalary,
              ratePerDay: row.ratePerDay,
              salaryAmount: row.salaryAmount,
              grossPay: getEmployeeGross(row),
              netPay: getEmployeeNet(row),
            }),
          );
        }
      }

      const existingEarnings = await getDocs(
        query(
          collection(db, "payroll_employees_earnings"),
          where("payrollId", "==", id),
        ),
      );
      const existingDeductions = await getDocs(
        query(
          collection(db, "payroll_employees_deductions"),
          where("payrollId", "==", id),
        ),
      );
      const existingBenefits = await getDocs(
        query(
          collection(db, "payroll_employees_benefits"),
          where("payrollId", "==", id),
        ),
      );

      const deletePromises: Promise<unknown>[] = [];
      existingEarnings.docs.forEach((d) =>
        deletePromises.push(
          updateDoc(doc(db, "payroll_employees_earnings", d.id), {
            deleted: true,
          }),
        ),
      );
      existingDeductions.docs.forEach((d) =>
        deletePromises.push(
          updateDoc(doc(db, "payroll_employees_deductions", d.id), {
            deleted: true,
          }),
        ),
      );
      existingBenefits.docs.forEach((d) =>
        deletePromises.push(
          updateDoc(doc(db, "payroll_employees_benefits", d.id), {
            deleted: true,
          }),
        ),
      );

      await Promise.all(deletePromises);

      const addPromises: Promise<unknown>[] = [];
      earningData.forEach((empMap, nameId) => {
        empMap.forEach((amount, earningId) => {
          if (amount > 0) {
            addPromises.push(
              addDoc(collection(db, "payroll_employees_earnings"), {
                payrollId: id,
                nameId,
                earningId,
                amount,
                createdAt: serverTimestamp(),
              }),
            );
          }
        });
      });
      deductionData.forEach((empMap, nameId) => {
        empMap.forEach((amount, deductionId) => {
          if (amount > 0) {
            addPromises.push(
              addDoc(collection(db, "payroll_employees_deductions"), {
                payrollId: id,
                nameId,
                deductionId,
                amount,
                createdAt: serverTimestamp(),
              }),
            );
          }
        });
      });
      benefitData.forEach((empMap, nameId) => {
        empMap.forEach(({ employeeShare, employerShare }, benefitId) => {
          if (employeeShare > 0 || employerShare > 0) {
            addPromises.push(
              addDoc(collection(db, "payroll_employees_benefits"), {
                payrollId: id,
                nameId,
                benefitId,
                employeeShare,
                employerShare,
                createdAt: serverTimestamp(),
              }),
            );
          }
        });
      });

      await Promise.all(addPromises);
      addToast({
        type: "success",
        title: "Saved",
        message: "All changes have been saved",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    STAGES,
    payroll,
    activeStage,
    setActiveStage,
    loading,
    rows,
    earningsList,
    deductionsList,
    benefitsList,
    earningData,
    deductionData,
    benefitData,
    saving,
    showValidation,
    setShowValidation,
    validationErrors,
    company,
    startDate,
    endDate,
    actualWorkdays,
    defaultWorkdays,
    term,
    navigate,
    toggleLock,
    handlePublish,
    handleSaveStage,
    updateRow,
    updateEarning,
    updateDeduction,
    updateBenefit,
    getEarningTotal,
    getDeductionTotal,
    getEmployeeGross,
    getEmployeeNet,
  };
}
