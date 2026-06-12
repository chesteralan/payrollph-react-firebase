# PayrollPH — Remaining Tasks

## 1. Testing (23 tasks)

### Unit Tests (12)
- [ ] 1.1 Write tests for custom hooks (usePermissions, useTableSort, useNetworkStatus)
- [ ] 1.2 Write tests for context providers (AuthContext, CompanyContext)
- [ ] 1.3 Write tests for Firestore service functions (offline, audit, cache)
- [ ] 1.4 Write tests for payroll calculation logic
- [ ] 1.5 Write tests for RBAC permission functions
- [ ] 1.6 Write tests for data transformation/formatting utilities
- [ ] 1.7 Write tests for offline/IndexedDB service
- [ ] 1.8 Write tests for i18n translation functions
- [ ] 1.9 Write tests for validation/sanitization edge cases
- [ ] 1.10 Write tests for export utility functions (XLS, CSV)
- [ ] 1.11 Write tests for all custom hooks (useAuth, useCompany, useToast)
- [ ] 1.12 Add test coverage reporting to CI pipeline with thresholds

### E2E Tests (6)
- [ ] 1.13 Set up Playwright for E2E testing
- [ ] 1.14 Add E2E test for company switching and data isolation
- [ ] 1.15 Add E2E test for offline mode (create, queue, sync)
- [ ] 1.16 Add visual regression tests for key pages (Playwright snapshots)
- [ ] 1.17 Add E2E test for CSV import flow (names, users)
- [ ] 1.18 Add E2E test for calendar and DTR workflows

### Test Infrastructure (5)
- [ ] 1.19 Add Firestore emulator integration for integration tests
- [ ] 1.20 Add CI test running with parallel execution
- [ ] 1.21 Add test coverage thresholds that block PRs below 80%
- [ ] 1.22 Add test documentation for contributor guide
- [ ] 1.23 Add test run time tracking with regression alerting

## 2. Deployment & Operations (6 tasks)
- [ ] 2.1 Add staging environment parity with production
- [ ] 2.2 Add database migration/seeding scripts for test data
- [ ] 2.3 Add deployment rollback automation
- [ ] 2.4 Add smoke test suite for post-deployment verification
- [ ] 2.5 Add environment configuration documentation
- [ ] 2.6 Add deploy previews for PR branches

## 3. Code Quality & Architecture (8 tasks)
- [ ] 3.1 Extract duplicated Firestore query patterns into reusable hooks
- [ ] 3.2 Add strict TypeScript checks (noUncheckedIndexedAccess)
- [ ] 3.3 Standardize component prop interfaces with consistent naming
- [ ] 3.4 Add API service layer abstraction (repository pattern)
- [ ] 3.5 Add comprehensive JSDoc for public APIs and hooks
- [ ] 3.6 Reduce component re-render surface area (profiling pass)
- [ ] 3.7 Clean up barrel exports (remove circular dependencies)
- [ ] 3.8 Standardize import ordering across all files

## 4. State Management (3 tasks)
- [ ] 4.1 Audit and consolidate React Context providers (reduce nesting)
- [ ] 4.2 Add selectors/memoization for context values
- [ ] 4.3 Implement undo/redo for critical workflows (payroll edits, employee updates)

## 5. Features Remaining (4 tasks)
- [ ] 5.1 Add report template saving (reusable report configurations) — Reports
- [ ] 5.2 Add employee quick-view tooltip on hover in tables — Employees
- [ ] 5.3 Add cross-company search capability — Search
- [ ] 5.4 Add app-like native sharing for exports — Mobile

---

**Summary:** 44 tasks remaining
- Testing: 23
- Deployment: 6
- Code Quality: 8
- State Management: 3
- Features: 4
