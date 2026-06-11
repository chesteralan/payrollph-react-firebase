/**
 * Sentry performance monitoring for key business transactions
 *
 * Adds custom instrumentation for critical user workflows:
 * payroll processing, DTR operations, employee management, report generation.
 */
import * as Sentry from "@sentry/react";

/**
 * Start a performance transaction for a key business operation
 * Used to track duration of critical workflows
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startBrowserTracingNavigationSpan
    ? Sentry.startBrowserTracingNavigationSpan({
        name,
        attributes: { operation: op },
      })
    : Sentry.startInactiveTransaction
      ? Sentry.startInactiveTransaction({ name, op })
      : null;
}

/**
 * Payroll processing — full lifecycle tracking
 */
export const PayrollTransactions = {
  createPayroll: () => startTransaction("payroll.create", "payroll"),
  processPayroll: () => startTransaction("payroll.process", "payroll"),
  lockPayroll: () => startTransaction("payroll.lock", "payroll"),
  publishPayroll: () => startTransaction("payroll.publish", "payroll"),
  clonePayroll: () => startTransaction("payroll.clone", "payroll"),
  generateOutput: (type: string) =>
    startTransaction(`payroll.output.${type}`, "payroll"),
};

/**
 * Employee management transaction tracking
 */
export const EmployeeTransactions = {
  createEmployee: () => startTransaction("employee.create", "employee"),
  updateEmployee: () => startTransaction("employee.update", "employee"),
  bulkImport: () => startTransaction("employee.bulk-import", "employee"),
  deleteEmployee: () => startTransaction("employee.delete", "employee"),
};

/**
 * DTR / Calendar transaction tracking
 */
export const DtrTransactions = {
  bulkEdit: () => startTransaction("dtr.bulk-edit", "dtr"),
  processAttendance: () => startTransaction("dtr.attendance", "dtr"),
  approveOvertime: () => startTransaction("dtr.overtime-approval", "dtr"),
  exportDtr: () => startTransaction("dtr.export", "dtr"),
};

/**
 * Report generation transaction tracking
 */
export const ReportTransactions = {
  generateReport: (type: string) =>
    startTransaction(`report.generate.${type}`, "report"),
  exportPdf: () => startTransaction("report.export-pdf", "report"),
  exportXls: () => startTransaction("report.export-xls", "report"),
  scheduleReport: () => startTransaction("report.schedule", "report"),
};

/**
 * Authentication flow tracking
 */
export const AuthTransactions = {
  login: () => startTransaction("auth.login", "auth"),
  logout: () => startTransaction("auth.logout", "auth"),
  passwordReset: () => startTransaction("auth.password-reset", "auth"),
  twoFactorAuth: () => startTransaction("auth.2fa", "auth"),
};

/**
 * Set custom tags for grouping and filtering
 */
export const setBusinessTags = (tags: Record<string, string>) => {
  Sentry.setTags(tags);
};

/**
 * Set the current company context for business metric attribution
 */
export const setCompanyContext = (companyId: string, companyName: string) => {
  Sentry.setTag("company_id", companyId);
  Sentry.setTag("company_name", companyName);
  Sentry.setExtra("current_company", { id: companyId, name: companyName });
};

/**
 * Track a business metric (e.g., "payrolls_created_today")
 * Sentry doesn't natively track custom metrics, but we can use
 * tags + breadcrumbs for visibility
 */
export const trackBusinessMetric = (
  metricName: string,
  value: number,
  unit: string = "count",
) => {
  Sentry.addBreadcrumb({
    category: "business-metric",
    message: `${metricName}: ${value} ${unit}`,
    level: "info",
    data: { metricName, value, unit },
  });
};
