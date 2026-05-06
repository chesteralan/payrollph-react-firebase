# 09 - QA Test Plan

## Objective

Validate functional correctness, regression safety, security posture, and release readiness for the payroll platform modernization and refactor work.

## Functional Test Coverage

## Authentication / Authorization
- Login/logout/session flows
- Restriction matrix enforcement (`view/add/edit/delete`)
- Unauthorized access handling

## Company Context
- Company switching behavior
- Data isolation by `company_id`

## Employee Management
- Employee CRUD
- Profile updates
- Salary/benefits/earnings/deductions edits

## DTR
- Attendance/absence/overtime updates
- Leave benefit usage calculations

## Payroll
- Template CRUD/config
- Payroll creation/edit/lock/unlock
- Inclusive date selection
- Employee/group assignment
- Generation flow and stage pages

## Outputs/Reports
- Payroll print modes and payslip variants
- XLS exports
- 13th month report

## Regression Test Plan

- Establish golden test fixtures from known-good payroll runs.
- Compare generated rows and totals between legacy and refactored paths.
- Re-run full payroll lifecycle tests each release candidate.

Critical regression checks:
- salary totals
- earnings/deductions caps
- benefits shares
- summary totals by employee and payroll

## Security Test Plan

- Password hashing migration validation
- CSRF enforcement checks
- Session expiration and replay protection checks
- Access control bypass attempts by route and action

## Performance Test Plan

- Payroll generation runtime benchmark
- Report/export response time benchmark
- Heavy table/list load behavior

Suggested targets (Needs Verification):
- standard reads P95 < 400ms
- heavy report endpoints < 2s or async fallback

## UAT Scenarios

1. End-to-end payroll run from template to output.
2. Multi-company user workflow.
3. Employee update + DTR + payroll recalculation.
4. Financial output verification by payroll officer.

## Automation Opportunities

- API contract tests (post-headless migration)
- Payroll fixture comparison tests in CI
- Smoke tests:
  - auth
  - employee retrieval
  - payroll generation
  - export endpoint

## Entry / Exit Criteria

## Entry
- build deployed to QA/staging
- test data prepared
- test cases approved

## Exit
- no open Sev-1 / Sev-2 defects
- all critical test cases passed
- UAT sign-off completed

