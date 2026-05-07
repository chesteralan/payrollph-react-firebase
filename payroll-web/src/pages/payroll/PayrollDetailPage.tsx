import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { useToast } from "../../components/ui/Toast";
import { EditableCell } from "../../components/ui/EditableCell";
import { PayrollOutputView } from "../../components/payroll/PayrollOutputView";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  ArrowLeft,
  Lock,
  Unlock,
  Save,
  AlertCircle,
  AlertTriangle,
  Send,
} from "lucide-react";
import { formatCurrency } from "../../utils/currency";
import { calculateWorkingDaysSync } from "../../utils/calendarUtils";
import type {
  Payroll,
  PayrollEmployee,
  PayrollValidationError,
  Term,
} from "../../types";

const STAGES = [
  "dtr",
  "salaries",
  "earnings",
  "benefits",
  "deductions",
  "summary",
  "output",
];

interface ProcessingRow {
  nameId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  groupId: string;
  positionId: string;
  areaId: string;
  daysWorked: number;
  absences: number;
  lateHours: number;
  overtimeHours: number;
  basicSalary: number;
  ratePerDay: number;
  salaryAmount: number;
}

export function PayrollDetailPage() {
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

  const loadPayroll = async () => {
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
        calendarSnap,
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
        getDocs(
          query(
            collection(db, "calendar"),
            where("companyId", "==", payrollData?.companyId || "global"),
          ),
        ),
      ]);

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

        const sd = dateRange?.startDate || null;
        const ed = dateRange?.endDate || null;
        if (sd && ed) {
          const calendarEntries = calendarSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Record<string, unknown>[];
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
              payEmps.map((e) => e.employeeId || e.nameId).slice(0, 10),
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
        const empDtr = dtrData.get(emp.employeeId || emp.nameId);
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
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (id) loadPayroll();
    /* eslint-enable react-hooks/set-state-in-effect */
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

  if (loading || !payroll) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/payroll")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{payroll.name}</h1>
            <p className="text-gray-500">
              {new Date(0, payroll.month - 1).toLocaleString("default", {
                month: "long",
              })}{" "}
              {payroll.year}
              {term && (
                <span className="ml-2 text-blue-600 font-medium">
                  Term: {term.name}
                </span>
              )}
              {payroll.isPublished && (
                <span className="ml-2 text-green-600 font-medium">
                  Published
                </span>
              )}
              {payroll.isLocked && !payroll.isPublished && (
                <span className="ml-2 text-orange-600 font-medium">Locked</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeStage !== "output" && !payroll.isLocked && (
            <Button
              variant="secondary"
              onClick={handleSaveStage}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
          {!payroll.isLocked && (
            <Button variant="secondary" onClick={toggleLock}>
              {payroll.isLocked ? (
                <Unlock className="w-4 h-4 mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              {payroll.isLocked ? "Unlock" : "Lock"}
            </Button>
          )}
          {!payroll.isPublished && (
            <Button onClick={handlePublish} disabled={payroll.isLocked}>
              <Send className="w-4 h-4 mr-2" />
              Publish
            </Button>
          )}
        </div>
      </div>

      {showValidation && validationErrors.length > 0 && (
        <Card
          className={
            validationErrors.some((e) => e.severity === "error")
              ? "border-red-200"
              : "border-yellow-200"
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationErrors.some((e) => e.severity === "error") ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Validation Errors
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Validation Warnings
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {validationErrors.map((err, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 p-2 rounded ${err.severity === "error" ? "bg-red-50" : "bg-yellow-50"}`}
                >
                  {err.severity === "error" ? (
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span className="text-sm font-medium">
                      {err.employeeName ? `${err.employeeName}: ` : ""}
                      {err.message}
                    </span>
                    {err.nameId && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({err.nameId})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {STAGES.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveStage(stage)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap ${
              activeStage === stage
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {stage}
          </button>
        ))}
      </div>

      {activeStage === "dtr" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily Time Record</CardTitle>
                {startDate && endDate && (
                  <p className="text-sm text-gray-500">
                    Auto-populated from DTR entries ({startDate} to {endDate})
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/dtr")}
              >
                Manage DTR Entries
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Days Worked
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Absences
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Late (hrs)
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Overtime (hrs)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {row.employeeCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <EditableCell
                        value={row.daysWorked}
                        onChange={(v) =>
                          updateRow(row.nameId, "daysWorked", Number(v))
                        }
                        type="number"
                        className="text-center"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <EditableCell
                        value={row.absences}
                        onChange={(v) =>
                          updateRow(row.nameId, "absences", Number(v))
                        }
                        type="number"
                        className="text-center"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <EditableCell
                        value={row.lateHours}
                        onChange={(v) =>
                          updateRow(row.nameId, "lateHours", Number(v))
                        }
                        type="number"
                        className="text-center"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <EditableCell
                        value={row.overtimeHours}
                        onChange={(v) =>
                          updateRow(row.nameId, "overtimeHours", Number(v))
                        }
                        type="number"
                        className="text-center"
                      />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No employees in this payroll. Go to the wizard to add
                      employees.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === "salaries" && (
        <Card>
          <CardHeader>
            <CardTitle>Salaries</CardTitle>
            <p className="text-sm text-gray-500">
              Based on{" "}
              {actualWorkdays !== null
                ? `${actualWorkdays} actual workdays (calendar-adjusted)`
                : `${defaultWorkdays} workdays/month (default)`}
              . Rate/Day and Salary Amount auto-calculated.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Basic Salary
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Rate/Day
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Days
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Salary Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="text-sm font-medium text-gray-900">
                        {row.employeeCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <EditableCell
                        value={row.basicSalary}
                        onChange={(v) =>
                          updateRow(row.nameId, "basicSalary", Number(v))
                        }
                        type="number"
                        className="text-right"
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-700">
                      {formatCurrency(row.ratePerDay)}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-500">
                      {row.daysWorked}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(row.salaryAmount)}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No employees in this payroll.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === "earnings" && (
        <Card>
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                    Employee
                  </th>
                  {earningsList.map((e) => (
                    <th
                      key={e.id}
                      className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-[120px]"
                    >
                      {e.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 sticky left-0 bg-white">
                      <div className="text-sm font-medium text-gray-900">
                        {row.employeeCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.lastName}
                      </div>
                    </td>
                    {earningsList.map((e) => (
                      <td key={e.id} className="px-4 py-2 text-right">
                        <EditableCell
                          value={earningData.get(row.nameId)?.get(e.id) || 0}
                          onChange={(v) =>
                            updateEarning(row.nameId, e.id, Number(v))
                          }
                          type="number"
                          className="text-right"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-medium">
                  <td className="px-4 py-2 sticky left-0 bg-gray-50 text-sm">
                    Total
                  </td>
                  {earningsList.map((e) => (
                    <td key={e.id} className="px-4 py-2 text-right text-sm">
                      {formatCurrency(getEarningTotal(e.id))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === "benefits" && (
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                    Employee
                  </th>
                  {benefitsList.map((b) => (
                    <th
                      key={b.id}
                      className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-[200px]"
                      colSpan={2}
                    >
                      {b.name} (EE / ER)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 sticky left-0 bg-white">
                      <div className="text-sm font-medium text-gray-900">
                        {row.employeeCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.lastName}
                      </div>
                    </td>
                    {benefitsList.map((b) => {
                      const val = benefitData.get(row.nameId)?.get(b.id) || {
                        employeeShare: 0,
                        employerShare: 0,
                      };
                      return (
                        <td key={b.id} className="px-4 py-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <EditableCell
                              value={val.employeeShare}
                              onChange={(v) =>
                                updateBenefit(
                                  row.nameId,
                                  b.id,
                                  Number(v),
                                  val.employerShare,
                                )
                              }
                              type="number"
                              className="w-20 text-right"
                            />
                            <EditableCell
                              value={val.employerShare}
                              onChange={(v) =>
                                updateBenefit(
                                  row.nameId,
                                  b.id,
                                  val.employeeShare,
                                  Number(v),
                                )
                              }
                              type="number"
                              className="w-20 text-right"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === "deductions" && (
        <Card>
          <CardHeader>
            <CardTitle>Deductions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                    Employee
                  </th>
                  {deductionsList.map((d) => (
                    <th
                      key={d.id}
                      className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase min-w-[120px]"
                    >
                      {d.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.nameId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 sticky left-0 bg-white">
                      <div className="text-sm font-medium text-gray-900">
                        {row.employeeCode}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.lastName}
                      </div>
                    </td>
                    {deductionsList.map((d) => (
                      <td key={d.id} className="px-4 py-2 text-right">
                        <EditableCell
                          value={deductionData.get(row.nameId)?.get(d.id) || 0}
                          onChange={(v) =>
                            updateDeduction(row.nameId, d.id, Number(v))
                          }
                          type="number"
                          className="text-right"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-medium">
                  <td className="px-4 py-2 sticky left-0 bg-gray-50 text-sm">
                    Total
                  </td>
                  {deductionsList.map((d) => (
                    <td key={d.id} className="px-4 py-2 text-right text-sm">
                      {formatCurrency(getDeductionTotal(d.id))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === "summary" && (
        <Card>
          <CardHeader>
            <CardTitle>Payroll Summary</CardTitle>
            <p className="text-sm text-gray-500">
              Auto-calculated from DTR, Salaries, Earnings, Benefits, and
              Deductions
            </p>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                    Employee
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Basic
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Earnings
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Gross
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Deductions
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Benefits (EE)
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Net Pay
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
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
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-sm">
                        {formatCurrency(row.salaryAmount)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-green-600">
                        {formatCurrency(earnings)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-medium">
                        {formatCurrency(gross)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-red-600">
                        {formatCurrency(deductions)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm">
                        {formatCurrency(benefits)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">
                        {formatCurrency(net)}
                      </td>
                    </tr>
                  );
                })}
                {rows.length > 0 && (
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-4 py-2 sticky left-0 bg-gray-50 text-sm">
                      Total
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(
                        rows.reduce((s, r) => s + r.salaryAmount, 0),
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-green-600">
                      {formatCurrency(
                        rows.reduce(
                          (s, r) =>
                            s +
                            Array.from(
                              earningData.get(r.nameId)?.values() || [],
                            ).reduce((a, v) => a + v, 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(
                        rows.reduce((s, r) => s + getEmployeeGross(r), 0),
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-red-600">
                      {formatCurrency(
                        rows.reduce(
                          (s, r) =>
                            s +
                            Array.from(
                              deductionData.get(r.nameId)?.values() || [],
                            ).reduce((a, v) => a + v, 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(
                        rows.reduce(
                          (s, r) =>
                            s +
                            Array.from(
                              benefitData.get(r.nameId)?.values() || [],
                            ).reduce((a, v) => a + v.employeeShare, 0),
                          0,
                        ),
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {formatCurrency(
                        rows.reduce((s, r) => s + getEmployeeNet(r), 0),
                      )}
                    </td>
                  </tr>
                )}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No employees in this payroll.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeStage === "output" && (
        <PayrollOutputView
          payroll={payroll}
          company={company || undefined}
          rows={rows}
          earningData={earningData}
          deductionData={deductionData}
          benefitData={benefitData}
          earningsList={earningsList}
          deductionsList={deductionsList}
          benefitsList={benefitsList}
        />
      )}

      {activeStage !== "output" && !payroll.isLocked && (
        <div className="flex justify-end">
          <Button onClick={handleSaveStage} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
