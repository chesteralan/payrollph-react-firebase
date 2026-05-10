# Refactor Plan

This document tracks files that need refactoring in the Payroll v2 React/Firebase application. Each file should be reviewed and refactored according to the guidelines below.

## General Instructions

1. **Replace `any` types** — Use proper TypeScript types/interfaces instead of `any`. Add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` only when absolutely necessary with a justification comment.

2. **Remove unused code** — Delete unused imports, variables, parameters, and functions. Prefix intentionally unused parameters with `_`.

3. **Fix hook ordering** — Move `const fetchX = async () => {...}` functions above the `useEffect` that calls them to satisfy `react-hooks/immutability`.

4. **Fix setState in effects** — Replace `useEffect` that calls `setState` synchronously with derived state via `useMemo`, or add eslint-disable with a comment explaining why it's intentional.

5. **Add missing dependencies** — Include all referenced variables/functions in `useEffect`/`useMemo`/`useCallback` dependency arrays, or restructure to avoid stale closures.

6. **Move inline components** — Component definitions (e.g. `const StatusIcon = (...) => (...)`) must be outside the parent component's render function.

7. **Standardize error handling** — Use consistent try/catch patterns with toast notifications. Remove `confirm()` dialogs; use the `ConfirmDialog` component instead.

8. **Use proper imports** — Import `useRef`, `useMemo`, `useCallback` from React where used. Remove unused imports.

9. **Fix empty blocks** — Remove empty `if`/`catch` blocks or add meaningful content/comments.

10. **Consolidate exports** — Move non-component exports to separate files to satisfy `react-refresh/only-export-components`.

11. **Abstract large components** — If a component exceeds ~200–300 lines or handles multiple responsibilities, split it into smaller presentational and container components.

12. **Extract reusable UI** — Repeated JSX blocks should be extracted into reusable components instead of duplicated inline.

13. **Move business logic to hooks** — Complex state management, data fetching, filtering, or side effects should be moved into custom hooks (`useXyz`) to keep components focused on rendering.

14. **Separate concerns by file type** — Prefer organizing code into:
    - `Component.tsx`
    - `Component.types.ts`
    - `Component.hooks.ts`
    - `Component.utils.ts`
    - `Component.constants.ts`
    
    when complexity increases.

15. **Avoid deeply nested JSX** — Extract nested conditional rendering or large render blocks into smaller components or helper render functions.

16. **Reduce prop drilling** — If props are passed through multiple layers unnecessarily, introduce context, composition, or local abstraction.

17. **Keep components single-purpose** — A component should ideally have one clear responsibility. Split components handling unrelated UI behaviors.

18. **Extract static configuration** — Move static arrays, mappings, table columns, menu configs, and constants outside component bodies.

19. **Memoize expensive calculations** — Use `useMemo` for expensive derived values and `useCallback` for stable callbacks passed to children.

20. **Prefer composition over condition-heavy components** — Instead of large components with many boolean flags, create smaller composable variants.

21. **Create shared primitives** — Promote repeated patterns (buttons, cards, modals, loaders, empty states, form sections) into shared UI primitives.

22. **Limit component nesting depth** — Avoid components with excessive indentation or nested ternaries. Refactor into readable subcomponents.

23. **Extract table/list row items** — Large `.map()` render blocks should become dedicated row/item components.

24. **Move utility functions outside components** — Pure helper functions should not be recreated on every render.

25. **Co-locate related tests and stories** — When refactoring components, also update or create:
    - `Component.test.tsx`
    - `Component.stories.tsx`
    
    if applicable.

26. **Improve naming clarity** — Rename vague variables/functions/components (`data`, `item`, `handleStuff`) to descriptive names.

27. **Prefer declarative patterns** — Replace imperative DOM manipulation or branching-heavy logic with declarative React patterns.

28. **Avoid massive prop interfaces** — If prop interfaces become too large, group related props into objects or extract subcomponents.

29. **Keep render functions clean** — Avoid large inline anonymous functions in JSX. Extract handlers and render helpers where appropriate.

30. **Refactor progressively** — Large refactors should preserve behavior. Avoid mixing formatting-only changes with architectural changes unless necessary.

31. **Use sub-agents for each task** — Perform each major refactoring task in an isolated sub-agent or independent execution context whenever possible. Examples include:
    - Type cleanup
    - Hook dependency fixes
    - Component extraction
    - Test updates
    - Utility extraction
    - Performance optimization
    
    Each sub-agent should focus on a single responsibility to reduce regression risk, improve reviewability, and keep changes scoped and modular.

32. **Keep sub-agent changes isolated** — Avoid having multiple sub-agents modify the same logic simultaneously unless coordination is required. Prefer sequential refactors for shared areas.

33. **Validate after each sub-task** — After each sub-agent completes its work:
    - Run lint
    - Run type-check
    - Run tests
    
    Fix issues before proceeding to the next task.

34. **Prefer small reviewable commits** — Each sub-agent should produce logically grouped changes that can be reviewed independently.

35. **Document architectural refactors** — If a sub-agent introduces major abstractions, shared hooks, providers, or folder restructuring, document the reasoning in comments or PR notes.

36. **Group related component files into a dedicated folder** — When a component grows beyond a single file or has related hooks, utilities, constants, tests, or stories, organize them into a folder named after the component.

    Example structure:

    ```txt
    components/
      UserTable/
        UserTable.tsx
        UserTable.types.ts
        UserTable.hooks.ts
        UserTable.utils.ts
        UserTable.constants.ts
        UserTable.test.tsx
        UserTable.stories.tsx
        index.ts
    ```

    Guidelines:
    - Keep all component-specific logic co-located inside the component folder.
    - Export public APIs through `index.ts` where appropriate.
    - Shared utilities/hooks should only be promoted to global/shared directories if reused across multiple domains.
    - Avoid dumping unrelated files into generic folders like `utils/` or `hooks/` when they are tightly coupled to a component.
    - Prefer feature-based organization over file-type-only organization for scalable modules.

## Refactor Checklist

- [ ] `./src/App.tsx`
- [ ] `./src/main.tsx`
- [ ] `./src/context/AuthContext.tsx`
- [ ] `./src/context/CompanyContext.tsx`
- [ ] `./src/components/ui/Button.test.tsx`
- [ ] `./src/components/ui/ConfirmDialog.tsx`
- [ ] `./src/components/ui/Pagination.tsx`
- [ ] `./src/components/ui/Card.tsx`
- [ ] `./src/components/ui/ProtectedRoute.tsx`
- [ ] `./src/components/ui/VirtualScroll.tsx`
- [ ] `./src/components/ui/SearchBar.tsx`
- [ ] `./src/components/ui/NetworkStatusBanner.tsx`
- [ ] `./src/components/ui/AlertBanner.tsx`
- [ ] `./src/components/ui/Button.tsx`
- [ ] `./src/components/ui/Toast.tsx`
- [ ] `./src/components/ui/EditableCell.tsx`
- [ ] `./src/components/ui/Stepper.tsx`
- [ ] `./src/components/ui/EmptyState.tsx`
- [ ] `./src/components/ui/Input.tsx`
- [ ] `./src/components/ui/Skeleton.tsx`
- [ ] `./src/components/ui/ErrorBoundary.tsx`
- [ ] `./src/components/layout/AppLayout.tsx`
- [ ] `./src/components/layout/Breadcrumb.tsx`
- [ ] `./src/components/layout/Header.tsx`
- [ ] `./src/components/layout/Sidebar.tsx`
- [ ] `./src/components/payroll/PayrollOutputView.tsx`
- [ ] `./src/pages/dtr/DTRPage.tsx`
- [ ] `./src/pages/lists/ListPages.tsx`
- [ ] `./src/pages/lists/NamesListPage.tsx`
- [ ] `./src/pages/auth/LoginPage.tsx`
- [ ] `./src/pages/auth/ForgotPasswordPage.tsx`
- [ ] `./src/pages/auth/ChangePasswordPage.tsx`
- [ ] `./src/pages/auth/UserSettingsPage.tsx`
- [ ] `./src/pages/auth/SetupPage.tsx`
- [ ] `./src/pages/dashboard/DashboardPage.tsx`
- [ ] `./src/pages/system/SystemSettingsPage.tsx`
- [ ] `./src/pages/system/TrashPage.tsx`
- [ ] `./src/pages/system/CompanySettingsPage.tsx`
- [ ] `./src/pages/system/SystemPages.tsx`
- [ ] `./src/pages/system/CompaniesPage.tsx`
- [ ] `./src/pages/system/HealthCheckPage.tsx`
- [ ] `./src/pages/company-select/CompanySelectPage.tsx`
- [ ] `./src/pages/payroll/TemplatesPage.tsx`
- [ ] `./src/pages/payroll/PayrollWizardPage.tsx`
- [ ] `./src/pages/payroll/PayrollDetailPage.tsx`
- [ ] `./src/pages/payroll/PrintFormatsPage.tsx`
- [ ] `./src/pages/payroll/PayrollRunsPage.tsx`
- [ ] `./src/pages/reports/YearEndReportPage.tsx`
- [ ] `./src/pages/reports/EmployeeReportPage.tsx`
- [ ] `./src/pages/reports/EarningsDeductionsReportPage.tsx`
- [ ] `./src/pages/reports/CustomReportBuilderPage.tsx`
- [ ] `./src/pages/reports/Report13thMonthPage.tsx`
- [ ] `./src/pages/reports/PayrollSummaryPage.tsx`
- [ ] `./src/pages/reports/AttendanceReportPage.tsx`
- [ ] `./src/pages/reports/BenefitsUtilizationReportPage.tsx`
- [ ] `./src/pages/employees/EmployeeProfilePage.tsx`
- [ ] `./src/pages/employees/CalendarPage.tsx`
- [ ] `./src/pages/employees/PositionsPage.tsx`
- [ ] `./src/pages/employees/GroupsPage.tsx`
- [ ] `./src/pages/employees/AreasPage.tsx`
- [ ] `./src/pages/employees/EmployeesPage.tsx`
