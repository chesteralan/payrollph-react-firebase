# Audit Fix Plan 3: Code Quality & UX

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve TypeScript strictness, accessibility, performance, SEO, and responsive design.

**Architecture:** Enable strict mode, fix non-null assertions, add skip nav, keyboard dropdowns, SEO meta tags, React.memo for list items.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS v4

**Spec:** `docs/superpowers/audit-2026-09-21.md` — Sections 1-5, 9

## Global Constraints

- Web app at `apps/web/`
- No business logic changes
- Must pass `tsc --noEmit` and `yarn lint`
- Follow existing Tailwind patterns

---

### Task 1: Enable TypeScript Strict Mode

**Files:** Modify `apps/web/tsconfig.app.json`

- [ ] **Step 1:** Add `"strict": true` to `compilerOptions` in tsconfig.app.json
- [ ] **Step 2:** Run `npx tsc --noEmit` — fix any new errors (null checks, function types)
- [ ] **Step 3:** Verify zero errors: `npx tsc --noEmit`
- [ ] **Step 4:** Commit: `git commit -m "chore(typescript): enable strict mode"`

---

### Task 2: Fix Non-Null Assertions

**Files:** 6 files with `!.` assertions (Stepper.tsx:98, Breadcrumb.tsx:57, useDTRPage.ts:563, NamesListPage.tsx:329-330, useCustomReportBuilder.ts:164/190-191, EmployeeProfilePage.tsx:136-137/159-160)

- [ ] **Step 1:** `grep -rn "\!\." src/ --include="*.ts" --include="*.tsx" | grep -v test | grep -v __mocks__`
- [ ] **Step 2:** Fix each with optional chaining (`?.`), null check + early return, or default value (`?? "fallback"`)
- [ ] **Step 3:** Verify: `npx tsc --noEmit`
- [ ] **Step 4:** Commit: `git commit -m "fix(typescript): replace non-null assertions with safe access"`

---

### Task 3: Add Skip Navigation Link

**Files:** Modify `apps/web/src/components/layout/AppLayout/AppLayout.tsx`

- [ ] **Step 1:** Read AppLayout to find `<main>` element
- [ ] **Step 2:** Add skip link as first child:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg focus:rounded">
  Skip to main content
</a>
```
- [ ] **Step 3:** Add `id="main-content"` to `<main>` element
- [ ] **Step 4:** Verify: `npx tsc --noEmit`
- [ ] **Step 5:** Commit: `git commit -m "fix(a11y): add skip navigation link"`

---

### Task 4: Add Keyboard Navigation to Dropdowns

**Files:** Modify `apps/web/src/components/layout/Header/Header.tsx`

- [ ] **Step 1:** Read Header.tsx — find dropdown components (showCompanyDropdown, showUserDropdown)
- [ ] **Step 2:** Add `onKeyDown` handler for ArrowDown, ArrowUp, Home, End, Escape
- [ ] **Step 3:** Add `role="menu"`, `role="menuitem"`, `tabIndex={-1}` to dropdown items
- [ ] **Step 4:** Verify: `npx tsc --noEmit && yarn lint`
- [ ] **Step 5:** Commit: `git commit -m "fix(a11y): add keyboard navigation to dropdowns"`

---

### Task 5: Add SEO Meta Tags

**Files:** Modify `apps/web/index.html`, Create `apps/web/public/robots.txt`

- [ ] **Step 1:** Add to index.html `<head>`:
```html
<meta name="description" content="SMB Payroll — comprehensive payroll management for Philippine businesses." />
<meta name="theme-color" content="#2563eb" />
<meta property="og:type" content="website" />
<meta property="og:title" content="SMB Payroll" />
<meta property="og:description" content="Comprehensive payroll management for Philippine businesses." />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="SMB Payroll" />
```
- [ ] **Step 2:** Create `public/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /system/
Disallow: /payroll/
```
- [ ] **Step 3:** Commit: `git commit -m "fix(seo): add meta tags and robots.txt"`

---

### Task 6: Add React.memo to Table Row Components

**Files:** Identify table row components in EmployeesPage, PayrollRunsPage, NamesListPage

- [ ] **Step 1:** Find table row components: `grep -rn "\.map(" src/pages/ --include="*.tsx" | grep "key="`
- [ ] **Step 2:** Extract inline row JSX into named `TableRow` components wrapped in `React.memo`
- [ ] **Step 3:** Verify: `npx tsc --noEmit`
- [ ] **Step 4:** Commit: `git commit -m "perf: add React.memo to table row components"`

---

### Task 7: Fix Mobile Table Overflow

**Files:** Modify pages with tables (EmployeesPage, PayrollRunsPage, etc.)

- [ ] **Step 1:** Find tables: `grep -rn "<table" src/pages/ --include="*.tsx"`
- [ ] **Step 2:** Wrap each `<table>` in a responsive container:
```tsx
<div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
  <table>...</table>
</div>
```
- [ ] **Step 3:** Verify: `npx tsc --noEmit`
- [ ] **Step 4:** Commit: `git commit -m "fix(responsive): add horizontal scroll wrapper for mobile tables"`

---

### Task 8: Verify All Changes

- [ ] **Step 1:** `npx tsc --noEmit`
- [ ] **Step 2:** `yarn lint`
- [ ] **Step 3:** `yarn test:run`
- [ ] **Step 4:** Final commit if needed
