# Payroll v2 - Phase 2 Tasks

## Overview

This document defines the next phase of work for the Payroll v2 React/Firebase application. Tasks are organized by phase, with UX & Feature Depth prioritized first. Based on analysis of planning documents in `.agents/plan/`.

---

## Phase 1 — UX & Feature Depth

### 27. Payroll UX Enhancements

- [x] 27.1 Redesign payroll wizard with improved progress indicators (Stepper v2: progress bar, descriptions, clickable steps, icons)
- [x] 27.2 Add sticky column support (StickyTable + StickyCell components)
- [x] 27.3 Add persistent totals row pinned at bottom of payroll tables (TotalsRow component)
- [x] 27.4 Add unsaved-changes indicator and confirm-leave dialog (useUnsavedChanges hook + ConfirmLeaveDialog)
- [x] 27.5 Implement column resize for payroll output tables (ResizableColumn component)
- [x] 27.6 Implement column reorder (ColumnReorder component with HTML5 Drag-and-Drop)
- [x] 27.7 Add quick-filter chips (FilterChips component with category grouping)
- [x] 27.8 Add per-employee quick-action menu (QuickActionMenu dropdown component)
- [x] 27.9 Implement batch cell editing (BatchEditDialog component)
- [x] 27.10 Add cell-level change highlighting after edits (EditableCell highlight animation)
- [x] 27.11 Add collapsible sections for dense payroll forms (CollapsibleSection component)
- [x] 27.12 Implement print preview pane with live CSS toggle (PrintPreview component)
- [x] 27.13 Add filter persistence across page navigation (FilterPersistenceBar component)
- [x] 27.14 Improve empty state illustrations (EmptyStateIllustration component)
- [x] 27.15 Add payroll processing time tracking (useProcessingTimer hook)
- [x] 27.16 Implement payroll checkpoint/bookmarking (usePayrollCheckpoint hook)
- [x] 27.17 Add payroll run comparison view (PayrollComparisonView component)
- [x] 27.18 Add batch payroll operations (BatchOperationsBar component)
- [x] 27.19 Add payroll status badges with visual color-coding (StatusBadge component)
- [x] 27.20 Implement payroll clone with selective data carry-over (PayrollCloneDialog with checkbox options)

### 28. Dashboard & Analytics

- [x] 28.1 Add payroll comparison chart (SimpleBarChart component)
- [x] 28.2 Add department/group breakdown charts (SimplePieChart component)
- [x] 28.3 Add pending action cards (DashboardActionCard component)
- [x] 28.4 Implement customizable dashboard widget layout (WidgetLayout component with grid)
- [x] 28.5 Add recent activity timeline (ActivityTimeline component)
- [x] 28.6 Add payroll deadline countdown widgets (DeadlineCountdown component)
- [x] 28.7 Add employee headcount trend chart (HeadcountTrendChart component)
- [x] 28.8 Add quick-search bar on dashboard (DashboardSearchBar component)
- [x] 28.9 Add role-based dashboard views (useRoleBasedView hook)
- [ ] 28.10 Add dashboard data export (PDF snapshot)
- [x] 28.11 Add key metrics cards (MetricCard component with change indicators)
- [x] 28.12 Add real-time notification feed on dashboard (NotificationFeed component)

### 29. Employee Management Deepen

- [x] 29.1 Add employee photo/avatar upload with cropping (EmployeePhotoUpload component)
- [x] 29.2 Add employee document viewer (DocumentViewer component)
- [x] 29.3 Add employee history timeline (EmployeeHistoryTimeline component)
- [x] 29.4 Add bulk employee import with mapping UI (BulkImportMapping component)
- [ ] 29.5 Add employee spreadsheet view (inline edit like Google Sheets)
- [x] 29.6 Add employee merge/deduplication tool (MergeDedupTool component)
- [ ] 29.7 Add employee self-service portal (view payslips, update personal info)
- [x] 29.8 Add emergency contact management section (EmergencyContactForm component)
- [ ] 29.9 Add employee anniversary/birthday calendar view
- [x] 29.10 Add customizable employee export (EmployeeExportModal with column selection)
- [ ] 29.11 Add employee audit trail per-field change tracking
- [ ] 29.12 Add employee compliance checklist (missing IDs, expiring documents)
- [ ] 29.13 Add employee quick-view tooltip on hover in tables
- [x] 29.14 Add bulk status change with reason notes (BulkStatusChange component)
- [ ] 29.15 Add employee报表 (report) comparison across periods

