/**
 * Alerting Configuration for Critical Error Thresholds
 *
 * Defines alert rules, notification channels, and escalation policies.
 * Integrates with Sentry, Slack, PagerDuty, and email.
 */

export type AlertSeverity = "critical" | "warning" | "info";

export type NotificationChannel = "sentry" | "slack" | "pagerduty" | "email";

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  /** Error group from sentry.ts ERROR_GROUPS */
  errorGroup?: string;
  /** Threshold: minimum error count in the window */
  threshold: number;
  /** Time window in minutes */
  windowMinutes: number;
  severity: AlertSeverity;
  channels: NotificationChannel[];
  enabled: boolean;
}

export interface AlertingConfig {
  rules: AlertRule[];
  global: {
    /** Minimum interval between duplicate alerts (minutes) */
    cooldownMinutes: number;
    /** Whether alerts are enabled in development */
    enabledInDev: boolean;
    /** Default notification channels */
    defaultChannels: NotificationChannel[];
  };
}

export const ALERTING_CONFIG: AlertingConfig = {
  rules: [
    {
      id: "auth-spike",
      name: "Auth Error Spike",
      description:
        "Triggers when authentication errors exceed threshold in 5-minute window",
      errorGroup: "auth-error",
      threshold: 10,
      windowMinutes: 5,
      severity: "critical",
      channels: ["pagerduty", "slack", "email"],
      enabled: true,
    },
    {
      id: "firestore-errors",
      name: "Firestore Error Spike",
      description:
        "Triggers when Firestore read/write errors exceed threshold",
      errorGroup: "firestore-error",
      threshold: 20,
      windowMinutes: 5,
      severity: "critical",
      channels: ["pagerduty", "slack"],
      enabled: true,
    },
    {
      id: "payroll-failure",
      name: "Payroll Processing Failure",
      description:
        "Triggers when payroll computation errors are detected",
      errorGroup: "payroll-error",
      threshold: 5,
      windowMinutes: 10,
      severity: "critical",
      channels: ["pagerduty", "slack", "email"],
      enabled: true,
    },
    {
      id: "network-degradation",
      name: "Network Degradation",
      description:
        "Triggers when network errors spike, indicating possible outage",
      errorGroup: "network-error",
      threshold: 50,
      windowMinutes: 5,
      severity: "warning",
      channels: ["slack"],
      enabled: true,
    },
    {
      id: "permission-denied",
      name: "Permission Denied Spike",
      description:
        "Triggers when access denied errors spike, indicating possible misconfiguration",
      errorGroup: "permission-error",
      threshold: 15,
      windowMinutes: 10,
      severity: "warning",
      channels: ["slack", "email"],
      enabled: true,
    },
    {
      id: "validation-errors",
      name: "Validation Errors",
      description:
        "Triggers when validation errors exceed threshold, indicating possible UI bug",
      errorGroup: "validation-error",
      threshold: 30,
      windowMinutes: 10,
      severity: "warning",
      channels: ["slack"],
      enabled: true,
    },
  ],
  global: {
    cooldownMinutes: 15,
    enabledInDev: false,
    defaultChannels: ["sentry"],
  },
};

export default ALERTING_CONFIG;
