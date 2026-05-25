# Payroll Web — File-by-File Improvement & Refactor Checklist

**Generated 2026-05-26** · Checkboxes tracked as work progresses.

Sources: `.agents/plan/` (Refactor Backlog, QA Test Plan, Modernization Roadmap, UI/UX Plan), `REFACTOR.md`.

---

## ✔ Phase 0: Foundation & Infra (3 tasks)

- [x] **0.1** `tsconfig.json` — Add `ignoreDeprecations: "6.0"` (baseUrl deprecation)
- [x] **0.2** `src/test/setup.ts` — Enhanced: auto-mocks firebase/firestore, firebase/auth, firebase/storage, lucide-react; window.matchMedia, IntersectionObserver, ResizeObserver
- [x] **0.3** `src/__mocks__/firebase.ts` — Central mock factory (`createFirestoreMocks`, `createAuthMocks`, `createStorageMocks`, `addMockDocs`, `clearMockDocs`)
- [x] **0.4** `src/__mocks__/lucide-react.tsx` — 30 icon mocks as `data-testid` SVGs

---

## 📦 Phase 1: Services — Business Logic Tests (12 files)

- [x] **1.1** `src/services/payroll.test.ts` — Extract + test: gross pay, net pay, overtime, hourly/daily rate. 27 tests. Ref Backlog RB-005.
- [ ] **1.2** `src/services/firestore.test.ts` — Test: query building, error handling (permission-denied, not-found), CRUD wrappers.
- [ ] **1.3** `src/services/firestore-optimized.test.ts` — Test: caching layer, TTL expiry, cache-hit vs cache-miss.
- [ ] **1.4** `src/services/offline.test.ts` — Test: action queuing, sync retry, conflict resolution.
- [ ] **1.5** `src/services/audit.test.ts` — Test: audit event logging, payload formatting.
- [ ] **1.6** `src/services/backup.test.ts` — Test: backup trigger, status reporting.
- [ ] **1.7** `src/services/email.test.ts` — Test: email formatting, validation.
- [ ] **1.8** `src/services/notifications.test.ts` — Test: notification dispatch, dedup.
- [ ] **1.9** `src/services/reportScheduling.test.ts` — Test: schedule creation, cron parsing, trigger logic.
- [ ] **1.10** `src/services/setup.test.ts` — Test: setup wizard steps, validation.
- [ ] **1.11** `src/services/ipRestriction.test.ts` — Test: IP matching, allow/deny logic.
- [ ] **1.12** `src/services/twoFactorAuth.test.ts` — Test: TOTP generation/verification, backup codes.

---

## 🛠 Phase 2: Utils — Pure Function Tests (8 files)

- [ ] **2.1** `src/utils/currency.test.ts` — Format, parse, round for PHP/locales. Edge: zero, negative, large.
- [ ] **2.2** `src/utils/dateFormat.test.ts` — Payroll period dates, PH holidays, paydays.
- [ ] **2.3** `src/utils/validation.test.ts` — TIN, SSS, PhilHealth, Pag-IBIG, email formats.
- [ ] **2.4** `src/utils/exportUtils.test.ts` — CSV/PDF export, column mapping, large datasets.
- [ ] **2.5** `src/utils/calendarUtils.test.ts` — Workday calc, holiday exclusion, pay period boundaries.
- [ ] **2.6** `src/utils/importUtils.test.ts` — CSV import parsing, header mapping, error reporting.
- [ ] **2.7** `src/utils/dataCache.test.ts` — Cache read/write/invalidation, TTL.
- [ ] **2.8** `src/utils/encryption.test.ts` — Encrypt/decrypt round-trip, key management.

---

## 🪝 Phase 3: Hooks — Custom Hook Tests (9 files)

- [ ] **3.1** `src/hooks/useAuth.test.ts` — Context access, error when used outside provider.
- [ ] **3.2** `src/hooks/usePermissions.test.ts` — **Refactor**: extract permission matrix to pure fn. **Test**: canView/canEdit/canDelete for each Dept/Section.
- [ ] **3.3** `src/hooks/useToast.test.ts` — Context access, error boundary.
- [ ] **3.4** `src/hooks/useCompany.test.ts` — Context access.
- [ ] **3.5** `src/hooks/useNetworkStatus.test.ts` — Online/offline transitions, event cleanup.
- [ ] **3.6** `src/hooks/useKeyboardShortcuts.test.ts` — Shortcut registration, key matching, preventDefault.
- [ ] **3.7** `src/hooks/useActivityMonitor.test.ts` — Idle detection, activity reset, timeout callback.
- [ ] **3.8** `src/hooks/useUndoManager.test.ts` — Push/undo/redo stack, max history, clearing.
- [x] **3.9** `src/hooks/useTableSort.test.ts` — ✅ Existing (10 tests). Verify ≥80% coverage.

---

