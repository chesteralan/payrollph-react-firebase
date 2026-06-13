// Health Check — API endpoint functions
// Provides GET /api/health JSON health status for uptime monitoring

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

export { checkFirestore, checkFirebaseAuth, checkSentry, checkStorage };
