# PayrollPH — Remaining Tasks

## ✅ Completed
- **Dead code cleanup**: Removed 97 unused hooks, 7 unused services, 3 unused utils, 70+ unused UI components, 10 unused E2E tests, CLI scripts, config files — 286 files total, 12,056 lines removed
- **Fixed i18n**: Removed fil-PH locale reference that broke module resolution
- **Fixed orphaned tests**: Removed codeSplitter.test.ts, fixed i18n test
- **Fixed TypeScript errors**: All ~373 errors resolved — `tsc --noEmit` passes with 0 errors
  - `sanitize.ts` line 155 — fixed generic type constraint (keyof T vs Extract<keyof T, string>)
  - `importUtils.ts` line 113 — fixed index type error from noUncheckedIndexedAccess
  - `__mocks__/firebase.ts` — fixed implicit any returns on `exists`, `data`, `get` methods
  - `Breadcrumb.tsx` — fixed possibly undefined array/object access
- **Fixed code quality**: Removed `console.log` from `offline.ts` (2 calls), `reportScheduling.ts` (2 calls)
- **Fixed unused variables**: `CompanyContext.tsx` — removed unused `setCompanies`, `setLoading`
- **Confirmed `noUncheckedIndexedAccess` already enabled** in `tsconfig.app.json` — no action needed
- **Fixed `AuthContext.tsx`** — optional chaining on `companiesData[0]?.companyId`
- **Fixed pipeline tests**: Created `reportGenerator.ts` (needed by `reportScheduling.ts` app code + tests); Added 12 missing lucide-react icons to `__mocks__/lucide-react.ts` (`Server`, `HardDrive`, `LayoutDashboard`, `Layers`, `ListChecks`, `Banknote`, `ArrowDownToLine`, `ArrowUpFromLine`, `CopyPlus`, `UserCog`, `ShieldCheck`)
- **Extracted `StatusIcon`**: Moved from inline inside `HealthCheckPage.tsx` to `StatusIcon.tsx` separate component file
- **Split AuthContext.tsx** — moved selector hooks (`useCurrentCompanyId`, `useCurrentUser`, `useAuthLoading`, `useUserPermissions`) and `ValueStore`/`AuthStoreContext` to separate files (`hooks.ts`, `src/utils/valueStore.ts`)
- **Split CompanyContext.tsx** — moved selector hooks (`useCurrentCompany`, `useCompanies`, `useCompanyLoading`) and `ValueStore`/`CompanyStoreContext` to separate files (`hooks.ts`, `src/utils/valueStore.ts`)
- **Extracted shared `ValueStore` class** — removed duplication between AuthContext and CompanyContext; now lives in `src/utils/valueStore.ts`

## Remaining

### 1. Fix Pipeline (5 failing tests — pre-existing)
- [x] Fix `reportScheduling.test.ts` — created missing `reportGenerator.ts` module
- [x] Fix `reports.test.ts` — created missing `reportGenerator.ts` module
- [x] Fix `AppLayout.test.tsx` — added missing lucide-react mock exports (`LayoutDashboard`, `Layers`, `ListChecks`, `Banknote`, `ArrowDownToLine`, `ArrowUpFromLine`, `CopyPlus`, `UserCog`, `ShieldCheck`)
- [x] Fix `Sidebar.test.tsx` — same lucide-react mocks as AppLayout
- [x] Fix `HealthCheckPage.test.tsx` — added missing `Server`, `HardDrive` mock exports

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

### 3. TypeScript Fixes ✅ (0 errors — all resolved)
- [x] All TypeScript errors resolved — `tsc --noEmit` passes cleanly

### 4. Code Quality
- [x] Move inline `StatusIcon` in `HealthCheckPage.tsx` to separate file (`StatusIcon.tsx`)
- [x] Split `AuthContext.tsx` — move hook to separate file (rule 10)
- [x] Split `CompanyContext.tsx` — move hook to separate file (rule 10)
- [ ] Add import/order ESLint rule (rule 8)
- [ ] Remove remaining `console.log` from CLI scripts (deploy-previews.ts, smoke-test.ts, seed.ts) — these are CLI tools, can keep

### 5. Expand Test Coverage
- [ ] Add tests for 8 untested services (offline, audit, cache, email, payroll, backup, notifications, setup)
- [ ] Raise test-to-source ratio from ~19% to 40%+

### 6. Dependency Cleanup
- [ ] Remove unused runtime deps: `@sentry/replay`, `@sentry/tracing`, `tailwind-merge`
- [ ] Remove unused devDeps: `husky`
- [ ] Add missing deps: `jspdf`, `html2canvas`, `@axe-core/react` (if needed)