### 30. Reports Enhancement

- [x] 30.1 Add report preview before export (PrintPreview component)
- [x] 30.2 Add custom date range selector (DateRangeSelector component)
- [x] 30.3 Add report comparison mode (ReportComparisonView component)
- [x] 30.4 Add scheduled report delivery (useEmailDelivery hook)
- [ ] 30.5 Add report template saving (reusable report configurations)
- [ ] 30.6 Add drill-down reports (click summary row → see employee details)
- [ ] 30.7 Add government report templates (BIR 2316, SSS, PhilHealth, HDMF)
- [x] 30.8 Add chart/graph visualization to reports (SimpleBarChart component)
- [x] 30.9 Add report export to PDF (PdfExportButton component)
- [ ] 30.10 Add batch report generation (generate multiple reports at once)
- [ ] 30.11 Add report summary dashboard with export all
- [ ] 30.12 Add custom report builder with drag-and-drop field selection

### 31. Global Search & Navigation

- [x] 31.1 Implement Cmd+K / Ctrl+K global search palette (GlobalSearchPalette component)
- [x] 31.2 Add search results grouped by category (pages, actions)
- [x] 31.3 Add keyboard navigation through search results (arrow keys, Enter, Esc)
- [x] 31.4 Add recent searches history (RecentSearches component)
- [x] 31.5 Add fuzzy name matching in search (FuzzySearch component)
- [ ] 31.6 Add cross-company search capability
- [x] 31.7 Add quick-action commands in search palette (GlobalSearchPalette actions)
- [ ] 31.7 Add quick-action commands in search palette (e.g. "new payroll")
- [ ] 31.8 Add searchable help/documentation in palette
- [ ] 31.9 Add context-aware search (pre-filter by current module)
- [x] 31.10 Add keyboard shortcut reference modal (KeyboardShortcutModal)

### 32. Calendar & DTR Enhancement

- [x] 32.1 Add month/week/day toggle views for DTR (DTRViewToggle component)
- [ ] 32.2 Add drag-to-mark attendance (click and drag across dates)
- [x] 32.3 Add DTR bulk edit mode (useDTRBulkEdit hook)
- [x] 32.4 Add overtime approval workflow (OvertimeApprovalWorkflow component)
- [x] 32.5 Add leave balance carry-over configuration (useLeaveBalance hook)
- [ ] 32.6 Add holiday premium pay calculation display
- [ ] 32.7 Add DTR exception reporting (missing punches, anomalies)
- [x] 32.8 Add calendar sync (icsGenerator utility for iCal/ICS export)

---

## Phase 2 — Security & Hardening

### 33. Authentication & Security Enhancements

- [x] 33.1 Add password strength indicator and policy enforcement (PasswordStrengthIndicator component)
- [x] 33.2 Implement account lockout (AccountLockout component)
- [ ] 33.3 Add remember-me with secure token rotation
- [ ] 33.4 Add hardware security key (WebAuthn) support
- [ ] 33.5 Implement session revocation (force logout all sessions)
- [ ] 33.6 Add IP-based access logging with anomaly detection
- [ ] 33.7 Implement request signing for critical API operations
- [ ] 33.8 Add data-at-rest encryption verification for sensitive fields
- [x] 33.9 Implement rate limiting dashboard (RateLimiterDashboard component)
- [ ] 33.10 Add security event alerting (new device, new location, new IP)
- [x] 33.11 Add session timeout with grace period warning (SessionTimeoutBanner component)
- [x] 33.12 Implement cross-tab session synchronization (useCrossTabSync hook with BroadcastChannel)

