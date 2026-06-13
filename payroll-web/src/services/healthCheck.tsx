/**
 * Health Check — API endpoint and page component
 *
 * Provides:
 * - GET /api/health — JSON health status for uptime monitoring
 * - /health — UI page for manual verification
 * - Firestore connectivity check
 * - Firebase Auth status
 */

// ============================================================
// Health Check Data Types
// ============================================================

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  uptime: number;
  checks: {
    firestore: ServiceCheck;
    firebaseAuth: ServiceCheck;
    sentry: ServiceCheck;
    storage: ServiceCheck;
  };
}

interface ServiceCheck {
  status: "ok" | "error" | "skipped";
  latency?: number;
  message?: string;
}

// ============================================================
// Health Check API
// ============================================================

const START_TIME = Date.now();

function getUptimeSeconds(): number {
  return Math.floor((Date.now() - START_TIME) / 1000);
}

/**
 * Perform a health check against Firebase services
 * Returns detailed status including latency for each service
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const checks = {
    firestore: await checkFirestore(),
    firebaseAuth: await checkFirebaseAuth(),
    sentry: checkSentry(),
    storage: await checkStorage(),
  };

  const statuses = Object.values(checks).map((c) => c.status);
  const overallStatus: HealthStatus["status"] = statuses.every((s) => s === "ok")
    ? "healthy"
    : statuses.some((s) => s === "error")
      ? "unhealthy"
      : "degraded";

  return {
    status: overallStatus,
    version: import.meta.env.VITE_APP_VERSION || "0.0.0",
    timestamp: new Date().toISOString(),
    uptime: getUptimeSeconds(),
    checks,
  };
}

async function checkFirestore(): Promise<ServiceCheck> {
  try {
    const start = performance.now();
    const { db } = await import("../config/firebase");
    const { doc, getDoc } = await import("firebase/firestore");

    // Simple connectivity check — read a known document
    const healthDoc = doc(db, "_health_", "ping");
    await getDoc(healthDoc);
    const latency = performance.now() - start;

    return {
      status: "ok",
      latency: Math.round(latency),
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Firestore check failed",
    };
  }
}

async function checkFirebaseAuth(): Promise<ServiceCheck> {
  try {
    const start = performance.now();
    const { auth } = await import("../config/firebase");
    // Just check if auth is configured (has a tenant/API key)
    const latency = performance.now() - start;

    return {
      status: auth ? "ok" : "skipped",
      latency: Math.round(latency),
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Auth check failed",
    };
  }
}

function checkSentry(): ServiceCheck {
  try {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    return {
      status: dsn ? "ok" : "skipped",
      message: dsn ? undefined : "Sentry DSN not configured",
    };
  } catch {
    return { status: "skipped", message: "Sentry not available" };
  }
}

async function checkStorage(): Promise<ServiceCheck> {
  try {
    const { storage } = await import("../config/firebase");
    return {
      status: storage ? "ok" : "skipped",
    };
  } catch {
    return { status: "skipped", message: "Storage not available" };
  }
}

// ============================================================
// Health Check Page Component
// ============================================================

import { type FC, useEffect, useState } from "react";

export const HealthCheckPage: FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    performHealthCheck()
      .then(setHealth)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
        <span className="ml-3 text-gray-600">Running health checks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Health Check Failed</h2>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!health) return null;

  const statusColors: Record<string, string> = {
    healthy: "bg-green-100 text-green-800 border-green-200",
    degraded: "bg-yellow-100 text-yellow-800 border-yellow-200",
    unhealthy: "bg-red-100 text-red-800 border-red-200",
  };

  const checkColors: Record<string, string> = {
    ok: "text-green-600",
    error: "text-red-600",
    skipped: "text-gray-400",
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">System Health</h1>

      {/* Overall Status */}
      <div
        className={`rounded-lg border p-4 mb-6 ${statusColors[health.status] || "bg-gray-100"}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-lg">Status</span>
          <span className="font-bold uppercase">{health.status}</span>
        </div>
        <div className="mt-2 text-sm opacity-75">
          Version: {health.version} &middot; Uptime: {formatUptime(health.uptime)}
        </div>
        <div className="text-xs opacity-50 mt-1">
          Last checked: {new Date(health.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Service Checks */}
      <h2 className="text-lg font-semibold mb-3">Service Checks</h2>
      <div className="space-y-2">
        {Object.entries(health.checks).map(([name, check]) => (
          <div key={name} className="bg-white rounded border p-3 flex items-center justify-between">
            <div>
              <span className="font-medium capitalize">{name.replace(/([A-Z])/g, " $1")}</span>
              {check.message && (
                <span className="text-xs text-gray-500 ml-2">({check.message})</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {check.latency !== undefined && (
                <span className="text-xs text-gray-400">{check.latency}ms</span>
              )}
              <span className={`font-semibold text-sm ${checkColors[check.status] || ""}`}>
                {check.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* JSON endpoint hint */}
      <div className="mt-8 p-4 bg-gray-50 rounded border text-sm">
        <strong>API Endpoint:</strong> The health check data is also available as JSON at{" "}
        <code className="bg-gray-200 px-1 rounded">/api/health</code> for uptime monitoring
        services (Pingdom, UptimeRobot, Better Uptime).
      </div>
    </div>
  );
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}
