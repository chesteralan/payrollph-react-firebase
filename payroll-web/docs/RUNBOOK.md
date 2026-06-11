# Operational Runbook

## Overview

This runbook documents the operational procedures for the PayrollPH application. It covers monitoring, alerting, incident response, and recovery procedures.

## System Architecture

```
User → Firebase Hosting (CDN) → React SPA
                                      ↓
                          Firebase Auth (Authentication)
                          Firestore (Database)
                          Cloud Storage (Documents)
                                      ↓
                          Sentry (Error Tracking / Performance Monitoring)
```

## Monitoring Stack

| Service | Purpose | Dashboard URL |
|---------|---------|---------------|
| **Sentry** | Error tracking, performance monitoring, release health | https://sentry.io/organizations/{org}/projects/payroll-web/ |
| **Firebase Console** | Firestore metrics, Auth usage, Hosting status | https://console.firebase.google.com/project/{project-id}/ |
| **Google Cloud Monitoring** | Uptime checks, infrastructure metrics | https://console.cloud.google.com/monitoring |
| **UptimeRobot** | External uptime monitoring | https://uptimerobot.com/dashboard |

## Health Check Endpoint

```http
GET /api/health
```

Returns:
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

Uptime monitors should check this endpoint every 5 minutes. Expected response: `status: "healthy"`.

## Incident Response

### Severity Levels

| Level | Definition | Response Time | Examples |
|-------|------------|---------------|----------|
| **P0** | Critical — complete system outage | 15 min | Site down, cannot process payroll |
| **P1** | High — major feature broken | 30 min | Payroll calculation errors, login broken |
| **P2** | Medium — non-critical feature degraded | 2 hours | Export not working, UI issues |
| **P3** | Low — cosmetic / minor bugs | Next business day | Typo in UI, styling issues |

### Incident Response Steps

#### P0: Complete System Outage

1. **Detect** — Uptime monitor alerts or Sentry crash spike
2. **Acknowledge** — Respond in Slack/PagerDuty within 15 minutes
3. **Assess** — Check health endpoint: `GET /api/health`
   - If unhealthy → check Firebase Status Dashboard
   - If healthy → check for recent deployments, DNS issues
4. **Mitigate** — Rollback to last known good version:
   ```bash
   git revert HEAD
   git push origin main
   # Deploy reverts automatically via CI/CD
   ```
5. **Communicate** — Post in #incidents channel with:
   - What's affected
   - Current status
   - ETA for resolution
6. **Resolve** — Confirm recovery via health endpoint + E2E tests
7. **Post-mortem** — Within 48 hours, document:
   - Root cause
   - Timeline
   - Preventative measures

#### P1: Major Feature Degradation

1. **Detect** — Sentry alert on error threshold exceeded
2. **Acknowledge** — Within 30 minutes
3. **Investigate** — Check Sentry for error grouping → identify affected component
4. **Mitigate** — Feature flag disable the problematic feature:
   ```bash
   firebase functions:config:set feature.{name}=disabled
   ```
5. **Fix** — Deploy fix via regular CI/CD
6. **Verify** — Run affected E2E tests

#### P2: Non-Critical Degradation

1. **Log** — Create GitHub issue with error details
2. **Triage** — Label as `severity/p2` and assign during next sprint planning
3. **Fix** — Address in regular sprint cycle

#### P3: Minor Issues

1. **Log** — As GitHub issue with `severity/p3` label
2. **Batch** — Address in maintenance releases

## Alerting Rules

### Sentry Alert Rules

| Rule | Condition | Action | Severity |
|------|-----------|--------|----------|
| Crash spike | > 10 errors in 5 minutes | Slack notification | P0 |
| New error type | First occurrence of an error | Slack notification | P1 |
| Slow transaction | > 5s average duration on key transactions | Slack notification | P1 |
| Error threshold | > 1% error rate over 1 hour | Email + Slack | P1 |
| 404 spike | > 20 404s in 10 minutes | Slack notification | P2 |

### Uptime Monitoring Alerts

| Check | Interval | Threshold | Action |
|-------|----------|-----------|--------|
| Health endpoint | 5 min | 3 consecutive failures | Slack + PagerDuty |
| SSL certificate | 24 hours | Expiring in < 30 days | Email notification |
| Response time | 5 min | > 5s average over 10 min | Slack notification |

## Backup and Recovery

### Firestore Backups

```bash
# Create manual backup
yarn backup:create

# List backups
yarn backup:list

# Automated backups run daily via Firebase console
# Retention: 30 days daily, 6 monthly
```

### Recovery Procedure

1. **Assess data loss scope** — Determine which collections affected
2. **Restore from backup**:
   - Go to Firebase Console → Firestore → Backups
   - Select backup point
   - Restore to a new database instance
   - Point application to restored database
3. **Verify data integrity** — Run smoke tests and spot-check records
4. **Switch traffic** — Update CI/CD pipeline to point to restored DB

## Deployment Procedures

### Standard Deployment

```bash
# 1. Create PR → passes CI checks (lint, typecheck, tests, build)
# 2. Merge to develop → auto-deploys to staging
# 3. Verify on staging environment
# 4. Create PR from develop → main
# 5. Merge to main → auto-deploys to production
```

### Rollback Procedure

```bash
# Immediate rollback via git revert:
git checkout main
git pull
git revert HEAD
git push origin main
# CI/CD will auto-deploy the revert to production

# For Firestore schema changes:
# Use previous version rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

## Key Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| Developer On-Call | Slack: @dev-oncall | P0 immediate |
| Database Admin | Slack: @dba | Data recovery |
| Security | Slack: @security | Security incidents |

## Maintenance Windows

- **Scheduled maintenance**: Sundays 02:00-04:00 AM PHT (Philippine Time)
- **Database migrations**: Apply during maintenance window
- **Dependency updates**: Apply during maintenance window after testing on staging

## Monitoring Dashboards

### Sentry Dashboard

Access at: `https://sentry.io/organizations/{org}/dashboards/payroll/`

Key widgets:
- **Error rate** — Errors per minute, colored by severity
- **Transaction duration** — P50/P95/P99 for key transactions (payroll, DTR, reports)
- **Release health** — Crash-free rate per version
- **Top affected URLs** — Most errored routes
- **User impact** — Number of affected users per error

### Firebase Console

Access at: `https://console.firebase.google.com/project/{project-id}/`

Key metrics to monitor:
- **Firestore reads/writes** — Ensure under free tier or budget limits
- **Auth active users** — Track usage growth
- **Hosting bandwidth** — Monitor for traffic spikes

## Logging

### Client-Side Logging

- All Sentry errors are captured client-side
- Performance transactions for key workflows
- Firestore operations have structured logging via `firestoreLogger.ts`

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `fatal` | Unrecoverable errors | App crash |
| `error` | Failed operations | Payroll save failed |
| `warning` | Degraded functionality | Slow query > 1s |
| `info` | Business metrics | Payroll created |
| `debug` | Development only | Component render |

## On-Call Checklist

When receiving an alert:

1. [ ] Acknowledge the alert
2. [ ] Check health endpoint: `GET /api/health`
3. [ ] Check Sentry for recent errors
4. [ ] Check Firebase Console for service status
5. [ ] Check recent deployments (last 2 hours)
6. [ ] Determine severity level
7. [ ] Follow appropriate incident response procedure
8. [ ] Update status page / communicate with stakeholders
9. [ ] Document findings in incident report
