import { useCallback, useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import ExcelJS from "exceljs";
import { downloadBlob } from "@/utils/exportUtils";
import type {
  Employee,
  EmployeeArea,
  EmployeeContact,
  EmployeeGroup,
  EmployeePosition,
  EmployeeProfile,
  EmployeeSalary,
  EmployeeStatus,
} from "@/types";
import type { EmployeeReportData } from "./EmployeeReportPage.types";

export interface EmployeeReportFilters {
  status: "all" | "active" | "inactive" | "terminated";
  groupId: string;
  positionId: string;
  areaId: string;
}

export function useEmployeeReport() {
  const { currentCompanyId } = useAuth();
  const { canView } = usePermissions();

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeReportData[]>([]);
  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [positions, setPositions] = useState<EmployeePosition[]>([]);
  const [areas, setAreas] = useState<EmployeeArea[]>([]);
  const [statuses, setStatuses] = useState<EmployeeStatus[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [filters, setFilters] = useState<EmployeeReportFilters>({
    status: "all",
    groupId: "",
    positionId: "",
    areaId: "",
  });

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchLookups = useCallback(async () => {
    if (!currentCompanyId) return;
    const [groupsSnap, positionsSnap, areasSnap, statusesSnap] =
      await Promise.all([
        getDocs(
          query(
            collection(db, "groups"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
        getDocs(
          query(
            collection(db, "positions"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
        getDocs(
          query(
            collection(db, "areas"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
        getDocs(
          query(
            collection(db, "statuses"),
            where("companyId", "==", currentCompanyId),
          ),
        ),
      ]);

    setGroups(
      groupsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as EmployeeGroup),
    );
    setPositions(
      positionsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as EmployeePosition,
      ),
    );
    setAreas(
      areasSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as EmployeeArea),
    );
    setStatuses(
      statusesSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as EmployeeStatus,
      ),
    );
  }, [currentCompanyId]);

  useEffect(() => {
    if (currentCompanyId) {
       
      fetchLookups();
    }
  }, [currentCompanyId, fetchLookups]);

  const generateReport = async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setHasGenerated(true);

    try {
      const employeesSnap = await getDocs(
        query(
          collection(db, "employees"),
          where("companyId", "==", currentCompanyId),
        ),
      );
      let emps = employeesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Employee[];

      if (filters.status !== "all") {
        if (filters.status === "active") emps = emps.filter((e) => e.isActive);
        else if (filters.status === "inactive")
          emps = emps.filter((e) => !e.isActive);
        else if (filters.status === "terminated")
          emps = emps.filter((e) => e.statusId === filters.status);
      }
      if (filters.groupId)
        emps = emps.filter((e) => e.groupId === filters.groupId);
      if (filters.positionId)
        emps = emps.filter((e) => e.positionId === filters.positionId);
      if (filters.areaId)
        emps = emps.filter((e) => e.areaId === filters.areaId);

      const [namesSnap, profilesSnap, contactsSnap, salariesSnap] =
        await Promise.all([
          getDocs(
            query(
              collection(db, "names"),
              where("companyId", "==", currentCompanyId),
            ),
          ),
          getDocs(
            query(
              collection(db, "employeeProfiles"),
              where("companyId", "==", currentCompanyId),
            ),
          ),
          getDocs(
            query(
              collection(db, "employeeContacts"),
              where("companyId", "==", currentCompanyId),
            ),
          ),
          getDocs(
            query(
              collection(db, "employeeSalaries"),
              where("companyId", "==", currentCompanyId),
            ),
          ),
        ]);

      const names = namesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
        id: string;
        nameId?: string;
        firstName?: string;
        middleName?: string;
        lastName?: string;
        suffix?: string;
      }[];
      const profiles = profilesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as EmployeeProfile[];
      const contacts = contactsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as EmployeeContact[];
      const salaries = salariesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as EmployeeSalary[];

      const reportData: EmployeeReportData[] = emps.map((emp) => {
        const name = names.find((n) => n.nameId === emp.nameId);
        const fullName = name
          ? `${name.firstName} ${name.middleName ? name.middleName + " " : ""}${name.lastName}${name.suffix ? " " + name.suffix : ""}`
          : emp.nameId;
        const group = groups.find((g) => g.id === emp.groupId);
        const position = positions.find((p) => p.id === emp.positionId);
        const area = areas.find((a) => a.id === emp.areaId);
        const status = statuses.find((s) => s.id === emp.statusId);
        const profile = profiles.find((p) => p.nameId === emp.nameId);
        const empContacts = contacts.filter((c) => c.employeeId === emp.id);
        const salary = salaries
          .filter((s) => s.employeeId === emp.id && s.isActive)
          .sort(
            (a, b) =>
              new Date(b.effectiveDate).getTime() -
              new Date(a.effectiveDate).getTime(),
          )[0];

        return {
          ...emp,
          name: fullName.trim(),
          groupName: group?.name,
          positionName: position?.name,
          areaName: area?.name,
          statusName: status?.name,
          salary: salary?.amount,
          salaryFrequency: salary?.frequency,
          contacts: empContacts,
          profile,
        };
      });

      reportData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setEmployees(reportData);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportXLS = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Employee Master List");

    sheet.columns = [
      { header: "Employee Code", key: "employeeCode", width: 15 },
      { header: "Name", key: "name", width: 30 },
      { header: "Group", key: "group", width: 20 },
      { header: "Position", key: "position", width: 25 },
      { header: "Area", key: "area", width: 20 },
      { header: "Status", key: "status", width: 12 },
      { header: "Salary", key: "salary", width: 12 },
      { header: "Frequency", key: "frequency", width: 12 },
      { header: "Hire Date", key: "hireDate", width: 12 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Email", key: "email", width: 25 },
    ];

    for (const r of employees) {
      sheet.addRow({
        employeeCode: r.employeeCode,
        name: r.name || r.nameId,
        group: r.groupName || "",
        position: r.positionName || "",
        area: r.areaName || "",
        status: r.isActive ? "Active" : "Inactive",
        salary: r.salary || 0,
        frequency: r.salaryFrequency || "",
        hireDate: r.hireDate ? new Date(r.hireDate).toLocaleDateString() : "",
        phone:
          r.contacts?.find((c) => c.type === "phone" && c.isPrimary)?.value ||
          r.contacts?.find((c) => c.type === "phone")?.value ||
          "",
        email:
          r.contacts?.find((c) => c.type === "email" && c.isPrimary)?.value ||
          r.contacts?.find((c) => c.type === "email")?.value ||
          "",
      });
    }

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCCCCCC" },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(
      blob,
      `Employee_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "Employee Code",
      "Name",
      "Group",
      "Position",
      "Area",
      "Status",
      "Salary",
      "Frequency",
      "Hire Date",
      "Phone",
      "Email",
    ];
    const rows = employees.map((r) => [
      r.employeeCode,
      r.name || r.nameId,
      r.groupName || "",
      r.positionName || "",
      r.areaName || "",
      r.isActive ? "Active" : "Inactive",
      r.salary || 0,
      r.salaryFrequency || "",
      r.hireDate ? new Date(r.hireDate).toLocaleDateString() : "",
      r.contacts?.find((c) => c.type === "phone" && c.isPrimary)?.value ||
        r.contacts?.find((c) => c.type === "phone")?.value ||
        "",
      r.contacts?.find((c) => c.type === "email" && c.isPrimary)?.value ||
        r.contacts?.find((c) => c.type === "email")?.value ||
        "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Employee_Report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handlePrint = () => {
    window.print();
  };

  return {
    canView,
    loading,
    employees,
    groups,
    positions,
    areas,
    statuses,
    hasGenerated,
    filters,
    setFilters,
    expandedRows,
    generateReport,
    toggleRow,
    handleExportXLS,
    handleExportCSV,
    handlePrint,
  };
}

export function formatCurrency(value: number | undefined | null): string {
  return (
    value?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) || "0.00"
  );
}

export function getPrimaryContact(
  contacts: EmployeeContact[] | undefined,
  type: "phone" | "email" | "address",
): string {
  if (!contacts) return "";
  return (
    contacts.find((c) => c.type === type && c.isPrimary)?.value ||
    contacts.find((c) => c.type === type)?.value ||
    ""
  );
}
