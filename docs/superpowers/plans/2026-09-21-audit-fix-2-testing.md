# Audit Fix Plan 2: Testing Coverage

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise test coverage from 42% toward the 80% target by adding tests for untested pages, validation schemas, and critical user flows.

**Architecture:** Add smoke tests for all page components, unit tests for Zod validation schemas, and Playwright E2E tests for the critical login→payroll flow.

**Tech Stack:** Vitest, Testing Library, Playwright, React 19

**Spec:** `docs/superpowers/audit-2026-09-21.md` — Section 8 (Testing Coverage)

## Global Constraints

- Web app lives at `apps/web/`
- Test files co-located with source: `Component.test.tsx` next to `Component.tsx`
- Vitest + jsdom + Testing Library for unit/component tests
- Playwright for E2E tests (config already exists at `apps/web/playwright.config.ts`)
- All existing 1324 tests must continue passing

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Create | `apps/web/src/validation/schemas.test.ts` | Unit tests for Zod schemas |
| Create | `apps/web/src/pages/dashboard/DashboardPage.test.tsx` | Smoke test |
| Create | `apps/web/src/pages/employees/EmployeesPage.test.tsx` | Smoke test |
| Create | `apps/web/src/pages/payroll/PayrollRunsPage.test.tsx` | Smoke test |
| Create | `apps/web/src/pages/payroll/PayrollDetailPage.test.tsx` | Smoke test |
| Create | `apps/web/src/pages/dtr/DTRPage.test.tsx` | Smoke test (if not exists) |
| Create | `apps/web/src/pages/auth/LoginPage.test.tsx` | Smoke test |
| Create | `apps/web/src/pages/system/SystemSettingsPage.test.tsx` | Smoke test |
| Create | `apps/web/e2e/login-payroll.spec.ts` | E2E critical flow |

---

### Task 1: Add Validation Schema Tests

**Files:**
- Create: `apps/web/src/validation/schemas.test.ts`

**Interfaces:**
- Consumes: `PayrollSchema`, `PayrollEmployeeSchema`, `EmployeeSchema`, `CalendarEventSchema` from `./schemas`
- Produces: 12+ tests covering valid/invalid inputs for all 4 schemas

- [ ] **Step 1: Create test file**

```typescript
import { describe, it, expect } from "vitest";
import {
  PayrollSchema,
  PayrollEmployeeSchema,
  EmployeeSchema,
  CalendarEventSchema,
} from "./schemas";

describe("PayrollSchema", () => {
  const validPayroll = {
    id: "payroll-1",
    companyId: "company-1",
    name: "January 2026 Payroll",
    month: 1,
    year: 2026,
    status: "draft" as const,
    isActive: true,
    isLocked: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    createdBy: "user-1",
  };

  it("accepts valid payroll", () => {
    const result = PayrollSchema.safeParse(validPayroll);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = PayrollSchema.safeParse({ ...validPayroll, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects month < 1", () => {
    const result = PayrollSchema.safeParse({ ...validPayroll, month: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects month > 12", () => {
    const result = PayrollSchema.safeParse({ ...validPayroll, month: 13 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = PayrollSchema.safeParse({ ...validPayroll, status: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("EmployeeSchema", () => {
  const validEmployee = {
    id: "emp-1",
    nameId: "name-1",
    companyId: "company-1",
    statusId: "active",
    employeeCode: "EMP001",
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  it("accepts valid employee", () => {
    const result = EmployeeSchema.safeParse(validEmployee);
    expect(result.success).toBe(true);
  });

  it("rejects empty employeeCode", () => {
    const result = EmployeeSchema.safeParse({ ...validEmployee, employeeCode: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields as undefined", () => {
    const result = EmployeeSchema.safeParse({
      ...validEmployee,
      groupId: undefined,
      positionId: undefined,
    });
    expect(result.success).toBe(true);
  });
});

describe("CalendarEventSchema", () => {
  const validEvent = {
    id: "event-1",
    companyId: "company-1",
    title: "New Year",
    date: new Date("2026-01-01"),
    createdAt: new Date("2026-01-01"),
  };

  it("accepts valid event", () => {
    const result = CalendarEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = CalendarEventSchema.safeParse({ ...validEvent, title: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional type", () => {
    const result = CalendarEventSchema.safeParse({
      ...validEvent,
      type: "regular_holiday",
    });
    expect(result.success).toBe(true);
  });
});

describe("PayrollEmployeeSchema", () => {
  const validPE = {
    id: "pe-1",
    payrollId: "payroll-1",
    nameId: "name-1",
    orderId: 1,
    isActive: true,
    daysWorked: 22,
    absences: 0,
    lateHours: 0,
    overtimeHours: 0,
    basicSalary: 25000,
    grossPay: 25000,
    netPay: 22000,
  };

  it("accepts valid payroll employee", () => {
    const result = PayrollEmployeeSchema.safeParse(validPE);
    expect(result.success).toBe(true);
  });

  it("rejects negative daysWorked", () => {
    const result = PayrollEmployeeSchema.safeParse({ ...validPE, daysWorked: -1 });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd apps/web
yarn test:run src/validation/schemas.test.ts
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
cd apps/web
git add src/validation/schemas.test.ts
git commit -m "test: add Zod validation schema tests (12 tests)"
```

---

### Task 2: Add DashboardPage Smoke Test

