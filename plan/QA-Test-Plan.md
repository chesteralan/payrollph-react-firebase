# QA Test Plan

## 1. Purpose

Define how the payroll system will be validated to ensure correctness, reliability, security, and release readiness.

## 2. Scope

In scope:
- Authentication and authorization
- Multi-company behavior
- Employee master and DTR modules
- Payroll templates and payroll generation
- Payroll stage views and calculations
- Output generation (print/payslip/transmittal/journal/XLS)
- Reports and admin-critical tools

Out of scope (for this plan unless added):
- Third-party payment gateway validation
- External API/webhook validation

## 3. Test Strategy

- **Static checks:** linting, code review standards
- **Functional testing:** module-level scenario testing
- **Integration testing:** cross-module payroll lifecycle
- **Regression testing:** fixture-based output comparisons
- **Security testing:** auth/session/permission/CSRF checks
- **Performance testing:** heavy report and payroll generation runtime
- **UAT support:** business validation against expected payroll outputs

## 4. Environments

- **QA:** stable integration branch deployment
- **Staging:** production-like data and configuration
- **Production smoke:** post-release critical path checks

## 5. Test Data Requirements

- Multi-company dataset with varied structures
- Employees across status/group/position/area
- Mixed compensation profiles:
  - monthly/daily/hourly styles
  - capped earnings/deductions
  - leave allocations and partial availments
- Historical payroll runs for generation-from-payroll scenario

## 6. Test Suites

## 6.1 Authentication & Authorization

- Valid login/logout flow.
- Invalid credentials handling.
- Session expiry behavior.
- Restriction matrix enforcement per module/action.
- Unauthorized URL access redirect behavior.

## 6.2 Company Context

- Company switch updates context-sensitive data correctly.
- Cross-company data leakage checks (must not happen).
- User/company assignment restrictions enforced.

## 6.3 Employee & DTR

- Employee CRUD and profile updates.
- Salary primary selection logic.
- Attendance/absence/overtime add/edit/delete flows.
- Leave entitlement/availed calculations by period/year.

## 6.4 Payroll Template

- Template CRUD and status transitions.
- Group/employee/component selection persistence.
- Print-column and print-group settings behavior.

## 6.5 Payroll Run

- Payroll creation and inclusive dates setup.
- Generation from template and from prior payroll.
- Group and employee assignments update correctly.
- Lock/unlock behavior and edit restrictions.
- Stage-level views reflect generated data consistently.

## 6.6 Calculations

- Salary calculations with absences/attendance effects.
- Earnings multiplier rules (employment years, day-of-week, etc.).
- Deduction max cap behavior.
- Benefit employee/employer share rollups.
- Summary totals consistency across views and outputs.

## 6.7 Output & Export

- Print view rendering for all output modes.
- Payslip variants content checks.
- XLS download format and data integrity.
- Print group filtering and custom CSS behavior.

## 6.8 Reporting

- 13th month report correctness for selected year.
- Employee report display and XLS download correctness.

## 6.9 Admin & Maintenance

- User restrictions and company assignments.
- Terms and company options persistence.
- Audit logs written for critical actions.
- Database backup list/download/delete behavior (admin-only).

## 7. Regression Framework

- Maintain golden payroll fixtures and expected outputs.
- Compare generated rows and totals per release candidate.
- Block release on critical payroll mismatch.

## 8. Entry and Exit Criteria

## Entry Criteria

- Requirements and test scenarios approved.
- QA environment updated with target build.
- Required test data available.

## Exit Criteria

- 100% critical test cases passed.
- No open Sev-1/Sev-2 defects.
- Acceptable Sev-3 count with approved workaround list.
- UAT sign-off for payroll-critical outputs.

## 9. Defect Severity Model

- **Sev-1:** payroll computation incorrect, security breach, data corruption
- **Sev-2:** major workflow blocked, wrong role access, export failure
- **Sev-3:** partial function issue with workaround
- **Sev-4:** minor UI/copy issue

## 10. Test Execution Plan

- **Cycle 1:** core functional and security baseline
- **Cycle 2:** integration + regression suite
- **Cycle 3:** performance + UAT support + final regression
- **Release Gate:** production smoke tests within agreed window

## 11. QA Deliverables

- Test cases and checklist matrix
- Daily execution report
- Defect logs with severity and owner
- Regression comparison report (expected vs actual)
- UAT support notes and sign-off summary
- Release readiness recommendation

## 12. Post-Release Validation

- Smoke test:
  - login
  - employee lookup/update
  - payroll open/view/generate
  - key output export
- Monitor audit logs and error logs for anomalies in first payroll cycle.
