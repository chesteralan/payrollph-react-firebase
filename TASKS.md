# PayrollPH — Audit Findings & Tasks

## Critical — Dead Code Cleanup

### Hooks — 109 of ~116 never imported
- [ ] Audit `src/hooks/` and remove unused hook files (keep only 9 used: useAuth, useActivityMonitor, useColorScheme, useCompany, useKeyboardShortcuts, useNetworkStatus, usePermissions, useTableSort, useToast)
- [ ] Move any valuable logic from removed hooks into the files that need them
- [ ] Consolidate duplicate patterns found across multiple hooks

### Services — 11 of 20 never imported
- [ ] Audit `src/services/` and remove unused: batchWriter, businessMetrics, dataCleanup, firestore-optimized, firestoreLogger, ipRestriction, queryOptimizer, reportGenerator, reportScheduling, sentryPerformance, twoFactorAuth
- [ ] Keep only services actually imported: audit, backup, email, firestore, notifications, offline, payroll, setup

### Utils — 6 of 13 never imported
- [ ] Audit `src/utils/` and remove unused: codeSplitter, icsGenerator, importUtils (check if used), rateLimiter, sanitize (check if used), testUtils

### npm Dependencies
- [ ] Remove unused runtime deps: @sentry/replay, @sentry/tracing, tailwind-merge
- [ ] Clean up devDeps: check if husky, tailwindcss are actually used
- [ ] Add missing deps to package.json: jspdf, html2canvas, @axe-core/react, firebase-admin (if needed)
- [ ] Verify all remaining deps are referenced in code (depcheck)

---

## High Priority — Fix Failing Pipeline

### 319 lint errors — fix top offenders
- [ ] Fix all `@typescript-eslint/no-unused-vars` errors (majority are unused imports)
- [ ] Fix `react-hooks/exhaustive-deps` warnings (missing dependencies)
- [ ] Fix `react-hooks/set-state-in-effect` errors
- [ ] Fix `react-refresh/only-export-components` errors (split mixed exports)
- [ ] Add `@typescript-eslint/no-explicit-any` suppressions with justifications for remaining `any` casts

### Build fails — TypeScript errors
- [ ] Fix pre-existing TS errors in: importUtils.ts (index type), sanitize.ts (Extract generic), testUtils.ts (possibly undefined)
- [ ] Fix mock files: firebase.ts (implicit any returns)
- [ ] Fix Breadcrumb.tsx (possibly undefined object)

### Test failures — 3 failing files
- [ ] Fix failing tests and ensure all 103 test files pass
- [ ] Audit test file imports that reference removed hooks/services

---

## High Priority — Large Component Refactoring

### 34 page files over 300 lines — refactor largest first
- [ ] Refactor `PayrollDetailPage.tsx` (1,166 lines) — split DTR, Salaries, Earnings, Benefits, Deductions, Summary stages into separate files
- [ ] Refactor `UsersPage.tsx` (1,097 lines) — extract user form, table, filters into sub-components
- [ ] Refactor `DTRPage.tsx` (1,079 lines) — extract calendar, computation, time selector
- [ ] Refactor `DatabasePage.tsx` (982 lines)
- [ ] Refactor `EarningsDeductionsReportPage.tsx` (956 lines)
- [ ] Refactor remaining 29 page files over 300 lines (target <300 each)

### 2 component files over 300 lines
- [ ] Refactor `PayrollOutputView.tsx` (1,575 lines) — split by view type (register, payslip, transmittal, journal, cash)
- [ ] Refactor `Sidebar.tsx` (479 lines) — extract nav items, user section, company selector

---

## Medium Priority — Architecture & Quality

### Test Coverage
- [ ] Achieve 80%+ line coverage threshold
- [ ] Add tests for all 8 untested services
- [ ] Add tests for remaining untested hooks
- [ ] Add tests for context providers (AuthContext, CompanyContext)
- [ ] Raise test-to-source ratio from 19.2% to 40%+

### Barrel Exports — 136 index.ts files
- [ ] Audit barrel exports for circular dependencies
- [ ] Remove unnecessary re-exports
- [ ] Consolidate where possible

### Mixed Exports
- [ ] Split AuthContext.tsx — move hook to separate file
- [ ] Split CompanyContext.tsx — move hook to separate file

### Inline Components
- [ ] Move inline StatusIcon in HealthCheckPage.tsx to separate file

### Console.log clean up
- [ ] Remove or replace with proper logging in 10+ source files

### Import Ordering
- [ ] Standardize import groups: react → libraries → project → relative
- [ ] Add import/order ESLint rule

### Prop Interface Standardization
- [ ] Audit all component props — rename to `ComponentNameProps` consistently
- [ ] Move inline prop types to `*.types.ts` files for any component > 200 lines

---

## Low Priority — Enhancements

### Documentation
- [ ] Add JSDoc comments to all public hooks (useAuth, usePermissions, useToast, etc.)
- [ ] Document Firestore data model in CONTRIBUTING.md
- [ ] Add ADR (Architecture Decision Record) for state management approach

### CI/CD
- [ ] Add test coverage thresholds (block PRs below 80%)
- [ ] Add bundle size tracking (bundlewatch)
- [ ] Add dependency vulnerability scanning (npm audit in CI)

### Monitoring
- [ ] Add Sentry error boundary integration
- [ ] Add performance monitoring for key user flows

---

**Summary:** 83 tasks identified
- Critical (dead code): 10
- High (pipeline + refactoring): 40
- Medium (architecture): 25
- Low (enhancements): 8
