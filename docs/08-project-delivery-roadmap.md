# 08 - Project Delivery Roadmap

## Milestones

| Milestone | Description | Target |
|---|---|---|
| M1 | Security baseline complete | End of Phase 1 |
| M2 | Payroll core service extraction complete | End of Phase 2 |
| M3 | API v1 for core modules available | End of Phase 3 |
| M4 | UI/UX core payroll flow released in staging | End of Phase 4 |
| M5 | UAT sign-off and production release | End of Phase 5 |

## Sprint Plan (Indicative, 2-week sprints)

- **Sprint 1-2:** planning, security hardening, secrets/config fixes
- **Sprint 3-5:** payroll service extraction + regression harness
- **Sprint 6-7:** API-first module rollout
- **Sprint 8-9:** UI/UX modernization and report optimization
- **Sprint 10:** UAT, cutover prep, go-live support

## Team Roles

- Product Manager: scope, priorities, stakeholder alignment
- Tech Lead: architecture, technical governance
- Backend Engineers: domain/services/data
- Frontend Engineers: UX implementation
- QA Engineers: test strategy/execution/regression
- DevOps Engineer: CI/CD, environments, release controls

## Dependencies

- Confirmed payroll business rules and acceptance criteria
- Stable QA/Staging environments
- Representative test data
- Availability of business SMEs for UAT

## Risks

- Payroll logic regression during refactor
- Timeline slippage from hidden legacy complexity
- Data integrity issues in multi-table flows
- Cutover risk near payroll processing deadlines

## Mitigations

- Golden fixture-based payroll comparisons
- Incremental module release strategy
- Strict change control for payroll math changes
- Release windows outside payroll cutoff periods

## Delivery Timeline (Indicative)

- Total duration: **18-22 weeks** (Needs Verification after sprint sizing)
- Deployment model:
  - Dev -> QA -> Staging -> Production
  - Gate-based promotion with QA and UAT sign-off

