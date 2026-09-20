# Uptime Monitoring Configuration

This document defines the uptime monitoring setup for the PayrollPH application.

## Health Check Endpoint

The application exposes a health check endpoint at `/api/health` that returns JSON with service status.

### Expected Response

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-06-11T04:00:00.000Z",
  "uptime": 86400,
  "checks": {
    "firestore": { "status": "ok", "latency": 45 },
    "firebaseAuth": { "status": "ok", "latency": 12 },
    "sentry": { "status": "ok" },
    "storage": { "status": "ok" }
  }
}
```

## UptimeRobot Configuration

1. Create account at https://uptimerobot.com
2. Add a new monitor with these settings:

| Setting | Value |
|---------|-------|
| **Monitor Type** | HTTP(s) |
| **Friendly Name** | PayrollPH Production |
| **URL** | `https://{production-project}.firebaseapp.com/api/health` |
| **Monitoring Interval** | 5 minutes |
| **Timeout** | 30 seconds |
| **HTTP Method** | GET |
| **Alert Contacts** | {Slack webhook, email} |

### Alert Triggers

| Condition | Action |
|-----------|--------|
| Down (3 consecutive failures) | Slack #incidents channel + PagerDuty |
| SSL certificate expires < 30 days | Email to dev team |
| Response time > 5s | Slack #incidents |

## Google Cloud Monitoring (Alternative)

If using Google Cloud Monitoring instead:

```yaml
# gcp-monitoring.yaml
uptime_check:
  display_name: payrollph-health-check
  period: 300s
  timeout: 10s
  http_check:
    request_method: GET
    path: /api/health
    port: 443
    use_ssl: true
    accepted_response_status_codes:
      - status_class: STATUS_CLASS_2XX
      - status_class: STATUS_CLASS_3XX

alert_policy:
  display_name: PayrollPH Uptime Alert
  conditions:
    - condition_threshold:
        filter: metric.type="monitoring.googleapis.com/uptime_check/check_passed" AND resource.labels.host="{hostname}"
        comparison: COMPARISON_LT
        threshold_value: 1
        duration: 300s
  notification_channels:
    - {slack_channel_id}
```

## Better Uptime / Checkly (Synthetic Monitoring)

For synthetic monitoring that checks full page loads:

```javascript
// checkly.check.js
const { chromium } = require('playwright');

const browser = await chromium.launch();
const page = await browser.newPage();

// Check health endpoint
const response = await page.goto('https://{project}.firebaseapp.com/api/health');
const data = JSON.parse(await response.text());

if (data.status !== 'healthy') {
  throw new Error(`Health check failed: ${data.status}`);
}

// Verify key services
if (data.checks.firestore.status !== 'ok') {
  throw new Error('Firestore is unreachable');
}

await browser.close();
```

## Multi-Region Monitoring

Configure monitors from at least two geographic regions:
- **US West** (Oregon)
- **Asia Pacific** (Singapore) — primary user base
- **Europe West** (Ireland)

## Dashboard

Create a monitoring dashboard with:

1. **Uptime percentage** — Last 24h / 7d / 30d
2. **Response time** — P50/P95/P99 latency
3. **SSL expiry** — Countdown to cert renewal
4. **Status history** — Timeline of downtime events