## 🧩 Phase 4: UI Components — Tests & Refactoring (16 files)

- [x] **4.1** `src/components/ui/Button/Button.tsx` — ✅ Existing (14 tests). Consider: loading state.
- [ ] **4.2** `src/components/ui/ErrorBoundary/ErrorBoundary.test.tsx` — Error catch, fallback UI, reset.
- [ ] **4.3** `src/components/ui/ProtectedRoute/ProtectedRoute.test.tsx` — Redirect unauthenticated, render children, loading spinner.
- [ ] **4.4** `src/components/ui/Toast.test.tsx` — **Refactor**: move flat file to `Toast/Toast.tsx`. **Test**: add/remove, auto-dismiss, multiple toasts.
- [ ] **4.5** `src/components/ui/ConfirmDialog/ConfirmDialog.test.tsx` — Open/close, confirm/cancel, keyboard trap, Escape.
- [ ] **4.6** `src/components/ui/Pagination/Pagination.test.tsx` — Page nav, ellipsis, disabled boundaries.
- [ ] **4.7** `src/components/ui/SearchBar/SearchBar.test.tsx` — Debounced input, clear, controlled sync.
- [ ] **4.8** `src/components/ui/Skeleton/Skeleton.test.tsx` — Variants: text/circular/rectangular, Card/Table/PageSkeleton.
- [ ] **4.9** `src/components/ui/EmptyState/EmptyState.test.tsx` — Icons, action button.
- [ ] **4.10** `src/components/ui/Card/Card.test.tsx` — Card, CardHeader, CardTitle, CardContent, CardFooter.
- [ ] **4.11** `src/components/ui/Input/Input.test.tsx` — Value change, placeholder, disabled, error styling.
- [ ] **4.12** `src/components/ui/Stepper/Stepper.test.tsx` — Step progression, active/completed/disabled states.
- [ ] **4.13** `src/components/ui/EditableCell/EditableCell.test.tsx` — Click-to-edit, Enter/Escape, commit/cancel.
- [ ] **4.14** `src/components/ui/VirtualScroll/VirtualScroll.test.tsx` — Visible window, scroll, row rendering.
- [ ] **4.15** `src/components/ui/AlertBanner/AlertBanner.test.tsx` — Variants, dismiss, system alert generation.
- [ ] **4.16** `src/components/ui/NetworkStatusBanner/NetworkStatusBanner.test.tsx` — Visibility toggle, dismiss.

---

## 🧱 Phase 5: Layout Components — Tests (4 files)

- [ ] **5.1** `src/components/layout/AppLayout/AppLayout.test.tsx` — Outlet, sidebar/header, offline sync.
- [ ] **5.2** `src/components/layout/Header/Header.test.tsx` — Company switcher, user menu, breadcrumb.
- [ ] **5.3** `src/components/layout/Sidebar/Sidebar.test.tsx` — **Refactor**: extract nav config outside component. **Test**: nav links, active state, permission visibility.
- [ ] **5.4** `src/components/layout/Breadcrumb/Breadcrumb.test.tsx` — Trail generation, link clicks.

---

## 🧾 Phase 6: Payroll Components (1 file)

- [ ] **6.1** `src/components/payroll/PayrollOutputView/PayrollOutputView.tsx` (1354 lines) — **Refactor**: extract `PrintHeader`, `PrintFooter`, `formatCurrency` outside component (fixes lint errors). Split by print mode. **Test**: each variant.

---

## 🏗 Phase 7: Large Page Decomposition (6 files)

- [ ] **7.1** `src/pages/system/SystemPages/SystemPages.tsx` (3592 lines) — Split into 7 individual page files (`CalendarPage`, `TermsPage`, `UsersPage`, `RestrictionsPage`, `AuditPage`, `DatabasePage`, `UserActivityPage`).
- [ ] **7.2** `src/pages/payroll/PayrollDetailPage/PayrollDetailPage.tsx` (1454 lines) — Extract computation display, employee grid. Add tests.
- [ ] **7.3** `src/pages/dtr/DTRPage/DTRPage.tsx` (1429 lines) — Extract DTR computation, calendar, employee selector. Add tests.
- [ ] **7.4** `src/pages/lists/ListPages/ListPages.tsx` (1265 lines) — Split into `BenefitsPage`, `EarningsPage`, `DeductionsPage`.
- [ ] **7.5** `src/pages/payroll/PayrollWizardPage/PayrollWizardPage.tsx` (851 lines) — Extract wizard steps. Test step navigation, validation.
- [ ] **7.6** `src/pages/employees/EmployeeProfilePage/EmployeeProfilePage.tsx` (~500 lines) — Extract profile sections, improve save bar.

---

## 🔍 Phase 8: Page Smoke Tests (20+ files)

