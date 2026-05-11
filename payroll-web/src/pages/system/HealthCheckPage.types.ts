export interface HealthCheckResult {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: string;
  responseTime?: number;
}

export interface CollectionHealth {
  name: string;
  count: number;
  status: "good" | "warning" | "error";
}
