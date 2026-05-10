import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  limit,
} from "firebase/firestore";
import { ref, listAll, getMetadata } from "firebase/storage";
import { db, storage } from "../../config/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { usePermissions } from "../../hooks/usePermissions";
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  HardDrive,
  Users,
  Server,
  Clock,
} from "lucide-react";

import type { HealthCheckResult, CollectionHealth } from "./HealthCheckPage.types";

const MAJOR_COLLECTIONS = [
  "names",
  "employees",
  "employee_groups",
  "employee_positions",
  "employee_areas",
  "earnings",
  "deductions",
  "benefits",
  "payroll",
  "payroll_templates",
  "payroll_inclusive_dates",
  "payroll_groups",
  "payroll_employees",
  "salaries",
  "dtr_entries",
  "companies",
  "user_accounts",
  "system_audit",
  "backups",
];

const COMMON_QUERIES = [
  {
    name: "Payroll by date range",
    query: "payroll (orderBy date, where companyId)",
    needsComposite: true,
  },
  {
    name: "Employees by company",
    query: "employees (where companyId, orderBy lastName)",
    needsComposite: true,
  },
  {
    name: "Audit log by timestamp",
    query: "system_audit (orderBy timestamp desc)",
    needsComposite: false,
  },
  {
    name: "Payroll by status",
    query: "payroll (where status, orderBy date)",
    needsComposite: true,
  },
  {
    name: "DTR by employee and date",
    query: "dtr_entries (where employeeId, where date)",
    needsComposite: true,
  },
];

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "pass" || status === "good")
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  if (status === "fail" || status === "error")
    return <XCircle className="w-5 h-5 text-red-500" />;
  return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
};

