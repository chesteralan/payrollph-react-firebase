# Project Plan / Delivery Roadmap

## 1. Goal

Deliver a modernized, secure, and maintainable payroll platform with minimal disruption to ongoing payroll operations.

## 2. Delivery Strategy

- **Approach:** Incremental modernization in controlled releases.
- **Cadence:** 2-week sprints, monthly release candidate.
- **Release Model:** Phase-gated rollout with regression verification.
- **Risk Control:** Keep payroll generation stable while refactoring around it.

## 3. Timeline Overview

## Phase 0 - Discovery & Planning (2 weeks)

- Baseline current workflows and data dependencies.
- Confirm scope, assumptions, and non-negotiable payroll behaviors.
- Finalize UX, architecture, roadmap, and QA strategy docs.

## Phase 1 - Security & Stability Foundation (4 weeks)

- Password hashing upgrade path (SHA1 -> bcrypt/argon2 migration flow).
- Enable CSRF and harden session/cookie settings.
- Move credentials to environment-based configuration.
- Add audit improvements and high-risk action guards.

## Phase 2 - Payroll Core Refactor (6 weeks)

- Extract payroll generation logic to dedicated services.
- Add transaction handling and idempotency checks.
- Build regression test harness for payroll math outputs.

## Phase 3 - UX Refresh of Core Flows (4 weeks)

- Implement payroll setup wizard and clearer step progression.
- Upgrade employee and payroll table interactions.
- Add save-state indicators and better validation UX.

## Phase 4 - Reporting & Performance (4 weeks)

- Optimize heavy query paths and report screens.
- Improve export reliability and execution time.
- Add telemetry dashboard for generation and report duration.

## Phase 5 - Hardening & Go-Live (2 weeks)

- End-to-end UAT and parallel payroll run validation.
- Production readiness checklist and runbook sign-off.
- Controlled go-live and hypercare support window.

## 4. Milestones

- **M1:** Security baseline complete.
- **M2:** Payroll generation service validated.
- **M3:** New payroll UX available in staging.
- **M4:** Performance targets met.
- **M5:** UAT sign-off and production release.

## 5. Deliverables by Phase

- Discovery artifacts (current-state maps, confirmed scope).
- Security remediations and documented controls.
- Refactored payroll services + test suite.
- Updated UI screens and component behavior specs.
- QA execution reports and go-live readiness packet.

## 6. Dependencies

- Business availability for payroll rule validation.
- Access to representative production-like datasets.
- Dedicated QA environment and staging deployment pipeline.
- Security review support for auth/config changes.

## 7. Risks and Mitigation

- **Payroll regression risk:** lock golden test fixtures and compare outputs per release.
- **Timeline drift:** prioritize high-risk items first and maintain strict sprint scope.
- **Data quality issues:** run data profiling and cleanup scripts early.
- **Operational disruption:** schedule releases outside active payroll cutoff windows.

## 8. Governance

- Weekly steering review:
  - scope
  - risks
  - timeline health
- Sprint review/demo with stakeholders.
- Change control for payroll computation logic.

## 9. Environment Plan

- Dev -> QA -> Staging -> Production promotion pipeline.
- Mandatory QA sign-off before staging.
- Mandatory UAT sign-off before production.

## 10. Success Criteria

- No critical payroll calculation regressions at go-live.
- Security baseline controls implemented and verified.
- Improved completion time for payroll run setup and processing.
- Stable release with acceptable defect escape rate.
