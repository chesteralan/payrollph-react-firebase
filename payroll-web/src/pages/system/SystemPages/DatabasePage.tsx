import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/useToast";
import { Download, Save } from "lucide-react";
import { COLLECTIONS } from "./SystemPages.constants";
import { CollectionStatsTable } from "./CollectionStatsTable";
import { BackupHistoryTable } from "./BackupHistoryTable";
import { VerificationResultsTable } from "./VerificationResultsTable";
import { DataCleanupSection } from "./DataCleanupSection";
import type { Backup, CleanupResult, VerificationResult } from "./DatabasePage.types";

export function DatabasePage() {
  const { canView, canAdd } = usePermissions();
  const { addToast } = useToast();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState("");
  const [cleanupResults, setCleanupResults] = useState<CleanupResult[]>([]);
  const [dtrMonths, setDtrMonths] = useState(6);
  const [softDeleteDays, setSoftDeleteDays] = useState(30);
  const [archiveYears, setArchiveYears] = useState(2);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const counts: Record<string, number> = {};
    await Promise.all(
      COLLECTIONS.map(async (col) => {
        try {
          const snap = await getDocs(collection(db, col));
          counts[col] = snap.size;
        } catch {
          counts[col] = 0;
        }
      }),
    );
    setStats(counts);
    setLoading(false);
  }, []);

  const fetchBackups = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "backups"), orderBy("timestamp", "desc")),
      );
      setBackups(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          timestamp: d.data().timestamp?.toDate(),
        })) as never[],
      );
    } catch {
      /* empty - backup list may not exist */
    }
  }, []);

  useEffect(() => {
     
    fetchStats();
    fetchBackups();
     
  }, [fetchStats, fetchBackups]);

  const exportCollection = async (collectionName: string) => {
    setExportLoading(collectionName);
    try {
      const snap = await getDocs(collection(db, collectionName));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${collectionName}_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: "success", title: `Exported ${collectionName}` });
    } catch (e) {
      addToast({ type: "error", title: `Export failed: ${e}` });
    }
    setExportLoading("");
  };

  const exportAllData = async () => {
    setExportLoading("all");
    try {
      const allData: Record<string, unknown[]> = {};
      await Promise.all(
        COLLECTIONS.map(async (col) => {
          const snap = await getDocs(collection(db, col));
          allData[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }),
      );
      const json = JSON.stringify(allData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `full_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: "success", title: "Full export complete" });
    } catch (e) {
      addToast({ type: "error", title: `Export failed: ${e}` });
    }
    setExportLoading("");
  };

  const createBackup = async () => {
    setBackupLoading(true);
    try {
      const allData: Record<string, unknown[]> = {};
      let totalDocs = 0;
      await Promise.all(
        COLLECTIONS.map(async (col) => {
          const snap = await getDocs(collection(db, col));
          allData[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          totalDocs += snap.size;
        }),
      );
      const json = JSON.stringify(allData);
      const size = new Blob([json]).size;
      await addDoc(collection(db, "backups"), {
        timestamp: new Date(),
        collections: COLLECTIONS,
        totalDocuments: totalDocs,
        size,
        status: "completed",
      });
      await exportAllData();
      fetchBackups();
      addToast({ type: "success", title: "Backup created" });
    } catch (e) {
      addToast({ type: "error", title: `Backup failed: ${e}` });
    }
    setBackupLoading(false);
  };

  const runVerification = async () => {
    setVerifying(true);
    setVerificationResults([]);
    const results: VerificationResult[] = [];

    try {
      const [
        employeesSnap,
        namesSnap,
        payrollSnap,
        payrollEmpsSnap,
        payrollGroupsSnap,
        salariesSnap,
      ] = await Promise.all([
        getDocs(collection(db, "employees")),
        getDocs(collection(db, "names")),
        getDocs(collection(db, "payroll")),
        getDocs(collection(db, "payroll_employees")),
        getDocs(collection(db, "payroll_groups")),
        getDocs(collection(db, "salaries")),
      ]);

      const employees = employeesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Array<{
        id: string;
        nameId?: string;
        employeeCode?: string;
        firstName?: string;
        lastName?: string;
      }>;
      const names = namesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const payroll = payrollSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const payrollEmps = payrollEmpsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Array<{ id: string; payrollId?: string }>;
      const payrollGroups = payrollGroupsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Array<{ id: string; payrollId?: string; groupId?: string }>;
      const salaries = salariesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Array<{ id: string; employeeId?: string }>;

      const nameIds = new Set(names.map((n) => n.id));

      const orphanedEmployees = employees.filter(
        (e) => e.nameId && !nameIds.has(e.nameId),
      );
      results.push({
        name: "Orphaned Employees",
        status: orphanedEmployees.length > 0 ? "Fail" : "Pass",
        details:
          orphanedEmployees.length > 0
            ? `Employees with invalid nameId: ${orphanedEmployees.map((e) => e.employeeCode || e.id).join(", ")}`
            : "All employees have valid name references",
        issueCount: orphanedEmployees.length,
      });

      const payrollIds = new Set(payroll.map((p) => p.id));
      const orphanedPayrollEmps = payrollEmps.filter(
        (pe) => pe.payrollId && !payrollIds.has(pe.payrollId),
      );
      results.push({
        name: "Orphaned Payroll Employees",
        status: orphanedPayrollEmps.length > 0 ? "Fail" : "Pass",
        details:
          orphanedPayrollEmps.length > 0
            ? `${orphanedPayrollEmps.length} payroll_employees with invalid payrollId`
            : "All payroll_employees have valid payroll references",
        issueCount: orphanedPayrollEmps.length,
      });

      const groupIds = new Set(
        (await getDocs(collection(db, "employee_groups"))).docs.map(
          (d) => d.id,
        ),
      );
      const invalidGroups = payrollGroups.filter(
        (pg) => pg.groupId && !groupIds.has(pg.groupId),
      );
      results.push({
        name: "Invalid Payroll Group References",
        status: invalidGroups.length > 0 ? "Warning" : "Pass",
        details:
          invalidGroups.length > 0
            ? `${invalidGroups.length} payroll_groups with invalid groupId`
            : "All payroll_groups have valid group references",
        issueCount: invalidGroups.length,
      });

      const employeeCodes = employees
        .map((e) => e.employeeCode)
        .filter(Boolean) as string[];
      const duplicateCodes = employeeCodes.filter(
        (code, idx) => employeeCodes.indexOf(code) !== idx,
      );
      const uniqueDuplicates = [...new Set(duplicateCodes)];
      results.push({
        name: "Duplicate Employee Codes",
        status: uniqueDuplicates.length > 0 ? "Fail" : "Pass",
        details:
          uniqueDuplicates.length > 0
            ? `Duplicate codes: ${uniqueDuplicates.join(", ")}`
            : "No duplicate employee codes found",
        issueCount: uniqueDuplicates.length,
      });

      const fullNames = employees
        .map((e) =>
          `${e.firstName || ""} ${e.lastName || ""}`.trim().toLowerCase(),
        )
        .filter(Boolean);
      const duplicateNames = fullNames.filter(
        (name, idx) => fullNames.indexOf(name) !== idx,
      );
      const uniqueNameDuplicates = [...new Set(duplicateNames)];
      results.push({
        name: "Duplicate Employee Names",
        status: uniqueNameDuplicates.length > 0 ? "Warning" : "Pass",
        details:
          uniqueNameDuplicates.length > 0
            ? `${uniqueNameDuplicates.length} duplicate names found`
            : "No duplicate employee names found",
        issueCount: uniqueNameDuplicates.length,
      });

      const missingFields = employees.filter(
        (e) => !e.firstName || !e.lastName || !e.employeeCode,
      );
      results.push({
        name: "Missing Required Fields (Employees)",
        status: missingFields.length > 0 ? "Warning" : "Pass",
        details:
          missingFields.length > 0
            ? `${missingFields.length} employees missing required fields`
            : "All employees have required fields",
        issueCount: missingFields.length,
      });

      const missingSalaries = employees.filter(
        (e) => !salaries.some((s) => s.employeeId === e.id),
      );
      results.push({
        name: "Employees Without Salary Records",
        status: missingSalaries.length > 0 ? "Warning" : "Pass",
        details:
          missingSalaries.length > 0
            ? `${missingSalaries.length} employees without salary records`
            : "All employees have salary records",
        issueCount: missingSalaries.length,
      });

      setVerificationResults(results);
      addToast({ type: "success", title: "Verification complete" });
    } catch (e) {
      addToast({ type: "error", title: `Verification failed: ${e}` });
    }
    setVerifying(false);
  };

  const runCleanup = async (operation: string) => {
    setCleanupLoading(operation);
    const startTime = Date.now();
    let count = 0;
    try {
      const batch = writeBatch(db);
      let processed = 0;

      if (operation === "orphaned") {
        const [employeesSnap, namesSnap, payrollSnap] = await Promise.all([
          getDocs(collection(db, "employees")),
          getDocs(collection(db, "names")),
          getDocs(collection(db, "payroll")),
          getDocs(collection(db, "payroll_employees")),
        ]);
        const names = namesSnap.docs.map((d) => d.id);
        const nameSet = new Set(names);
        const payroll = payrollSnap.docs.map((d) => d.id);
        const payrollSet = new Set(payroll);

        employeesSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.nameId && !nameSet.has(data.nameId)) {
            batch.delete(d.ref);
            processed++;
          }
        });

        const payrollEmpsSnap = await getDocs(
          collection(db, "payroll_employees"),
        );
        payrollEmpsSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.payrollId && !payrollSet.has(data.payrollId)) {
            batch.delete(d.ref);
            processed++;
          }
        });
      } else if (operation === "duplicates") {
        const snap = await getDocs(collection(db, "names"));
        const names = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Array<{ id: string; name?: string }>;
        const seen = new Set<string>();
        const toDelete: string[] = [];
        names.forEach((n) => {
          const nameKey = (n.name || "").toLowerCase().trim();
          if (nameKey && seen.has(nameKey)) {
            toDelete.push(n.id);
          } else if (nameKey) {
            seen.add(nameKey);
          }
        });
        toDelete.forEach((id) => {
          batch.delete(doc(db, "names", id));
          processed++;
        });
      } else if (operation === "oldDtr") {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - dtrMonths);
        const snap = await getDocs(collection(db, "dtr_entries"));
        snap.docs.forEach((d) => {
          const data = d.data();
          const entryDate = data.date?.toDate
            ? data.date.toDate()
            : new Date(data.date);
          if (entryDate < cutoff) {
            batch.delete(d.ref);
            processed++;
          }
        });
      } else if (operation === "expiredLeave") {
        const snap = await getDocs(collection(db, "leave_applications"));
        const now = new Date();
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.status === "approved" || data.status === "pending") {
            const endDate = data.endDate?.toDate
              ? data.endDate.toDate()
              : new Date(data.endDate);
            if (endDate && endDate < now) {
              batch.update(d.ref, { status: "expired", updatedAt: new Date() });
              processed++;
            }
          }
        });
      } else if (operation === "softDeleted") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - softDeleteDays);
        const collections = [
          "employees",
          "names",
          "earnings",
          "deductions",
          "benefits",
          "payroll",
        ];
        await Promise.all(
          collections.map(async (col) => {
            const snap = await getDocs(collection(db, col));
            snap.docs.forEach((d) => {
              const data = d.data();
              if (data.isDeleted && data.deletedAt?.toDate() < cutoff) {
                batch.delete(d.ref);
                processed++;
              }
            });
          }),
        );
      } else if (operation === "archivePayroll") {
        const cutoffYear = new Date().getFullYear() - archiveYears;
        const payrollSnap = await getDocs(collection(db, "payroll"));
        const toArchive: string[] = [];

        payrollSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.year && data.year < cutoffYear) {
            toArchive.push(d.id);
          }
        });

        for (const payrollId of toArchive) {
          const payrollRef = doc(db, "payroll", payrollId);
          batch.update(payrollRef, {
            isArchived: true,
            archivedAt: new Date(),
          });
          processed++;

          const relatedCollections = [
            { col: "payroll_employees", field: "payrollId" },
            { col: "payroll_employee_earnings", field: "payrollId" },
            { col: "payroll_employee_deductions", field: "payrollId" },
            { col: "payroll_employee_benefits", field: "payrollId" },
            { col: "payroll_employee_salaries", field: "payrollId" },
          ];

          for (const { col, field } of relatedCollections) {
            const snap = await getDocs(
              query(collection(db, col), where(field, "==", payrollId)),
            );
            snap.docs.forEach((d) => {
              batch.update(d.ref, { isArchived: true, archivedAt: new Date() });
              processed++;
            });
          }
        }
      }

      if (processed > 0) {
        await batch.commit();
      }
      count = processed;
      const timeTaken = Date.now() - startTime;
      setCleanupResults((prev) => [
        ...prev,
        { name: operation, count, time: timeTaken, success: true },
      ]);
      addToast({
        type: "success",
        title: `Cleanup complete: ${count} records processed`,
      });
      fetchStats();
    } catch (e) {
      const timeTaken = Date.now() - startTime;
      setCleanupResults((prev) => [
        ...prev,
        { name: operation, count: 0, time: timeTaken, success: false },
      ]);
      addToast({ type: "error", title: `Cleanup failed: ${e}` });
    }
    setCleanupLoading("");
  };

  const totalDocuments = Object.values(stats).reduce((a, b) => a + b, 0);

  if (!canView("system", "database"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Database Management
        </h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={exportAllData}
            disabled={!!exportLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportLoading === "all" ? "Exporting..." : "Export All Data"}
          </Button>
          {canAdd("system", "database") && (
            <Button onClick={createBackup} disabled={backupLoading}>
              <Save className="w-4 h-4 mr-2" />
              {backupLoading ? "Creating Backup..." : "Create Backup"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">
              {COLLECTIONS.length}
            </div>
            <div className="text-sm text-gray-500">Collections</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "..." : totalDocuments}
            </div>
            <div className="text-sm text-gray-500">Total Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">
              {backups.length}
            </div>
            <div className="text-sm text-gray-500">Backups Created</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <select
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
            >
              <option value="">Select a collection...</option>
              {COLLECTIONS.map((c) => (
                <option key={c} value={c}>
                  {c} ({stats[c] || 0})
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              disabled={!selectedCollection || !!exportLoading}
              onClick={() =>
                selectedCollection && exportCollection(selectedCollection)
              }
            >
              <Download className="w-4 h-4 mr-2" />
              {exportLoading ? "Exporting..." : "Export"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <CollectionStatsTable
        stats={stats}
        loading={loading}
        exportLoading={exportLoading}
        exportCollection={exportCollection}
      />

      {canView("system", "database") && (
        <BackupHistoryTable backups={backups} />
      )}

      <VerificationResultsTable
        results={verificationResults}
        verifying={verifying}
        onRunVerification={runVerification}
      />

      <DataCleanupSection
        dtrMonths={dtrMonths}
        onDtrMonthsChange={setDtrMonths}
        softDeleteDays={softDeleteDays}
        onSoftDeleteDaysChange={setSoftDeleteDays}
        archiveYears={archiveYears}
        onArchiveYearsChange={setArchiveYears}
        runCleanup={runCleanup}
        cleanupLoading={cleanupLoading}
        cleanupResults={cleanupResults}
      />
    </div>
  );
}