**Files:**
- Create: `apps/web/src/pages/dashboard/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: `DashboardPage` component
- Produces: Smoke test verifying it renders without crashing

- [ ] **Step 1: Read DashboardPage to understand dependencies**

```bash
head -50 apps/web/src/pages/dashboard/DashboardPage.tsx
```

Note which contexts/hooks it uses (likely AuthContext, CompanyContext).

- [ ] **Step 2: Create smoke test**

Follow the existing test pattern (check `src/pages/auth/LoginPage.test.tsx` or any existing page test for the mock pattern). Create:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardPage } from "./DashboardPage";

// Mock the hooks this page uses
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "test-user", email: "test@test.com" },
    loading: false,
  }),
}));

vi.mock("@/context/CompanyContext", () => ({
  useCompany: () => ({
    selectedCompany: { id: "company-1", name: "Test Company" },
    loading: false,
  }),
}));

describe("DashboardPage", () => {
  it("renders without crashing", () => {
    render(<DashboardPage />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
```

Note: Adjust the mock imports and expected text based on what DashboardPage actually renders. Read the component first.

- [ ] **Step 3: Run test**

```bash
yarn test:run src/pages/dashboard/DashboardPage.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/dashboard/DashboardPage.test.tsx
git commit -m "test: add DashboardPage smoke test"
```

---

### Task 3: Add EmployeesPage Smoke Test

**Files:**
- Create: `apps/web/src/pages/employees/EmployeesPage.test.tsx`

**Interfaces:**
- Consumes: `EmployeesPage` component
- Produces: Smoke test

- [ ] **Step 1: Read EmployeesPage to understand dependencies**

```bash
head -30 apps/web/src/pages/employees/EmployeesPage/EmployeesPage.tsx
```

- [ ] **Step 2: Create smoke test**

Follow the same pattern as Task 2. Mock the required contexts/hooks. Keep it minimal — just verify it renders.

- [ ] **Step 3: Run test**

```bash
yarn test:run src/pages/employees/EmployeesPage.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/employees/EmployeesPage.test.tsx
git commit -m "test: add EmployeesPage smoke test"
```

---

### Task 4: Add PayrollPages Smoke Tests

**Files:**
- Create: `apps/web/src/pages/payroll/PayrollRunsPage.test.tsx`
- Create: `apps/web/src/pages/payroll/PayrollDetailPage.test.tsx`

**Interfaces:**
- Consumes: Payroll page components
- Produces: 2 smoke tests

- [ ] **Step 1: Read PayrollRunsPage and PayrollDetailPage**

Check their imports and dependencies.

- [ ] **Step 2: Create PayrollRunsPage smoke test**

Mock contexts, verify render.

- [ ] **Step 3: Create PayrollDetailPage smoke test**

Note: PayrollDetailPage uses `useParams()` — mock `react-router-dom`.

```typescript
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useParams: () => ({ id: "test-payroll" }) };
});
```

- [ ] **Step 4: Run both tests**

```bash
yarn test:run src/pages/payroll/
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/payroll/PayrollRunsPage.test.tsx src/pages/payroll/PayrollDetailPage.test.tsx
git commit -m "test: add PayrollRunsPage and PayrollDetailPage smoke tests"
```

---

### Task 5: Add LoginPage Smoke Test

**Files:**
- Create: `apps/web/src/pages/auth/LoginPage.test.tsx`

**Interfaces:**
- Consumes: `LoginPage` component
- Produces: Smoke test

- [ ] **Step 1: Read LoginPage**

Check what it renders and imports.

- [ ] **Step 2: Create test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("renders login form", () => {
    render(<LoginPage />);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });
});
```

Adjust expected text based on actual component output.

- [ ] **Step 3: Run test**

```bash
yarn test:run src/pages/auth/LoginPage.test.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/LoginPage.test.tsx
git commit -m "test: add LoginPage smoke test"
```

---

### Task 6: Add Playwright E2E Test for Login Flow

**Files:**
- Create: `apps/web/e2e/login-payroll.spec.ts`

**Interfaces:**
- Consumes: Playwright config (already exists)
- Produces: E2E test for critical login→dashboard flow

- [ ] **Step 1: Check if e2e directory exists**

```bash
ls apps/web/e2e/ 2>/dev/null || echo "No e2e directory"
```

- [ ] **Step 2: Create E2E test**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("renders login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/SMB Payroll/);
  });

  test("shows login form elements", async ({ page }) => {
    await page.goto("/login");
    // Adjust selectors based on actual LoginPage form elements
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password'], input[name='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });
});
```

- [ ] **Step 3: Run E2E test (if dev server available)**

```bash
cd apps/web
npx playwright test e2e/login-payroll.spec.ts --project=chromium
```

If dev server isn't running, this will fail — that's expected. The test file is ready for CI.

- [ ] **Step 4: Commit**

```bash
cd apps/web
git add e2e/login-payroll.spec.ts
git commit -m "test: add Playwright E2E test for login flow"
```

---

### Task 7: Verify Coverage Improvement

**Files:** None (verification only)

- [ ] **Step 1: Run coverage**

```bash
cd apps/web
yarn test:run 2>&1 | tail -20
```

- [ ] **Step 2: Check coverage report**

```bash
yarn test:coverage 2>&1 | grep -E "(Statements|Branches|Functions|Lines)"
```

Compare with previous baseline (42% statements, 29% branches, 31% functions, 42% lines).

- [ ] **Step 3: Final commit if needed**

```bash
git add -A
git commit -m "test: verify coverage improvement from new tests"
```
