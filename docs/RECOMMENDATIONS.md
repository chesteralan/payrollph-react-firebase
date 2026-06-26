# PayrollPH — Strategic Recommendations

Based on full codebase audit, Fallow analysis, and code quality review.
Date: June 2026

---

## Phase 1 — Fix the Foundations (do this first)

Non-negotiables. Do not add features until these are done.

| # | Action | File(s) | Severity | Effort |
|---|--------|---------|----------|--------|
| 1 | Remove `// -nocheck` from 3 files | `PayrollDetailPage.tsx`, `reportScheduling.ts`, `email.ts` | 🔴 Critical | ~2h |
| 2 | Fix N+1 queries (batch Firestore reads) | `src/services/payroll.ts` — `fetchEmployeeDetails` | 🔴 Critical | ~1h |
| 3 | Wire or delete alerting/uptime configs | `src/config/alerting.ts`, `src/config/uptime.ts` | 🔴 Critical | ~1h |
| 4 | Add runtime validation to Firestore service | `src/services/firestore.ts` — `as T` casts | 🔴 Critical | ~2h |

### Why these first

- **#1** — Core payroll logic has zero TypeScript guard. Any type error passes CI silently and hits production.
- **#2** — A 500-employee payroll triggers 500+ individual Firestore reads. Hits latency and Firebase bill equally.
- **#3** — 6 alert rules and 4 uptime checks are configured but never run. They're expensive-looking dead code.
- **#4** — Firestore schema drift produces silent NaN values in payroll calculations with `as T` casts.

---

## Phase 2 — Close the Gaps

| # | Action | File(s) | Severity | Effort |
|---|--------|---------|----------|--------|
| 5 | Extract `usePayrollDetail` hook | `PayrollDetailPage.tsx` (949 lines) | 🟠 High | ~2h |
| 6 | Extract `useDTRPage` hook | `DTRPage.tsx` (697 lines) | 🟠 High | ~1.5h |
| 7 | Implement real `exportToXlsx`/`exportToCsv` | `src/services/reportScheduling.ts` | 🟠 High | ~1h |
| 8 | Deploy email Cloud Function or remove fetch | `src/services/email.ts` | 🟠 High | ~1h |

### Why these next

- **#5** — 52 cyclomatic complexity, 20+ state variables. Hardest file to debug in the codebase.
- **#6** — Same pattern as #5 — too many concerns in one component.
- **#7** — Placeholder functions return fake Google Storage URLs. Any actual report scheduling silently produces 404s.
- **#8** — POSTs to `/api/send-email` which doesn't exist. All email sends silently fail.

---

## Phase 3 — Operational Maturity

| # | Action | File(s) | Severity | Effort |
|---|--------|---------|----------|--------|
| 9 | Render AlertBanner/NetworkStatusBanner in AppLayout | `AppLayout.tsx` | 🟢 Low | ~30min |
| 10 | Refactor routes to config array | `App.routes.tsx` (500 lines) | 🟢 Low | ~1h |
| 11 | Extract shared calendar primitives | `DTRPage/` + `CalendarPage.tsx` | 🟢 Low | ~2h |
| 12 | Add loading/error states to CRUD pages | `AreasPage`, `GroupsPage`, `PositionsPage` | 🟢 Low | ~1h |
| 13 | Move ValueStore sync to useEffect in AuthContext | `src/context/AuthContext/AuthContext.tsx` | 🔴 Critical | ~30min |
| 14 | Add useCallback to usePermissions helpers | `src/hooks/usePermissions.ts` | 🟡 Medium | ~15min |
| 15 | Guard console.warn behind `import.meta.env.DEV` | `src/config/firebase.ts` | 🟡 Medium | ~5min |
| 16 | Remove inline Cloud Function strings | `reportScheduling.ts`, `email.ts` | 🟡 Medium | ~15min |
| 17 | Remove stale type declarations | `src/types/third-party.d.ts` | 🟡 Medium | ~15min |
| 18 | Add tests for alerting/uptime configs | `src/config/alerting.ts`, `src/config/uptime.ts` | 🟡 Medium | ~30min |

---

## Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 — Foundations | 4 | **~6 hours** |
| Phase 2 — Gaps | 4 | **~5.5 hours** |
| Phase 3 — Maturity | 10 | **~7 hours** |
| **Total** | **18** | **~18.5 hours** |

---

## Project Strengths (Current State)

- **Comprehensive test suite** — 100 test files, 47% test-to-source ratio
- **Strong type definitions** — 7 type modules covering all domains
- **Repository pattern** — Type-safe data access layer in `services/repositories/`
- **Route-level code splitting** — All pages use `React.lazy()` via `LazyPage`
- **Firebase mock layer** — Isolated, predictable test environment
- **Fallow score**: 73 B (maintainability 90.3, 12.1% duplication)
- **0 TypeScript errors** — `tsc --noEmit` passes clean
- **0 ESLint errors** — All lint rules pass

---

## Key Risks

1. **PayrollDetailPage.tsx** has `// -nocheck` — core business logic bypasses TypeScript entirely
2. **reportScheduling.ts** has `// -nocheck` — report scheduling bypasses TypeScript
3. **email.ts** has `// -nocheck` — email service bypasses TypeScript
4. **6 alerting rules** defined but never executed
5. **4 uptime checks** defined but never executed
6. **N+1 queries** in employee detail fetching — O(n) Firestore reads
7. **ValueStore sync during render** — unnecessary subscriber notifications on every AuthProvider render
