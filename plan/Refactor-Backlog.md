# Refactor Backlog (Prioritized Technical Debt)

## 1. Purpose

Provide a prioritized technical debt backlog to guide refactoring with clear impact, urgency, and execution order.

## 2. Prioritization Model

- **P0:** Critical risk (security/data integrity/payroll correctness)
- **P1:** High impact maintainability/performance
- **P2:** Medium impact quality improvements
- **P3:** Low priority cleanup/optimization

## 3. Backlog Items

## P0 - Critical

### RB-001: Password Hashing Migration
- **Issue:** SHA1 password hashing in authentication flow.
- **Impact:** High security risk.
- **Action:** Implement bcrypt/argon2 with migration-on-login strategy.

### RB-002: Enable CSRF Protection
- **Issue:** CSRF disabled in app config.
- **Impact:** Request forgery risk on state-changing endpoints.
- **Action:** Enable CSRF and patch affected forms/AJAX workflows.

### RB-003: Secret Management
- **Issue:** DB credentials in repository config.
- **Impact:** Credential exposure risk.
- **Action:** Move to env-based secrets with environment-specific config.

### RB-004: Guard Dangerous DB Admin Endpoints
- **Issue:** `system_database` actions can mutate schema.
- **Impact:** High operational and security risk.
- **Action:** Restrict endpoint access, require elevated confirmation, and optionally disable in production.

## P1 - High

### RB-005: Extract Payroll Generation Service
- **Issue:** Payroll generation logic is embedded in large controller methods.
- **Impact:** Hard to test and maintain; high regression risk.
- **Action:** Move into `PayrollGenerationService` and dedicated computation components.

### RB-006: Add Transaction Boundaries
- **Issue:** Multi-table write workflows without strict transaction management.
- **Impact:** Partial writes/inconsistent payroll states.
- **Action:** Wrap generation and high-impact update flows in DB transactions.

### RB-007: Remove SQL String Concatenation Risks
- **Issue:** Dynamic SQL fragments built from request/session values in multiple places.
- **Impact:** Security and correctness risk.
- **Action:** Replace with parameterized query-builder patterns.

### RB-008: Standardize Validation Layer
- **Issue:** Validation logic inconsistent across controllers.
- **Impact:** Fragile input handling and duplicate logic.
- **Action:** Introduce reusable validators/request DTOs for core entities.

### RB-009: Reduce Controller Size
- **Issue:** Very large controllers (`Payroll`, `Payroll_overall`, others).
- **Impact:** Low developer velocity, high defect risk.
- **Action:** Split by use case and extract service/repository classes.

## P2 - Medium

### RB-010: Consolidate Duplicate DTR Logic
- **Issue:** Similar attendance/absence/overtime logic repeated across modules.
- **Impact:** Inconsistent behavior and maintenance overhead.
- **Action:** Build shared domain service for DTR operations.

### RB-011: Introduce Query Services for Reports
- **Issue:** Complex nested subqueries in reporting/print views.
- **Impact:** Slow pages and difficult optimization.
- **Action:** Create dedicated query/read-model services and optimize indexes.

### RB-012: Helper Cleanup
- **Issue:** Helper defects and duplicated utility functions.
- **Impact:** Hidden bugs and confusion.
- **Action:** Fix helper bugs, remove duplicate implementations, add tests.

### RB-013: Unified Error Handling
- **Issue:** Inconsistent error responses and redirects.
- **Impact:** Poor UX/debuggability.
- **Action:** Standardize domain and UI error handling patterns.

## P3 - Low

### RB-014: View Layer Modernization
- **Issue:** Legacy modal patterns and repetitive UI blocks.
- **Impact:** UX inconsistency and frontend maintenance friction.
- **Action:** Componentize shared UI partials and reduce duplication.

### RB-015: Audit Event Enrichment
- **Issue:** Audit notes vary and may be insufficient for troubleshooting.
- **Impact:** Reduced traceability.
- **Action:** Standardize event payload format and include request context metadata.

### RB-016: Naming/Convention Cleanup
- **Issue:** Inconsistent naming and mixed conventions.
- **Impact:** Code readability cost.
- **Action:** Incremental standardization during touch-based refactors.

## 4. Suggested Refactor Sequence

1. **Security baseline:** RB-001 to RB-004
2. **Payroll core reliability:** RB-005 to RB-007
3. **Maintainability uplift:** RB-008 to RB-010
4. **Performance/readability:** RB-011 onward

## 5. Backlog Metadata Template

Use this format per ticket in your tracker:

- **ID**
- **Title**
- **Priority**
- **Module**
- **Problem Statement**
- **Proposed Change**
- **Acceptance Criteria**
- **Risk**
- **Estimate**
- **Owner**

## 6. Definition of Done for Refactor Items

- Functional behavior preserved (or intentionally changed with approval).
- Regression tests added/updated.
- Security/performance impact reviewed.
- Documentation updated where applicable.