export function HealthCheckPage() {
  const { canView } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [collectionHealth, setCollectionHealth] = useState<CollectionHealth[]>(
    [],
  );
  const [storageHealth, setStorageHealth] = useState<{
    accessible: boolean;
    fileCount: number;
    totalSize: number;
    error?: string;
  }>({ accessible: false, fileCount: 0, totalSize: 0 });
  const [authHealth, setAuthHealth] = useState<{
    userCount: number;
    error?: string;
  }>({ userCount: 0 });
  const [overallScore, setOverallScore] = useState<{
    status: "good" | "warning" | "error";
    passCount: number;
    failCount: number;
    warningCount: number;
  }>({ status: "good", passCount: 0, failCount: 0, warningCount: 0 });

  const checkFirebaseConnection = async (): Promise<HealthCheckResult> => {
    const start = performance.now();
    try {
      const testDoc = { test: true, timestamp: new Date(), _healthCheck: true };
      const docRef = await addDoc(collection(db, "_health_check"), testDoc);
      const responseTime = Math.round(performance.now() - start);

      await deleteDoc(doc(db, "_health_check", docRef.id));

      return {
        name: "Firebase Connection",
        status: "pass",
        message: "Connected and operational",
        details: `Successfully tested read/write operations`,
        responseTime,
      };
    } catch (error) {
      return {
        name: "Firebase Connection",
        status: "fail",
        message: "Connection failed",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: (error as any)?.message || "Unable to connect to Firestore",
      };
    }
  };

  const checkOnlineStatus = (): HealthCheckResult => {
    const online = navigator.onLine;
    return {
      name: "Network Status",
      status: online ? "pass" : "fail",
      message: online ? "Online" : "Offline",
      details: online
        ? "Browser reports network connectivity"
        : "Browser reports no network connectivity",
    };
  };

  const checkCollections = async (): Promise<{
    results: HealthCheckResult[];
    health: CollectionHealth[];
  }> => {
    const results: HealthCheckResult[] = [];
    const health: CollectionHealth[] = [];

    for (const col of MAJOR_COLLECTIONS) {
      try {
        const snap = await getDocs(query(collection(db, col), limit(10000)));
        const count = snap.size;

        let status: "good" | "warning" | "error" = "good";
        let resultStatus: "pass" | "fail" | "warning" = "pass";
        let message = `${count} document${count !== 1 ? "s" : ""}`;

        if (count === 0) {
          status = "warning";
          resultStatus = "warning";
          message += " (empty collection)";
        } else if (count >= 10000) {
          status = "error";
          resultStatus = "warning";
          message += " (large collection, may need optimization)";
        }

        health.push({ name: col, count, status });
        results.push({
          name: `Collection: ${col}`,
          status: resultStatus,
          message,
          details: `Collection has ${count} document${count !== 1 ? "s" : ""}`,
        });
      } catch (error) {
        health.push({ name: col, count: 0, status: "error" });
        results.push({
          name: `Collection: ${col}`,
          status: "fail",
          message: "Unable to access collection",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details: (error as any)?.message || "Check Firestore rules",
        });
      }
    }

    return { results, health };
  };

  const checkIndexes = (): HealthCheckResult[] => {
    return COMMON_QUERIES.map((q) => ({
      name: `Index: ${q.name}`,
      status: q.needsComposite ? "warning" : "pass",
      message: q.needsComposite
        ? "May require composite index"
        : "No composite index needed",
      details: q.query,
    }));
  };

  const checkStorage = async (): Promise<{
    result: HealthCheckResult;
    health: typeof storageHealth;
  }> => {
    try {
      const storageRef = ref(storage);
      await listAll(storageRef);

      let totalSize = 0;
      let fileCount = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countFiles = async (ref: any): Promise<void> => {
        const listResult = await listAll(ref);
        fileCount += listResult.items.length;

        for (const item of listResult.items) {
          try {
            const metadata = await getMetadata(item);
            totalSize += metadata.size || 0;
          } catch {
            /* metadata may not exist */
          }
        }

        for (const prefix of listResult.prefixes) {
          await countFiles(prefix);
        }
      };

      await countFiles(storageRef);

      const healthData = { accessible: true, fileCount, totalSize };
      return {
        result: {
          name: "Storage Bucket",
          status: "pass",
          message: `Accessible - ${fileCount} file${fileCount !== 1 ? "s" : ""}`,
          details: `Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        },
        health: healthData,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const healthData = {
        accessible: false,
        fileCount: 0,
        totalSize: 0,
        error: (error as any)?.message,
      };
      return {
        result: {
          name: "Storage Bucket",
          status: "warning",
          message: "Unable to access storage",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details:
            (error as any)?.message || "Check storage rules or configuration",
        },
        health: healthData,
      };
    }
  };

  const checkAuth = async (): Promise<{
    result: HealthCheckResult;
    health: typeof authHealth;
  }> => {
    try {
      const snap = await getDocs(query(collection(db, "user_accounts")));
      const healthData = { userCount: snap.size };
      return {
        result: {
          name: "Auth / Users",
          status: "pass",
          message: `${snap.size} user${snap.size !== 1 ? "s" : ""} registered`,
          details: `User accounts in user_accounts collection`,
        },
        health: healthData,
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const healthData = { userCount: 0, error: (error as any)?.message };
      return {
        result: {
          name: "Auth / Users",
          status: "warning",
          message: "Unable to fetch user count",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          details:
            (error as any)?.message ||
            "Check Firestore rules for user_accounts",
        },
        health: healthData,
      };
    }
  };

  const runHealthCheck = useCallback(async () => {
    setLoading(true);
    setLastChecked(new Date());

    const allResults: HealthCheckResult[] = [];

    const connectionResult = await checkFirebaseConnection();
    allResults.push(connectionResult);

    const onlineResult = checkOnlineStatus();
    allResults.push(onlineResult);

    const { results: collectionResults, health: collHealth } =
      await checkCollections();
    allResults.push(...collectionResults);
    setCollectionHealth(collHealth);

    const indexResults = checkIndexes();
    allResults.push(...indexResults);

    const { result: storageResult, health: storHealth } = await checkStorage();
    allResults.push(storageResult);
    setStorageHealth(storHealth);

    const { result: authResult, health: aHealth } = await checkAuth();
    allResults.push(authResult);
    setAuthHealth(aHealth);

    setResults(allResults);

    const passCount = allResults.filter((r) => r.status === "pass").length;
    const failCount = allResults.filter((r) => r.status === "fail").length;
    const warningCount = allResults.filter(
      (r) => r.status === "warning",
    ).length;

    let status: "good" | "warning" | "error" = "good";
    if (failCount > 0) status = "error";
    else if (warningCount > 0) status = "warning";

    setOverallScore({ status, passCount, failCount, warningCount });
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runHealthCheck();
  }, [runHealthCheck]);

  if (!canView("system", "database"))
    return <div className="text-center py-12 text-gray-500">Access denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-7 h-7 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              System Health Check
            </h1>
            {lastChecked && (
              <p className="text-sm text-gray-500">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <Button onClick={runHealthCheck} disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Checking..." : "Run Health Check"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {overallScore.passCount +
                    overallScore.failCount +
                    overallScore.warningCount}
                </div>
                <div className="text-sm text-gray-500">Total Checks</div>
              </div>
              <StatusIcon status={overallScore.status} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {overallScore.passCount}
                </div>
                <div className="text-sm text-gray-500">Passed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {overallScore.warningCount}
                </div>
                <div className="text-sm text-gray-500">Warnings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Overall Health: <StatusIcon status={overallScore.status} />
            <span
              className={`text-sm font-medium ${
                overallScore.status === "good"
                  ? "text-green-600"
                  : overallScore.status === "warning"
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {overallScore.status === "good"
                ? "Good"
                : overallScore.status === "warning"
                  ? "Needs Attention"
                  : "Critical"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border border-gray-100 rounded-md"
              >
                <StatusIcon status={result.status} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{result.name}</span>
                    {result.responseTime && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {result.responseTime}ms
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-400 mt-1">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Collection Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {collectionHealth.map((col) => (
                <div
                  key={col.name}
                  className="flex items-center justify-between p-2 border border-gray-100 rounded"
                >
                  <span className="text-sm font-mono">{col.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{col.count}</span>
                    <StatusIcon status={col.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Storage & Auth Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Firebase Storage</h4>
              <div className="flex items-center gap-2">
                <StatusIcon
                  status={storageHealth.accessible ? "pass" : "fail"}
                />
                <span className="text-sm">
                  {storageHealth.accessible
                    ? `${storageHealth.fileCount} files (${(storageHealth.totalSize / 1024 / 1024).toFixed(2)} MB)`
                    : "Not accessible"}
                </span>
              </div>
              {storageHealth.error && (
                <p className="text-xs text-red-500 mt-1">
                  {storageHealth.error}
                </p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Authentication</h4>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {authHealth.userCount} registered user
                  {authHealth.userCount !== 1 ? "s" : ""}
                </span>
              </div>
              {authHealth.error && (
                <p className="text-xs text-red-500 mt-1">{authHealth.error}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
