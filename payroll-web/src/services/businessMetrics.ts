/**
 * Custom Business Metrics Dashboard
 *
 * Collects and exposes business metrics for:
 * - Payroll processing volume and duration
 * - Active employee counts
 * - Report generation stats
 * - Error rates by feature area
 *
 * Data can be consumed by Sentry dashboards, custom analytics, or in-app views.
 */
import * as Sentry from "@sentry/react";

export type MetricCategory =
  | "payroll"
  | "employee"
  | "dtr"
  | "report"
  | "auth"
  | "system";

export interface BusinessMetric {
  category: MetricCategory;
  name: string;
  value: number;
  unit: "count" | "duration_ms" | "percentage" | "currency";
  tags?: Record<string, string>;
  timestamp: number;
}

const metricsBuffer: BusinessMetric[] = [];
const FLUSH_INTERVAL = 60000; // 1 minute
let flushTimer: ReturnType<typeof setInterval> | null = null;

function startFlushTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flushMetrics();
  }, FLUSH_INTERVAL);
}

/**
 * Record a business metric for dashboard visualization
 */
export function recordMetric(
  category: MetricCategory,
  name: string,
  value: number,
  unit: BusinessMetric["unit"] = "count",
  tags?: Record<string, string>,
) {
  const metric: BusinessMetric = {
    category,
    name,
    value,
    unit,
    tags,
    timestamp: Date.now(),
  };

  metricsBuffer.push(metric);
  startFlushTimer();

  // Also send to Sentry as breadcrumb for context
  Sentry.addBreadcrumb({
    category: `metric.${category}`,
    message: `${name}: ${value} ${unit}`,
    data: { category, value, unit, tags },
    level: "info",
  });
}

/**
 * Flush buffered metrics to Sentry as messages
 */
export function flushMetrics() {
  if (metricsBuffer.length === 0) return;

  // Group by category for summary reporting
  const grouped = metricsBuffer.reduce(
    (acc, m) => {
      const key = `${m.category}.${m.name}`;
      if (!acc[key]) {
        acc[key] = { count: 0, total: 0, unit: m.unit };
      }
      acc[key].count++;
      acc[key].total += m.value;
      return acc;
    },
    {} as Record<string, { count: number; total: number; unit: string }>,
  );

  // Send summary as Sentry message
  const summary = Object.entries(grouped)
    .map(([key, val]) => `${key}: avg=${(val.total / val.count).toFixed(1)} ${val.unit} (n=${val.count})`)
    .join("\n");

  Sentry.captureMessage(`Business Metrics Summary\n${summary}`, "info");

  metricsBuffer.length = 0;
}

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    flushMetrics();
    if (flushTimer) clearInterval(flushTimer);
  });
}

// ============================================================
// High-level metric recording helpers
// ============================================================

/** Record a payroll was created */
export function recordPayrollCreated(companyId: string, employeeCount: number) {
  recordMetric("payroll", "payroll_created", 1, "count", { companyId });
  recordMetric("payroll", "payroll_employees", employeeCount, "count", { companyId });
}

/** Record payroll processing time */
export function recordPayrollProcessingTime(
  durationMs: number,
  payrollId: string,
) {
  recordMetric("payroll", "processing_time", durationMs, "duration_ms", {
    payrollId,
  });
}

/** Record employee changes */
export function recordEmployeeChange(
  action: "created" | "updated" | "deleted",
  companyId: string,
) {
  recordMetric("employee", `employee_${action}`, 1, "count", { companyId });
}

/** Record report generation */
export function recordReportGenerated(
  reportType: string,
  durationMs: number,
) {
  recordMetric("report", "report_generated", 1, "count", { reportType });
  recordMetric("report", "report_generation_time", durationMs, "duration_ms", {
    reportType,
  });
}

/** Record DTR operations */
export function recordDtrOperation(
  operation: string,
  companyId: string,
  employeeCount: number,
) {
  recordMetric("dtr", `dtr_${operation}`, 1, "count", { companyId });
  recordMetric("dtr", "dtr_employees_affected", employeeCount, "count", {
    companyId,
  });
}

/** Record authentication events */
export function recordAuthEvent(action: "login" | "logout" | "failed_login") {
  recordMetric("auth", `auth_${action}`, 1, "count");
}
