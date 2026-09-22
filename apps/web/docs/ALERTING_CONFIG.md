# Sentry Alerting & Error Grouping Configuration

This document defines the Sentry alert rules and error grouping strategy for PayrollPH.

## Error Grouping Strategy

### Fingerprint Rules

Custom fingerprinting ensures errors are grouped intelligently:

```javascript
// In sentry.ts init config
beforeSend(event) {
  // Group Firestore errors by collection
  if (event.tags?.firestore_operation) {
    event.fingerprint = [
      'firestore',
      event.tags.firestore_collection,
      event.tags.firestore_operation,
    ];
  }

  // Group API errors by status code + URL pattern
  if (event?.request?.url) {
    const url = new URL(event.request.url);
    const pathPattern = url.pathname.replace(/\/[a-f0-9]{20,}/gi, '/:id');
    event.fingerprint = ['api', event.request.method, pathPattern];
  }

  return event;
}
```

### Grouping Rules (Sentry Console)

| Rule | Description |
|------|-------------|
| **Merge by fingerprint** | Errors with same fingerprint → same issue |
| **Stack trace grouping** | Group by top 3 frames of stack trace |
| **Message grouping** | Group by error message pattern (with ID normalization) |

## Alert Rules

### Critical Alerts (P0 — Slack + PagerDuty)

| Rule | Condition | Threshold | Window |
|------|-----------|-----------|--------|
| **Crash Spike** | Unique errors > 10 | 10+ events | 5 minutes |
| **New Critical Error** | New error type with `level=error` or `level=fatal` | 1+ events | 1 hour |
| **Complete Outage** | Health check returns `unhealthy` | 3 consecutive failures | 15 minutes |
| **Auth Failure Spike** | Firebase Auth errors | 50+ events | 5 minutes |

### High Priority Alerts (P1 — Slack notification)

| Rule | Condition | Threshold | Window |
|------|-----------|-----------|--------|
| **Error Rate Spike** | Error rate > 1% of all events | 1%+ | 1 hour |
| **Slow Transactions** | Transaction duration > 5s | 5+ transactions | 5 minutes |
| **Firestore Errors** | Firestore permission denied / not found | 10+ events | 15 minutes |
| **Payroll Errors** | Payroll calculation/processing errors | 5+ events | 15 minutes |
| **Replay Errors** | Session replay captures crash | 3+ replays | 1 hour |

### Warning Alerts (P2 — Email/Slack digest)

| Rule | Condition | Threshold | Window |
|------|-----------|-----------|--------|
| **Deprecation Warnings** | API deprecation notices | 5+ events | 24 hours |
| **Slow Queries** | Firestore queries > 1s | 20+ events | 1 hour |
| **404 Not Found** | 404 responses on valid routes | 20+ events | 10 minutes |
| **Rate Limit Hits** | Rate limited requests | 10+ events | 1 hour |

## Notification Channels

| Channel | Purpose | P0 | P1 | P2 | P3 |
|---------|---------|----|----|----|----|
| **Slack #incidents** | Real-time critical alerts | ✅ | ✅ | ❌ | ❌ |
| **Slack #engineering** | High priority team notifications | ❌ | ✅ | ✅ | ❌ |
| **Email (dev team)** | Daily/Weekly digest | ❌ | ❌ | ✅ | ✅ |
| **PagerDuty** | On-call escalation | ✅ | ❌ | ❌ | ❌ |

## Sentry Config

The production configuration is in `src/config/sentry.ts`:

```typescript
Sentry.init({
  dsn: VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION,
  tracesSampleRate: 0.1,           // 10% of transactions in production
  replaysSessionSampleRate: 0.1,   // 10% of sessions recorded
  replaysOnErrorSampleRate: 1.0,   // 100% of errors get replay
  beforeSend(event) {
    // Error grouping logic
  },
});
```

## Custom Metrics Dashboard

### Key Performance Indicators (KPIs)

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Page load time | Sentry Browser | > 3s P75 |
| Payroll process time | Sentry Custom Transaction | > 10s P95 |
| Firestore read count | Sentry Breadcrumbs | > 100/action |
| Error-free rate | Sentry Release Health | < 99% |
| API error rate | Sentry Events | > 2% |

### Dashboard Widgets (Sentry Dashboard)

1. **Error Rate Over Time** — Line chart, grouped by severity
2. **Top Errors by URL** — Table with count, users affected
3. **Transaction Duration** — P50/P95/P99 comparison
4. **Release Health** — Crash-free rate per version
5. **User Impact** — Unique users affected over time
6. **Firestore Operation Breakdown** — Reads vs Writes by collection
7. **Geographic Distribution** — Errors by country/region

## Setup Instructions

### Sentry Alert Setup (Web UI)

1. Go to `Settings → Alerts → Create Alert`
2. Choose alert type (crash rate, error count, etc.)
3. Set conditions and thresholds (see tables above)
4. Configure notification actions (Slack, PagerDuty, email)
5. Set alert severity and escalation policy

### PagerDuty Integration

1. In Sentry: `Settings → Integrations → PagerDuty`
2. Add PagerDuty integration key
3. Map Sentry alert rules to PagerDuty services
4. Configure escalation policies (15 min → Senior Dev, 30 min → Lead)
