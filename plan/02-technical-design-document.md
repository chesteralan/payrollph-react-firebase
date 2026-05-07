# 02 - Technical Design Document

## Purpose

Define the recommended future-state technical design using the current PHP codebase as baseline while enabling phased modernization.

## Future-State Architecture (Recommended)

- **Architecture style:** modular monolith -> API-first services
- **Transition pattern:** strangler migration (legacy + new services in parallel)
- **Preferred target stack (recommended):**
  - Backend API: Laravel (PHP) **or** Node (NestJS)
  - Frontend: React / Next.js
  - DB: MySQL (initially), optional PostgreSQL later
  - Deployment: Docker + CI/CD pipeline

## Backend Design

## Domain Modules

1. Identity & Access
2. Company & Settings
3. Employee Master
4. DTR/Leave
5. Compensation
6. Payroll Templates
7. Payroll Run Engine
8. Reporting/Exports
9. Audit

## Service Boundaries

- `AuthService`
- `AuthorizationService`
- `EmployeeService`
- `AttendanceService`
- `PayrollGenerationService`
- `PayrollComputationService`
- `PayrollOutputService`
- `ReportService`
- `AuditService`

## Data Access Pattern

- Repository + query service pattern
- Explicit DTO/request validation
- Transaction boundaries for payroll write workflows
- Idempotency on generate/lock/unlock operations

## Frontend Design

- Next.js/React app with modular pages:
  - Dashboard
  - Employees
  - Payroll setup wizard
  - Payroll processing stages
  - Reports
  - Admin
- Shared design system:
  - Data tables
  - Forms + validation patterns
  - Modals and confirmation components
- API-driven state with optimistic updates only where safe

## Security Model

- Password hashing: Argon2/Bcrypt
- Session/JWT strategy (based on target platform)
- RBAC mapped from existing dept/section/action matrix
- CSRF enabled for session-based flows
- Secrets in env/vault (no hardcoded credentials)
- Audit trail for critical actions (generate, lock, delete, permission changes)

## Scaling Strategy

- Short term:
  - optimize heavy SQL paths
  - index tuning
  - cache read-heavy dictionaries/options
- Mid term:
  - async jobs for exports/reports
  - horizontal app scaling behind load balancer
- Long term:
  - read models for reporting
  - service decomposition of payroll/report modules

## Logging / Monitoring

- Structured JSON logs:
  - request id
  - user id
  - company id
  - action/module
- Metrics:
  - payroll generation duration
  - report export duration
  - error rate per module
- Monitoring/alerts:
  - failed generation jobs
  - auth anomalies
  - DB performance thresholds

## Non-Functional Targets (Suggested)

- API P95 latency:
  - standard reads < 400ms
  - heavy reports < 2s (or async)
- Availability target: 99.9% (Needs Verification)
- Zero Sev-1 payroll regression at release

## Migration Notes

- Maintain current DB schema initially for lower risk.
- Port payroll engine first to isolated service with fixture-based parity tests.
- Decommission legacy controllers module-by-module after API/UI parity.