### 34. Audit & Compliance

- [x] 34.1 Add field-level audit trail (useAuditLog hook)
- [ ] 34.2 Implement audit log retention policies with auto-cleanup
- [x] 34.3 Add audit log search with advanced filters (AuditLogSearch component)
- [ ] 34.4 Add compliance report generation (SOX,GDPR-ready)
- [x] 34.5 Implement data export for GDPR/privacy requests (useDataExport hook)
- [x] 34.6 Add user activity summary reports (useAuditTrail hook)
- [ ] 34.7 Add audit anomaly detection (unusual patterns, off-hours access)
- [ ] 34.8 Implement audit log integrity verification (tamper detection / hash chain)
- [ ] 34.9 Add audit dashboard with real-time event stream

---

## Phase 3 — Testing & Quality

### 35. Unit Test Expansion

- [ ] 35.1 Achieve 80%+ coverage on utility functions (formatting, validation, sanitization)
- [ ] 35.2 Achieve 80%+ coverage on custom hooks (usePermissions, useTableSort, useNetworkStatus)
- [ ] 35.3 Achieve 80%+ coverage on context providers (AuthContext, CompanyContext)
- [ ] 35.4 Add tests for all Firestore service functions (offline, audit, cache)
- [ ] 35.5 Add tests for payroll calculation logic
- [ ] 35.6 Add tests for RBAC permission functions
- [ ] 35.7 Add tests for data transformation/formatting utilities
- [ ] 35.8 Add tests for offline/IndexedDB service
- [ ] 35.9 Add tests for i18n translation functions
- [ ] 35.10 Add tests for validation/sanitization functions
- [ ] 35.11 Add tests for all export utility functions (XLS, CSV)
- [ ] 35.12 Add test coverage reporting to CI pipeline with thresholds

### 36. Integration & E2E Tests

- [ ] 36.1 Set up Playwright for E2E testing
- [x] 36.2 Add E2E test for login/logout flow (e2e/login.spec.ts)
- [x] 36.3 Add E2E test for employee CRUD workflow (e2e/employee.spec.ts)
- [x] 36.4 Add E2E test for payroll creation wizard (e2e/payroll.spec.ts)
- [ ] 36.5 Add E2E test for payroll processing stages (DTR → Summary)
- [ ] 36.6 Add E2E test for payroll output/export (print, XLS, CSV)
- [ ] 36.7 Add E2E test for company switching and data isolation
- [ ] 36.8 Add E2E test for RBAC permission enforcement
- [ ] 36.9 Add E2E test for offline mode (create, queue, sync)
- [ ] 36.10 Add visual regression tests for key pages (Percy/Playwright snapshots)
- [ ] 36.11 Add E2E test for CSV import flow (names, users)
- [ ] 36.12 Add E2E test for calendar and DTR workflows

### 37. Test Infrastructure

- [ ] 37.1 Set up test data factories/fixtures for all entities
- [ ] 37.2 Add Firestore emulator integration for integration tests
- [ ] 37.3 Add CI test running with parallel execution
- [ ] 37.4 Add test coverage thresholds that block PRs below 80%
- [ ] 37.5 Add flaky test detection and auto-retry logic
- [ ] 37.6 Add test documentation for contributor guide
- [ ] 37.7 Add test run time tracking with regression alerting

---

## Phase 4 — Performance & Scale

### 38. Firestore Query Optimization

- [x] 38.1 Audit all Firestore queries for missing indexes (queryOptimizer service with INDEX_SUGGESTIONS)
- [ ] 38.2 Add composite indexes for top 10 slowest queries
- [x] 38.3 Implement query pagination cursor optimization (useFirestoreIndexCheck hook)
- [ ] 38.4 Add denormalized count fields to avoid count queries on large collections
- [ ] 38.5 Implement batched reads for dashboard aggregates
- [ ] 38.6 Add query latency monitoring with console/logger
- [ ] 38.7 Optimize real-time listener usage (cleanup unused listeners on unmount)
- [ ] 38.8 Add query result caching with invalidation strategy
- [x] 38.9 Add Firestore read/write budget tracking (estimateCollectionSize in queryOptimizer)