### Auth (P1 — 3 tests each)
- [ ] **8.1** `LoginPage.test.tsx` — renders, form submit, error state
- [ ] **8.2** `ForgotPasswordPage.test.tsx` — renders, form submit, error state
- [ ] **8.3** `ChangePasswordPage.test.tsx` — renders, form submit, error state
- [ ] **8.4** `UserSettingsPage.test.tsx` — renders, form submit, error state
- [ ] **8.5** `SetupPage.test.tsx` — renders, form submit, error state

### Employees (P2 — 2 tests each)
- [ ] **8.6** `EmployeesPage.test.tsx`
- [ ] **8.7** `GroupsPage.test.tsx`
- [ ] **8.8** `PositionsPage.test.tsx`
- [ ] **8.9** `AreasPage.test.tsx`
- [ ] **8.10** `CalendarPage.test.tsx`

### Payroll (P1 — 3 tests each)
- [ ] **8.11** `PayrollRunsPage.test.tsx`
- [ ] **8.12** `TemplatesPage.test.tsx`
- [ ] **8.13** `PrintFormatsPage.test.tsx`

### Reports (P2 — 1 test each)
- [ ] **8.14** `PayrollSummaryPage.test.tsx`
- [ ] **8.15** `EmployeeReportPage.test.tsx`
- [ ] **8.16** `EarningsDeductionsReportPage.test.tsx`
- [ ] **8.17** `AttendanceReportPage.test.tsx`
- [ ] **8.18** `BenefitsUtilizationReportPage.test.tsx`
- [ ] **8.19** `Report13thMonthPage.test.tsx`
- [ ] **8.20** `YearEndReportPage.test.tsx`
- [ ] **8.21** `CustomReportBuilderPage.test.tsx`

### System (P2 — 2 tests each)
- [ ] **8.22** `CompaniesPage.test.tsx`
- [ ] **8.23** `CompanySettingsPage.test.tsx`
- [ ] **8.24** `SystemSettingsPage.test.tsx`
- [ ] **8.25** `TrashPage.test.tsx`
- [ ] **8.26** `HealthCheckPage.test.tsx`

### Company Select / Dashboard
- [ ] **8.27** `CompanySelectPage.test.tsx`
- [ ] **8.28** `DashboardPage.test.tsx`

---

## 🔧 Phase 9: Remaining REFACTOR.md Items

- [ ] **9.1** `Sidebar/Sidebar.tsx` — Fix `any` types, extract nav config, move inline components
- [ ] **9.2** `PayrollOutputView/PayrollOutputView.tsx` — Fix `react-hooks/static-components` (PrintHeader, PrintFooter)
- [ ] **9.3** `DTRPage/DTRPage.tsx` — Fix `setState` in effect warnings
- [ ] **9.4** `ListPages/ListPages.tsx` — Fix `setState` in effect warnings
- [ ] **9.5** `NamesListPage/NamesListPage.tsx` — Fix lint warnings
- [ ] **9.6** `EmployeeProfilePage/EmployeeProfilePage.tsx` — Fix `@ts-nocheck`, fix `any` types
- [ ] **9.7** `PositionsPage/PositionsPage.tsx` — Fix `setState` in effect
- [ ] **9.8** `GroupsPage/GroupsPage.tsx` — Fix `setState` in effect
- [ ] **9.9** `AreasPage/AreasPage.tsx` — Fix `setState` in effect
- [ ] **9.10** `EmployeesPage/EmployeesPage.tsx` — Fix `any` types
- [ ] **9.11** `TemplatesPage/TemplatesPage.tsx` — Fix `setState` in effect
- [ ] **9.12** `CustomReportBuilderPage/CustomReportBuilderPage.tsx` — Fix `@ts-nocheck`, add types
- [x] **9.13** `HealthCheckPage/HealthCheckPage.tsx` — ✅ `any` types fixed

---

## 🔗 Phase 10: Integration & E2E Flows (6 flows)

- [ ] **10.1** Auth: login → logout → session expiry (`src/test/flows/auth.test.ts`)
- [ ] **10.2** Employee: create → update → list → view profile (`src/test/flows/employee.test.ts`)
- [ ] **10.3** Payroll: template → run → assign → compute → lock (`src/test/flows/payroll-run.test.ts`)
- [ ] **10.4** DTR: clock-in → clock-out → overtime → approve (`src/test/flows/dtr.test.ts`)
- [ ] **10.5** Reports: summary → CSV export → verify totals (`src/test/flows/reports.test.ts`)
- [ ] **10.6** Company: switch → verify data isolation (`src/test/flows/company-switch.test.ts`)

---

## ✅ Current Status

| Metric | Value |
|---|---|
| **REFACTOR.md** | 17 / 60 items complete |
| **Test files** | 6 existing, ~50 needed |
| **Lint** | 0 errors, 2 warnings |
| **Type-check** | pass |
| **Build** | pass |

---

## Validation Gate (every phase)

```bash
yarn run lint     # 0 errors
yarn run test     # all pass
yarn run build    # pass
```
