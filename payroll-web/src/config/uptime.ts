/**
 * Uptime Monitoring Configuration
 *
 * This file defines the uptime monitoring checks for the application.
 * Designed for use with services like UptimeRobot, Better Uptime, or Pingdom.
 *
 * Configuration is environment-agnostic; deploy-specific URLs are set via env.
 */

export interface UptimeCheck {
  name: string;
  url: string;
  method: "GET" | "HEAD";
  intervalMinutes: number;
  timeoutSeconds: number;
  expectedStatus: number;
  keywordCheck?: string;
  locations?: string[];
}

export interface UptimeAlert {
  type: "email" | "slack" | "pagerduty" | "webhook";
  target: string;
  notifyOn: "down" | "up" | "both";
}

export interface UptimeConfig {
  checks: UptimeCheck[];
  alerts: UptimeAlert[];
  escalationMinutes: number;
}

const BASE_URL =
  (import.meta.env.VITE_APP_URL as string) ||
  (import.meta.env.VITE_DEPLOY_URL as string) ||
  "http://localhost:5173";

export const UPTIME_CONFIG: UptimeConfig = {
  checks: [
    {
      name: "Homepage",
      url: `${BASE_URL}/`,
      method: "GET",
      intervalMinutes: 5,
      timeoutSeconds: 30,
      expectedStatus: 200,
      keywordCheck: "PayrollPH",
    },
    {
      name: "Health Check",
      url: `${BASE_URL}/api/health`,
      method: "GET",
      intervalMinutes: 1,
      timeoutSeconds: 10,
      expectedStatus: 200,
      keywordCheck: "status",
    },
    {
      name: "Login Page",
      url: `${BASE_URL}/login`,
      method: "GET",
      intervalMinutes: 5,
      timeoutSeconds: 30,
      expectedStatus: 200,
    },
    {
      name: "API Readiness",
      url: `${BASE_URL}/api/health/ready`,
      method: "GET",
      intervalMinutes: 2,
      timeoutSeconds: 10,
      expectedStatus: 200,
    },
  ],
  alerts: [
    {
      type: "slack",
      target: "#monitoring-alerts",
      notifyOn: "down",
    },
    {
      type: "email",
      target: "admin@payrollph.com",
      notifyOn: "both",
    },
  ],
  escalationMinutes: 15,
};

export default UPTIME_CONFIG;