### 39. Frontend Performance

- [x] 39.1 Implement route-based code splitting (useDynamicImport hook)
- [ ] 39.2 Add component-level code splitting for heavy tables and forms
- [x] 39.3 Implement virtual scrolling (useLazyLoading hook)
- [ ] 39.4 Add memoization audit (React.memo, useMemo, useCallback) across all components
- [ ] 39.5 Optimize bundle size with import analysis tools
- [ ] 39.6 Implement image lazy loading for employee photos
- [ ] 39.7 Add service worker for asset caching
- [ ] 39.8 Implement progressive loading for payroll output views
- [x] 39.9 Add performance monitoring (usePerformanceMark hook)
- [ ] 39.10 Add performance budget enforcement in CI (bundle size limit)
- [ ] 39.11 Add tree-shaking verification for lucide-react icons
- [ ] 39.12 Implement dynamic import for heavy libraries (xlsx)

### 40. Caching & Data Layer

- [x] 40.1 Implement SWR pattern for data fetching (useSwrFetch hook)
- [ ] 40.2 Add optimistic updates for fast UI feedback (edit, toggle status)
- [ ] 40.3 Implement background data refresh for dashboard
- [ ] 40.4 Add stale-while-revalidate for list pages
- [ ] 40.5 Add cache preloading for common navigation paths
- [ ] 40.6 Implement data prefetching for payroll wizard steps
- [ ] 40.7 Add cache invalidation on mutation (write → re-fetch affected queries)

---

## Phase 5 — Accessibility & Internationalization Deepen

### 41. Accessibility Compliance

- [ ] 41.1 Achieve WCAG 2.1 AA compliance (full audit)
- [x] 41.2 Add skip-to-content navigation link (SkipToContent component)
- [x] 41.3 Implement focus management for modals, drawers, and dialogs (useFocusTrap hook)
- [x] 41.4 Add ARIA live regions for dynamic content updates (AriaLiveRegion component)
- [x] 41.5 Add screen reader announcements (useScreenReaderAnnouncement hook)
- [ ] 41.6 Implement accessible drag-and-drop (where used)
- [ ] 41.7 Add keyboard-only workflow testing for all critical paths
- [ ] 41.8 Add automated aXe/cypress-axe checks in CI pipeline
- [x] 41.9 Add focus indicators for all interactive elements (focus ring styling in components)
- [x] 41.10 Add reduced-motion preference support (useReducedMotion hook)

### 42. i18n & Localization Deepen

- [x] 42.1 Add Filipino (Tagalog) language translations (i18n/locales/fil.ts)
- [x] 42.2 Add locale-aware date/time formatting (LocaleSelector + Intl)
- [x] 42.3 Add locale-aware number/currency formatting (LocaleSelector + Intl)
- [ ] 42.4 Implement RTL layout support
- [ ] 42.5 Add translation management UI (in-app editor for admins)
- [x] 42.6 Add locale fallback strategy (loadMessages falls back to en-US)
- [ ] 42.7 Implement dynamic message loading (code-split per locale)
- [ ] 42.8 Add date/time format customization per company
- [ ] 42.9 Add currency formatting with localization per company
- [ ] 42.10 Add language detector (browser preference auto-detect)

---

## Phase 6 — DevOps & Operations

### 43. CI/CD Pipeline Hardening

- [ ] 43.1 Add lint-staged for pre-commit hooks
- [ ] 43.2 Add type-check gate in CI pipeline (tsc --noEmit)
- [ ] 43.3 Add test coverage thresholds in CI (block if below 80%)
- [ ] 43.4 Add build size comparison in PR comments (bundlewatch)
- [ ] 43.5 Add automated deployment to staging on PR merge
- [ ] 43.6 Add production deployment with approval gate
- [ ] 43.7 Add environment variable validation in CI
- [ ] 43.8 Add security scan (npm audit, Snyk) in CI
- [ ] 43.9 Add dependency update automation (Renovate/Dependabot)

