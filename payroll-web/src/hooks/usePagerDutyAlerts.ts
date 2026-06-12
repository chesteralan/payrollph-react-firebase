import { useCallback } from "react";

type Severity = "critical" | "high" | "medium" | "low";

interface AlertPayload {
  title: string;
  message: string;
  severity: Severity;
  source: string;
  metadata?: Record<string, unknown>;
}

export function usePagerDutyAlerts() {
  const sendAlert = useCallback(async (payload: AlertPayload) => {
    const webhookUrl = import.meta.env.VITE_PAGERDUTY_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("PagerDuty webhook URL not configured", payload);
      return;
    }

    try {
      const routingKey = import.meta.env.VITE_PAGERDUTY_ROUTING_KEY;
      const body = {
        routing_key: routingKey,
        event_action: "trigger",
        payload: {
          summary: payload.title,
          source: payload.source,
          severity: payload.severity,
          custom_details: payload.metadata || {},
        },
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("Failed to send PagerDuty alert:", err);
    }
  }, []);

  const acknowledgeAlert = useCallback(async (dedupKey: string) => {
    console.log("Alert acknowledged:", dedupKey);
  }, []);

  return { sendAlert, acknowledgeAlert };
}
