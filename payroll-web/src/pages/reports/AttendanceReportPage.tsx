import { useState, useMemo } from "react";
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
import { FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from "xlsx";

interface Employee {
  id: string;
  employeeCode: string;
  nameId: string;
  isActive?: boolean;
}

interface NameRecord {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
}

interface DtrEntry {
  date: string;
  employeeId: string;
  hoursWorked: number;
  absenceType?: string;
  lateHours?: number;
  overtimeHours?: number;
}

interface AttendanceData {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  daysWorked: number;
  absences: number;
  lateHours: number;
  overtimeHours: number;
  attendanceRate: number;
  totalDaysInPeriod: number;
}

export function AttendanceReportPage() {
  const { currentCompanyId } = useAuth();
  const { canView } = usePermissions();
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<(Employee & { name?: string })[]>(
    [],
  );

  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getWorkingDays = (year: number, month: number) => {
    const days = daysInMonth(year, month);
    let workingDays = 0;
    for (let day = 1; day <= days; day++) {
      const d = new Date(year, month, day).getDay();
      if (d !== 0 && d !== 6) workingDays++;
    }
    return workingDays;
  };

  const generateReport = async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setHasGenerated(true);

    try {
      const [employeesSnap, namesSnap, dtrSnap, groupsSnap] = await Promise.all(
        [
          getDocs(
            query(
              collection(db, "employees"),
              where("companyId", "==", currentCompanyId),
              where("isActive", "==", true),
            ),
          ),
          getDocs(collection(db, "names")),
          getDocs(query(collection(db, "dtr_entries"))),
          getDocs(
            query(
              collection(db, "employee_groups"),
              where("companyId", "==", currentCompanyId),
            ),
          ),
        ],
      );

      const namesMap = new Map<string, string>();
      namesSnap.docs.forEach((d) => {
        const n = d.data() as NameRecord;
        namesMap.set(
          d.id,
          `${n.firstName || ""} ${n.middleName || ""} ${n.lastName || ""} ${n.suffix || ""}`.trim(),
        );
      });

      const empList = employeesSnap.docs.map((d) => {
        const emp = d.data() as Employee;
        return {
          ...emp,
          id: d.id,
          name: namesMap.get(emp.nameId) || emp.employeeCode,
        };
      });
      setEmployees(empList);

      const groupList = groupsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as { id: string; name: string },
      );
      setGroups(groupList);

      const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth(year, month)).padStart(2, "0")}`;

      const entries = dtrSnap.docs
        .map((d) => ({ ...d.data() }) as DtrEntry)
        .filter((e) => e.date >= start && e.date <= end);

      const workingDays = getWorkingDays(year, month);
      const results: AttendanceData[] = empList.map((emp) => {
        const empEntries = entries.filter((e) => e.employeeId === emp.id);
        const daysWorked = empEntries.filter((e) => e.hoursWorked > 0).length;
        const absences = empEntries.filter((e) => e.absenceType).length;
        const lateHours = empEntries.reduce(
          (sum, e) => sum + (e.lateHours || 0),
          0,
        );
        const overtimeHours = empEntries.reduce(
          (sum, e) => sum + (e.overtimeHours || 0),
          0,
        );
        const attendanceRate =
          workingDays > 0 ? Math.round((daysWorked / workingDays) * 100) : 0;

        return {
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: emp.name || "",
          daysWorked,
          absences,
          lateHours: Math.round(lateHours * 100) / 100,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          attendanceRate,
          totalDaysInPeriod: workingDays,
        };
      });

      results.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
      setAttendanceData(results);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!selectedGroup) return attendanceData;
    return attendanceData.filter((emp) => {
      const employee = employees.find((e) => e.id === emp.employeeId);
      return employee;
    });
  }, [attendanceData, selectedGroup, employees]);

  const summaryStats = useMemo(() => {
    if (filteredData.length === 0)
      return {
        totalEmployees: 0,
        avgAttendance: 0,
        totalAbsences: 0,
        totalOvertime: 0,
      };
    const totalEmployees = filteredData.length;
    const avgAttendance = Math.round(
      filteredData.reduce((sum, d) => sum + d.attendanceRate, 0) /
        totalEmployees,
    );
    const totalAbsences = filteredData.reduce((sum, d) => sum + d.absences, 0);
    const totalOvertime = filteredData.reduce(
      (sum, d) => sum + d.overtimeHours,
      0,
    );
    return {
      totalEmployees,
      avgAttendance,
      totalAbsences,
      totalOvertime: Math.round(totalOvertime * 100) / 100,
    };
  }, [filteredData]);

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600 bg-green-50";
    if (rate >= 75) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const handleExportXLS = () => {
    const wb = XLSX.utils.book_new();

    const data = filteredData.map((d) => ({
      "Employee Code": d.employeeCode,
      Name: d.employeeName,
      "Days Worked": d.daysWorked,
      "Total Days": d.totalDaysInPeriod,
      Absences: d.absences,
      "Late Hours": d.lateHours,
      "Overtime Hours": d.overtimeHours,
      "Attendance Rate (%)": d.attendanceRate,
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 15 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 18 },
    ];
    ws["!cols"] = colWidths;

    const range = XLSX.utils.decode_range(ws["!ref"] || "");
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: 7 });
      const cell = ws[cellAddr];
      if (cell && cell.v !== undefined) {
        const rate = cell.v as number;
        if (rate >= 90) {
          cell.s = {
            fill: { fgColor: { rgb: "C6EFCE" } },
            font: { color: { rgb: "006100" } },
          };
        } else if (rate >= 75) {
          cell.s = {
            fill: { fgColor: { rgb: "FFEB9C" } },
            font: { color: { rgb: "9C5700" } },
          };
        } else {
          cell.s = {
            fill: { fgColor: { rgb: "FFC7CE" } },
            font: { color: { rgb: "9C0006" } },
          };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
    XLSX.writeFile(wb, `Attendance_Report_${MONTH_NAMES[month]}_${year}.xlsx`);
  };

  const handleExportCSV = () => {
    const headers = [
      "Employee Code",
      "Name",
      "Days Worked",
      "Total Days",
      "Absences",
      "Late Hours",
      "Overtime Hours",
      "Attendance Rate (%)",
    ];
    const rows = filteredData.map((d) => [
      d.employeeCode,
      d.employeeName,
      d.daysWorked,
      d.totalDaysInPeriod,
      d.absences,
      d.lateHours,
      d.overtimeHours,
      d.attendanceRate,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Attendance_Report_${MONTH_NAMES[month]}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  if (!canView("reports", "attendance"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Report</h1>
        {hasGenerated && filteredData.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={handleExportXLS}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export XLS
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        )}
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={i} value={i}>
                    {m}
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
            {groups.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee Group
                </label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={generateReport} disabled={loading}>
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasGenerated && (
        <>
          {filteredData.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500 py-8">
                  No data found for the selected period.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">
                      Total Employees Tracked
                    </div>
                    <div className="text-2xl font-bold">
                      {summaryStats.totalEmployees}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">
                      Average Attendance Rate
                    </div>
                    <div className="text-2xl font-bold">
                      {summaryStats.avgAttendance}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Absences</div>
                    <div className="text-2xl font-bold">
                      {summaryStats.totalAbsences}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">
                      Total Overtime Hours
                    </div>
                    <div className="text-2xl font-bold">
                      {summaryStats.totalOvertime}h
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="print:shadow-none">
                <CardHeader className="print:pb-2">
                  <CardTitle>
                    Attendance Details - {MONTH_NAMES[month]} {year}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 print:bg-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                            Employee Code
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                            Days Worked
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                            Total Days
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                            Absences
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                            Late Hours
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                            OT Hours
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                            Attendance Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredData.map((d, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 print:hover:bg-transparent"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {d.employeeCode}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {d.employeeName}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {d.daysWorked}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-500">
                              {d.totalDaysInPeriod}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {d.absences}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {d.lateHours}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {d.overtimeHours}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getAttendanceColor(d.attendanceRate)}`}
                              >
                                {d.attendanceRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
