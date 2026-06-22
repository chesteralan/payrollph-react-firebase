import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
import type { Employee, NameRecord } from "@/types/employee";
import type { DTREntry, LeaveApplication, LeaveBalance } from "@/types/dtr";
import type {
  DTRPageBenefit,
  DTRPageDayForm,
  DTRPageLeaveForm,
  DTRPageViewMode,
} from "./DTRPage.types";
import {
  calcHours,
  dateStr,
  daysInMonth,
  firstDayOfMonth,
  useDTRStats,
} from "./DTRComputation";
import { MONTH_NAMES } from "./DTRPage.constants";

const EMPTY_DAY_FORM: DTRPageDayForm = {
  timeIn: "",
  timeOut: "",
  overtimeHours: 0,
  lateHours: 0,
  absenceType: undefined,
  absenceReason: "",
  notes: "",
};

const EMPTY_LEAVE_FORM: DTRPageLeaveForm = {
  benefitId: "",
  startDate: "",
  endDate: "",
  reason: "",
};

export function useDTRPage() {
  const { canView, canEdit, canDelete } = usePermissions();
  const { addToast } = useToast();

  // ── State ──────────────────────────────────────────────
  const [employees, setEmployees] = useState<
    (Employee & { name?: string })[]
  >([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dtrEntries, setDtrEntries] = useState<DTREntry[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<
    LeaveApplication[]
  >([]);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayForm, setDayForm] = useState<DTRPageDayForm>(EMPTY_DAY_FORM);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState<DTRPageLeaveForm>(EMPTY_LEAVE_FORM);
  const [benefits, setBenefits] = useState<DTRPageBenefit[]>([]);

  const [viewMode, setViewMode] = useState<DTRPageViewMode>("calendar");
  const [dtrSearchQuery, setDtrSearchQuery] = useState("");
  const [allMonthEntries, setAllMonthEntries] = useState<
    (DTREntry & { employeeName?: string; employeeCode?: string })[]
  >([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<DTREntry>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ──────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    const [empSnap, nameSnap] = await Promise.all([
      getDocs(
        query(collection(db, "employees"), where("isActive", "==", true)),
      ),
      getDocs(collection(db, "names")),
    ]);
    const namesMap = new Map<string, string>();
    nameSnap.docs.forEach((d) => {
      const n = d.data() as NameRecord;
      namesMap.set(
        d.id,
        `${n.firstName} ${n.middleName || ""} ${n.lastName} ${n.suffix || ""}`.trim(),
      );
    });
    const list = empSnap.docs.map((d) => {
      const emp = d.data() as Employee;
      return {
        ...emp,
        id: d.id,
        name: namesMap.get(emp.nameId) || emp.employeeCode,
      };
    });
    setEmployees(list);
    if (list.length > 0 && list[0]) setSelectedEmployeeId(list[0].id);
  }, []);

  const fetchDTRData = useCallback(async () => {
    const start = dateStr(selectedYear, selectedMonth, 1);
    const end = dateStr(
      selectedYear,
      selectedMonth,
      daysInMonth(selectedYear, selectedMonth),
    );
    const snap = await getDocs(
      query(
        collection(db, "dtr_entries"),
        where("employeeId", "==", selectedEmployeeId),
      ),
    );
    const entries = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as DTREntry[];
    setDtrEntries(entries.filter((e) => e.date >= start && e.date <= end));
  }, [selectedEmployeeId, selectedMonth, selectedYear]);

  const fetchLeaveData = useCallback(async () => {
    const [balSnap, appSnap, benSnap] = await Promise.all([
      getDocs(
        query(
          collection(db, "leave_balances"),
          where("employeeId", "==", selectedEmployeeId),
          where("year", "==", selectedYear),
        ),
      ),
      getDocs(
        query(
          collection(db, "leave_applications"),
          where("employeeId", "==", selectedEmployeeId),
        ),
      ),
      getDocs(query(collection(db, "benefits"))),
    ]);
    setLeaveBalances(
      balSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as LeaveBalance[],
    );
    setLeaveApplications(
      appSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as LeaveApplication[],
    );
    setBenefits(
      benSnap.docs
        .map((d) => ({ id: d.id, name: (d.data() as { name: string }).name }))
        .filter((b) => b.name.toLowerCase().includes("leave")),
    );
  }, [selectedEmployeeId, selectedYear]);

  const fetchAllMonthEntries = useCallback(async () => {
    const start = dateStr(selectedYear, selectedMonth, 1);
    const end = dateStr(
      selectedYear,
      selectedMonth,
      daysInMonth(selectedYear, selectedMonth),
    );
    const snap = await getDocs(collection(db, "dtr_entries"));
    const namesMap = new Map<string, string>();
    const codesMap = new Map<string, string>();
    employees.forEach((e) => {
      namesMap.set(e.id, e.name || "");
      codesMap.set(e.id, e.employeeCode);
    });
    const allEntries = snap.docs
      .map((d) => {
        const entry = { id: d.id, ...d.data() } as DTREntry;
        return {
          ...entry,
          employeeName: namesMap.get(entry.employeeId) || "",
          employeeCode: codesMap.get(entry.employeeId) || "",
        };
      })
      .filter((e) => e.date >= start && e.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date));
    setAllMonthEntries(allEntries);
  }, [selectedYear, selectedMonth, employees]);

  // ── Effects ────────────────────────────────────────────
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchDTRData();
      fetchLeaveData();
    }
  }, [
    selectedEmployeeId,
    selectedMonth,
    selectedYear,
    fetchDTRData,
    fetchLeaveData,
  ]);

  useEffect(() => {
    if (viewMode === "summary" && employees.length > 0) {
      fetchAllMonthEntries();
    }
  }, [viewMode, selectedMonth, selectedYear, employees, fetchAllMonthEntries]);

  // ── Derived data ───────────────────────────────────────
  const filteredMonthEntries = useMemo(() => {
    if (dtrSearchQuery === "") return allMonthEntries;
    const q = dtrSearchQuery.toLowerCase();
    return allMonthEntries.filter(
      (e) =>
        (e.employeeName || "").toLowerCase().includes(q) ||
        (e.employeeCode || "").toLowerCase().includes(q) ||
        e.date.includes(q),
    );
  }, [allMonthEntries, dtrSearchQuery]);

  const entryMap = useMemo(() => {
    const map = new Map<string, DTREntry>();
    dtrEntries.forEach((e) => map.set(e.date, e));
    return map;
  }, [dtrEntries]);

  const stats = useDTRStats(dtrEntries);

  const today = new Date();
  const dim = daysInMonth(selectedYear, selectedMonth);
  const fdm = firstDayOfMonth(selectedYear, selectedMonth);
  const selectedDateStr =
    selectedDay !== null
      ? dateStr(selectedYear, selectedMonth, selectedDay)
      : "";
  const hasExistingEntry = entryMap.has(selectedDateStr);
  const computedHoursWorked =
    dayForm.timeIn && dayForm.timeOut
      ? calcHours(dayForm.timeIn, dayForm.timeOut)
      : 0;

  // ── Navigation handlers ────────────────────────────────
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else setSelectedMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else setSelectedMonth((m) => m + 1);
  };

  // ── Day entry handlers ─────────────────────────────────
  const openDayModal = (day: number) => {
    setSelectedDay(day);
    const ds = dateStr(selectedYear, selectedMonth, day);
    const existing = entryMap.get(ds);
    if (existing) {
      setDayForm({
        timeIn: existing.timeIn || "",
        timeOut: existing.timeOut || "",
        overtimeHours: existing.overtimeHours || 0,
        lateHours: existing.lateHours || 0,
        absenceType: existing.absenceType || undefined,
        absenceReason: existing.absenceReason || "",
        notes: existing.notes || "",
      });
    } else {
      setDayForm(EMPTY_DAY_FORM);
    }
    setShowDayModal(true);
  };

  const saveDayEntry = async () => {
    if (!selectedDay || !selectedEmployeeId) return;
    try {
      const ds = dateStr(selectedYear, selectedMonth, selectedDay);
      const ti = dayForm.timeIn || undefined;
      const to = dayForm.timeOut || undefined;
      const hw = ti && to ? calcHours(ti, to) : 0;
      const at = dayForm.absenceType || undefined;
      const ar = dayForm.absenceReason || undefined;
      const nt = dayForm.notes || undefined;
      const data = {
        employeeId: selectedEmployeeId,
        date: ds,
        timeIn: ti,
        timeOut: to,
        hoursWorked: hw,
        overtimeHours: dayForm.overtimeHours,
        lateHours: dayForm.lateHours,
        absenceType: at,
        absenceReason: ar,
        notes: nt,
        updatedAt: new Date(),
      };

      const existing = entryMap.get(ds);
      if (existing) {
        await updateDoc(doc(db, "dtr_entries", existing.id), data);
        addToast({ type: "success", title: "Entry updated" });
      } else {
        await addDoc(collection(db, "dtr_entries"), {
          ...data,
          createdAt: new Date(),
        });
        addToast({ type: "success", title: "Entry created" });
      }
      setShowDayModal(false);
      fetchDTRData();
    } catch {
      addToast({ type: "error", title: "Failed to save DTR entry" });
    }
  };

  const deleteDayEntry = async () => {
    if (!selectedDay) return;
    try {
      const ds = dateStr(selectedYear, selectedMonth, selectedDay);
      const existing = entryMap.get(ds);
      if (existing) {
        await deleteDoc(doc(db, "dtr_entries", existing.id));
        addToast({ type: "success", title: "Entry deleted" });
        setShowDayModal(false);
        fetchDTRData();
      }
    } catch {
      addToast({ type: "error", title: "Failed to delete DTR entry" });
    }
  };

  // ── Leave handlers ─────────────────────────────────────
  const applyLeave = async () => {
    if (!leaveForm.benefitId || !leaveForm.startDate || !leaveForm.endDate)
      return;
    try {
      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      const days =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
      if (days <= 0) {
        addToast({ type: "error", title: "Invalid date range" });
        return;
      }

      const bal = leaveBalances.find(
        (b) => b.benefitId === leaveForm.benefitId,
      );
      if (bal && bal.remaining < days) {
        addToast({
          type: "error",
          title: "Insufficient leave balance",
          message: `Available: ${bal.remaining} days`,
        });
        return;
      }

      await addDoc(collection(db, "leave_applications"), {
        employeeId: selectedEmployeeId,
        benefitId: leaveForm.benefitId,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        days,
        reason: leaveForm.reason,
        status: "pending",
        createdAt: new Date(),
      });
      addToast({ type: "success", title: "Leave application submitted" });
      setShowLeaveModal(false);
      setLeaveForm(EMPTY_LEAVE_FORM);
      fetchLeaveData();
    } catch {
      addToast({ type: "error", title: "Failed to submit leave application" });
    }
  };

  const approveLeave = async (app: LeaveApplication) => {
    try {
      await updateDoc(doc(db, "leave_applications", app.id), {
        status: "approved",
      });
      const bal = leaveBalances.find((b) => b.benefitId === app.benefitId);
      if (bal) {
        await updateDoc(doc(db, "leave_balances", bal.id), {
          used: bal.used + app.days,
          remaining: bal.remaining - app.days,
        });
      }
      addToast({ type: "success", title: "Leave approved" });
      fetchLeaveData();
    } catch {
      addToast({ type: "error", title: "Failed to approve leave" });
    }
  };

  const rejectLeave = async (app: LeaveApplication) => {
    try {
      await updateDoc(doc(db, "leave_applications", app.id), {
        status: "rejected",
      });
      addToast({ type: "info", title: "Leave rejected" });
      fetchLeaveData();
    } catch {
      addToast({ type: "error", title: "Failed to reject leave" });
    }
  };

  // ── Export / Import handlers ───────────────────────────
  const handleExport = () => {
    const headers = [
      "Employee",
      "Code",
      "Date",
      "Time In",
      "Time Out",
      "Hours Worked",
      "Overtime",
      "Late",
      "Absence Type",
      "Reason",
      "Notes",
    ];
    const rows = allMonthEntries.map((e) => [
      e.employeeName || "",
      e.employeeCode || "",
      e.date,
      e.timeIn || "",
      e.timeOut || "",
      e.hoursWorked,
      e.overtimeHours,
      e.lateHours,
      e.absenceType || "",
      e.absenceReason || "",
      e.notes || "",
    ]);
    if (selectedEmployeeId) {
      const emp = employees.find((e) => e.id === selectedEmployeeId);
      const empEntries = dtrEntries.map((e) => [
        emp?.name || "",
        emp?.employeeCode || "",
        e.date,
        e.timeIn || "",
        e.timeOut || "",
        e.hoursWorked,
        e.overtimeHours,
        e.lateHours,
        e.absenceType || "",
        e.absenceReason || "",
        e.notes || "",
      ]);
      rows.length = 0;
      rows.push(...empEntries);
    }
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DTR_${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: "success", title: "DTR exported" });
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      addToast({ type: "error", title: "Empty file" });
      return;
    }
    const headers = lines[0]!
      .split(",")
      .map((h) => h.trim().replace(/"/g, ""));
    const preview: Partial<DTREntry>[] = [];
    const errors: string[] = [];
    const nameToId = new Map<string, string>();
    employees.forEach((emp) =>
      nameToId.set((emp.name || "").toLowerCase(), emp.id),
    );
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]!
        .split(",")
        .map((v) => v.trim().replace(/"/g, ""));
      if (values.length < 3) {
        errors.push(`Line ${i + 1}: Too few columns`);
        continue;
      }
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      const empName = (row["Employee"] || "").toLowerCase();
      const employeeId =
        nameToId.get(empName) ||
        employees.find((e) => e.employeeCode === row["Code"])?.id;
      if (!employeeId) {
        errors.push(
          `Line ${i + 1}: Employee "${row["Employee"]}" not found`,
        );
        continue;
      }
      if (!row["Date"] || !/^\d{4}-\d{2}-\d{2}$/.test(row["Date"])) {
        errors.push(`Line ${i + 1}: Invalid date "${row["Date"]}"`);
        continue;
      }
      const ti = row["Time In"] || undefined;
      const to = row["Time Out"] || undefined;
      const hw = ti && to ? calcHours(ti, to) : 0;
      preview.push({
        employeeId,
        date: row["Date"],
        timeIn: ti,
        timeOut: to,
        hoursWorked: hw,
        overtimeHours: Number(row["Overtime"] || 0),
        lateHours: Number(row["Late"] || 0),
        absenceType: (row["Absence Type"] || undefined) as
          | DTREntry["absenceType"]
          | undefined,
        absenceReason: row["Reason"] || undefined,
        notes: row["Notes"] || undefined,
      });
    }
    setImportPreview(preview);
    setImportErrors(errors);
    setShowImportModal(true);
  };

  const handleImport = async () => {
    try {
      let success = 0;
      for (const entry of importPreview) {
        if (!entry.employeeId || !entry.date) continue;
        const existing = await getDocs(
          query(
            collection(db, "dtr_entries"),
            where("employeeId", "==", entry.employeeId),
            where("date", "==", entry.date),
          ),
        );
        if (!existing.empty) {
          await updateDoc(
            doc(db, "dtr_entries", existing.docs[0]!.id),
            {
              ...entry,
              updatedAt: new Date(),
            },
          );
        } else {
          await addDoc(collection(db, "dtr_entries"), {
            ...entry,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        success++;
      }
      setShowImportModal(false);
      setImportPreview([]);
      setImportErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDTRData();
      fetchAllMonthEntries();
      addToast({ type: "success", title: `Imported ${success} entries` });
    } catch {
      addToast({ type: "error", title: "Failed to import DTR entries" });
    }
  };

  // ── Return ─────────────────────────────────────────────
  return {
    employees,
    selectedEmployeeId,
    setSelectedEmployeeId,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    dtrEntries,
    leaveBalances,
    leaveApplications,
    showDayModal,
    setShowDayModal,
    selectedDay,
    dayForm,
    setDayForm,
    showLeaveModal,
    setShowLeaveModal,
    leaveForm,
    setLeaveForm,
    benefits,
    viewMode,
    setViewMode,
    dtrSearchQuery,
    setDtrSearchQuery,
    allMonthEntries,
    showImportModal,
    setShowImportModal,
    importPreview,
    importErrors,
    fileInputRef,
    filteredMonthEntries,
    entryMap,
    stats,
    today,
    dim,
    fdm,
    selectedDateStr,
    hasExistingEntry,
    computedHoursWorked,
    canView,
    canEdit,
    canDelete,
    handlePrevMonth,
    handleNextMonth,
    openDayModal,
    saveDayEntry,
    deleteDayEntry,
    applyLeave,
    approveLeave,
    rejectLeave,
    handleExport,
    handleFileSelect,
    handleImport,
  };
}
