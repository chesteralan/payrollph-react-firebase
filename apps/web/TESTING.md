# Testing Guide

## Overview

This project uses **Vitest** for unit/integration tests and **Playwright** for end-to-end (E2E) tests.

| Layer | Tool | Location |
|-------|------|----------|
| Unit tests | Vitest + Testing Library | `src/**/*.test.{ts,tsx}` |
| Integration tests | Vitest + @firebase/rules-unit-testing | `src/test/*.test.ts` |
| E2E tests | Playwright | `e2e/*.spec.ts` |
| Visual regression | Playwright Snapshots | `e2e/*.spec.ts` + `e2e/snapshots/` |

## Running Tests

### Unit Tests

```bash
# Run all unit tests (single run)
node node_modules/vitest/vitest.mjs run

# Run with verbose output
node node_modules/vitest/vitest.mjs run --reporter=verbose

# Run a specific test file
node node_modules/vitest/vitest.mjs run src/utils/codeSplitter.test.ts

# Run tests with coverage
node node_modules/vitest/vitest.mjs run --coverage
```

> **Note:** Always use `node node_modules/vitest/vitest.mjs run` directly rather than `yarn test` or `yarn vitest` to avoid yarn permission issues.

### E2E Tests (Playwright)

```bash
# Run all E2E tests
node node_modules/@playwright/test/cli.mjs test

# Run with specific browser
node node_modules/@playwright/test/cli.mjs test --project=chromium

# Run a specific test file
node node_modules/@playwright/test/cli.mjs test e2e/login.spec.ts

# Run with UI mode (for debugging)
node node_modules/@playwright/test/cli.mjs test --ui

# Update snapshots for visual regression tests
node node_modules/@playwright/test/cli.mjs test --update-snapshots
```

> **Note:** The dev server must be running on port 5173 for E2E tests. Use `yarn dev` in a separate terminal.

### Firestore Emulator Integration Tests

```bash
# Run security rules tests with emulator
npx firebase emulators:exec --only firestore "npx vitest run src/test/security.rules.test.ts"
```

## Test Structure

### Unit Test Files

Test files are co-located with source files:

```
src/
├── utils/
│   ├── format.ts
│   ├── format.test.ts       # Tests for format utilities
│   ├── validation.ts
│   └── validation.test.ts   # Tests for validation
├── hooks/
│   ├── usePermissions.ts
│   └── usePermissions.test.ts
├── context/
│   ├── AuthContext/
│   │   ├── AuthContext.tsx
│   │   └── AuthContext.test.tsx
└── services/
    ├── payroll.ts
    └── payroll.test.ts
```

### Naming Conventions

- **Unit tests:** `*.test.ts` or `*.test.tsx`
- **E2E tests:** `*.spec.ts`
- **Test data:** `*.fixture.ts` or `*.mock.ts`
- **Test utilities:** `*test-utils.ts`

## Writing Tests

### Unit Test Patterns

**Utility function test:**
```typescript
import { describe, it, expect } from "vitest";
import { formatCurrency } from "./format";

describe("formatCurrency", () => {
  it("should format a number as PHP currency", () => {
    expect(formatCurrency(1500.5)).toBe("₱1,500.50");
  });

  it("should handle zero", () => {
    expect(formatCurrency(0)).toBe("₱0.00");
  });
});
```

**React component test:**
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("should render with label", () => {
    render(<Button label="Click me" />);
    expect(screen.getByText("Click me")).toBeVisible();
  });
});
```

**Hook test:**
```typescript
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("should increment counter", () => {
    const { result } = renderHook(() => useCounter());
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });
});
```

### Test Setup

The test setup file (`src/test/setup.ts`) configures:

- **jest-dom matchers** — extended DOM assertions (`.toBeVisible()`, `.toHaveTextContent()`, etc.)
- **Firebase mocks** — automatic mocking of `firebase/auth`, `firebase/firestore`, `firebase/storage`
- **lucide-react mocks** — icon components replaced with simple `<svg>` stubs
- **Browser API mocks** — `matchMedia`, `IntersectionObserver`, `ResizeObserver`
- **Console error filtering** — filters out React DOM warnings in test output

### Async Test Patterns

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("LoginForm", () => {
  it("should call onLogin when form is submitted", async () => {
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} />);

    await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });
});
```

## Test Coverage

### Current Coverage Thresholds

The project enforces **80% coverage** minimum across all metrics:

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Branches | 80% |
| Functions | 80% |
| Statements | 80% |

Coverage is configured in `vite.config.ts` under `test.coverage`.

### Excluded from Coverage

These files are intentionally excluded from coverage requirements:
- `src/test/**` — Test utilities and setup
- `src/types/**` — TypeScript type definitions
- `src/config/**` — Firebase/Sentry configuration
- `src/i18n/locales/**` — Translation data
- `src/__mocks__/**` — Mock implementations
- Entry points (`src/main.tsx`, `src/App.tsx`)

### Running Coverage Locally

```bash
node node_modules/vitest/vitest.mjs run --coverage
open coverage/index.html
```

## E2E Testing Guidelines

### Test Structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/**");
  });

  test("should do something", async ({ page }) => {
    // Test implementation
  });
});
```

### Test Data Strategy

- Use Firebase emulator for integration tests
- Mock Firestore for unit tests via `src/test/setup.ts`
- Use `@firebase/rules-unit-testing` for security rules tests
- E2E tests run against a real Firebase project or emulator

## CI Integration

Tests run automatically in CI via GitHub Actions (`.github/workflows/ci-cd.yml`):

1. **Lint & TypeCheck** — ESLint + tsc --noEmit
2. **Unit Tests** — Parallel shards with coverage
3. **Build** — Production bundle
4. **Security Scan** — npm audit
5. **E2E Tests** — Chromium + Firefox in parallel
6. **Test Performance** — Duration tracking with regression alerts

### Test Artifacts

- Coverage reports → `coverage/`
- Playwright reports → `playwright-report/`
- Visual regression snapshots → `e2e/snapshots/`

## Troubleshooting

### Vitest Hangs During Setup

If Vitest hangs during test discovery, check:
1. The `pool` setting in `vite.config.ts` — remove `pool: "forks"` if jsdom is slow to initialize
2. jsdom environment setup can take 10-20s per test file — this is expected
3. Run a single file to isolate the issue: `vitest run path/to/test.test.ts`

### Playwright Fails to Connect

If Playwright can't connect to the dev server:
1. Ensure the dev server is running: `yarn dev`
2. Check `playwright.config.ts` for the correct `baseURL` (default: `http://localhost:5173`)
3. The `webServer` config in `playwright.config.ts` auto-starts the dev server in CI

### Firestore Emulator Not Running

The security rules tests require the Firestore emulator:
```bash
firebase emulators:start --only firestore
# In another terminal:
npx vitest run src/test/security.rules.test.ts
```
