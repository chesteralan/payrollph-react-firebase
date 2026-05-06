# 05 - Modernization Roadmap

## Current Pain Points

- Large controller-centric codebase with mixed concerns
- Security debt (SHA1, CSRF off, hardcoded credentials)
- Heavy SQL subqueries in key payroll/reporting paths
- Synchronous generation/export flows
- Legacy UI patterns that slow complex workflows

## Legacy Risks

- Payroll regression risk during change
- Data integrity risk from multi-table writes without strict transactions
- Security exposure from legacy auth/config defaults
- Operational risk from web-exposed database maintenance actions

## Migration Options

## Option 1: PHP Modernization First (Laravel target)
- Stabilize current app, then migrate backend to Laravel incrementally.
- Lower team transition cost if PHP skills are strong.

## Option 2: Node + React/Next Full API Rewrite
- Build API-first backend (NestJS/Express) + React/Next frontend.
- Higher long-term flexibility, higher short-term risk/cost.

## Option 3: Hybrid Strangler (Recommended)
- Harden legacy app.
- Extract APIs and services in phases.
- Replace UI modules gradually with React/Next.

## Recommended Stack

- Frontend: **React / Next.js**
- Backend: **Laravel API** (or Node/Nest if org prefers TypeScript)
- Database: **MySQL** initially (optional PostgreSQL replatform later)
- Platform: **Docker + CI/CD**
- Optional BaaS for auth/ops acceleration: **Supabase/Firebase** (Needs Verification for fit)

## Phase-by-Phase Plan

## Phase 0 (2 weeks): Foundation & Planning
- Confirm scope, NFRs, migration guardrails
- Finalize architecture/API/QA docs
- Build payroll regression fixture baseline

## Phase 1 (4 weeks): Security + Stability
- Password migration to bcrypt/argon2
- Enable CSRF and secure session settings
- Move secrets to env
- Restrict dangerous admin endpoints

## Phase 2 (6 weeks): Core Service Extraction
- Extract payroll generation/computation services
- Add transaction boundaries + idempotency
- Add automated regression tests for payroll outputs

## Phase 3 (4 weeks): API Layer
- Deliver v1 API for auth, employees, payroll templates/runs
- Keep legacy UI consuming old controllers where needed
- Start new UI on high-value payroll flows

## Phase 4 (4 weeks): UX + Reporting Modernization
- Implement modern payroll workflow UI
- Optimize reports/exports and performance
- Add observability dashboards

## Phase 5 (2 weeks): UAT, Cutover, Hypercare
- Parallel payroll run validation
- Production cutover per module
- Hypercare and defect burn-down

## Timeline (Indicative)

- Total: **18-22 weeks** (scope dependent)
- Suggested cadence: 2-week sprints

## Cost / Effort Estimate (Indicative)

Needs Verification with actual team rates. Effort sizing:
- Small: 1-3 engineer-weeks
- Medium: 4-8 engineer-weeks
- Large: 9+ engineer-weeks

Program-level rough effort:
- 40-65 engineer-weeks across backend, frontend, QA, DevOps.

## Quick Wins (First 30 Days)

1. SHA1 -> bcrypt migration bridge
2. CSRF enablement and form fixes
3. Secrets externalization
4. Guard `system_database` dangerous actions
5. Payroll generation fixture tests in CI

