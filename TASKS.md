# PayrollPH — Remaining Tasks

## ✅ Completed
- **Dead code cleanup**: Removed 97 unused hooks, 7 unused services, 3 unused utils, 70+ unused UI components, 10 unused E2E tests, CLI scripts, config files — 286 files total, 12,056 lines removed
- **Fixed i18n**: Removed fil-PH locale reference that broke module resolution
- **Fixed orphaned tests**: Removed codeSplitter.test.ts, fixed i18n test

## Remaining

### 1. Fix Pipeline (5 failing tests — pre-existing)
- [ ] Fix `reportScheduling.test.ts`
- [ ] Fix `reports.test.ts` (flow test)
- [ ] Fix `AppLayout.test.tsx`
- [ ] Fix `Sidebar.test.tsx`
- [ ] Fix `HealthCheckPage.test.tsx`

### 2. Refactor Large Components (34 files over 300 lines)
- [ ] Refactor `PayrollDetailPage.tsx` (1,166 lines) — split into per-stage components
- [ ] Refactor `UsersPage.tsx` (1,097 lines) — extract user form, table, filters
- [ ] Refactor `DTRPage.tsx` (1,079 lines) — extract calendar, computation, time selector
- [ ] Refactor `DatabasePage.tsx` (982 lines)
- [ ] Refactor `EarningsDeductionsReportPage.tsx` (956 lines)
- [ ] Refactor `NamesListPage.tsx` (954 lines)
- [ ] Refactor `PrintFormatsPage.tsx` (844 lines)
- [ ] Refactor remaining 27 page files over 300 lines
- [ ] Refactor `PayrollOutputView.tsx` (1,575 lines) — split by view type
- [ ] Refactor `Sidebar.tsx` (479 lines) — extract nav items, user section

### 3. TypeScript Fixes (build errors)
- [ ] Fix `sanitize.ts` line 155 — generic type constraint
- [ ] Fix `importUtils.ts` line 113 — index type error
- [ ] Fix `firebase.ts` mock — implicit any returns
- [ ] Fix `Breadcrumb.tsx` — possibly undefined object

### 4. Code Quality
- [ ] Split `AuthContext.tsx` — move hook to separate file (rule 10)
- [ ] Split `CompanyContext.tsx` — move hook to separate file (rule 10)
- [ ] Move inline `StatusIcon` in `HealthCheckPage.tsx` to separate file (rule 6)
- [ ] Add import/order ESLint rule (rule 8)
- [ ] Add `noUncheckedIndexedAccess` to tsconfig (rule 3.2)
- [ ] Remove `console.log` from 10+ source files (rule 7)

### 5. Expand Test Coverage
- [ ] Add tests for 8 untested services (offline, audit, cache, email, payroll, backup, notifications, setup)
- [ ] Raise test-to-source ratio from ~19% to 40%+

### 6. Dependency Cleanup
- [ ] Remove unused runtime deps: `@sentry/replay`, `@sentry/tracing`, `tailwind-merge`
- [ ] Remove unused devDeps: `husky`
- [ ] Add missing deps: `jspdf`, `html2canvas`, `@axe-core/react` (if needed)