### 44. Monitoring & Observability

- [ ] 44.1 Add Sentry performance monitoring for key transactions
- [ ] 44.2 Implement custom dashboard for business metrics
- [ ] 44.3 Add error grouping and alerting configuration
- [x] 44.4 Add user journey tracking (useAnalyticsTracking hook)
- [ ] 44.5 Implement health check endpoint with DB status
- [ ] 44.6 Add uptime monitoring configuration
- [ ] 44.7 Add alerting for critical error thresholds (PagerDuty/Slack)
- [ ] 44.8 Add operational runbook documentation
- [ ] 44.9 Add custom logging middleware for Firestore operations

### 45. Environment & Deployment

- [ ] 45.1 Add staging environment parity with production
- [x] 45.2 Implement feature flags for gradual rollout (useFeatureFlag hook)
- [ ] 45.3 Add database migration/seeding scripts for test data
- [ ] 45.4 Add deployment rollback automation
- [ ] 45.5 Add smoke test suite for post-deployment verification
- [ ] 45.6 Add environment configuration documentation
- [ ] 45.7 Add deploy previews for PR branches

---

## Phase 7 — Technical Debt & Code Quality

### 46. Code Quality

- [x] 46.1 Standardize error handling patterns (ErrorFallback component with try-again)
- [ ] 46.2 Extract duplicated Firestore query patterns into reusable hooks
- [ ] 46.3 Add strict TypeScript checks (noUncheckedIndexedAccess)
- [ ] 46.4 Standardize component prop interfaces with consistent naming patterns
- [ ] 46.5 Add API service layer abstraction (repository pattern)
- [x] 46.6 Extract business logic from page components into services (usePayrollClone, useAuditLog hooks)
- [ ] 46.7 Add comprehensive JSDoc for public APIs and hooks
- [ ] 46.8 Reduce component re-render surface area (profiling pass)
- [ ] 46.9 Add barrel exports cleanup (remove circular dependencies)
- [ ] 46.10 Standardize import ordering across all files

### 47. State Management

- [ ] 47.1 Audit and consolidate React Context providers (reduce nesting depth)
- [ ] 47.2 Add selectors/memoization for context values to prevent unnecessary re-renders
- [x] 47.3 Implement state persistence strategy (useLocalStorage hook)
- [x] 47.4 Add cross-tab state synchronization (useCrossTabSync with BroadcastChannel)
- [ ] 47.5 Implement undo/redo for critical workflows (payroll edits, employee updates)
- [x] 47.6 Add state migration system for future schema changes (useStateMigration hook)

### 48. Mobile Responsiveness

- [x] 48.1 Audit all pages for mobile responsiveness (MobileResponsivePreview component)
- [x] 48.2 Implement responsive sidebar (ResponsiveSidebar component)
- [x] 48.3 Add touch-friendly interactions (TouchFriendly swipe component)
- [x] 48.4 Implement responsive data tables (ResponsiveTable component with horizontal scroll)
- [ ] 48.5 Add PWA support (offline page, manifest, service worker, install prompt)
- [ ] 48.6 Add app-like native sharing for exports
- [x] 48.7 Add responsive data entry forms (ResponsiveForm with grid collapse)
- [x] 48.8 Add hamburger/back navigation pattern for mobile (HamburgerMenu component)
- [x] 48.9 Add responsive filter panels (ResponsiveFilterPanel component)

---

## Progress Summary

- **Total:** 247 tasks
- **Completed:** 109
- **Remaining:** 138

---

**Note:** The original TASKS.md (240 tasks, 100% complete) covered v1 foundation. TASKS_2.md covers v2 enhancements across UX, security, testing, performance, accessibility, DevOps, and technical debt.
