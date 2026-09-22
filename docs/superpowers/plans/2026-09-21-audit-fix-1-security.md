# Audit Fix Plan 1: Critical & Security

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical security vulnerabilities and harden the application's security posture.

**Architecture:** Replace the vulnerable xlsx library, add security headers to staging, tighten CSP in production, and remove console output from production code.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Firebase Hosting

**Spec:** `docs/superpowers/audit-2026-09-21.md` — Section 6 (Security) and Section 7 (Dependencies)

## Global Constraints

- Web app lives at `apps/web/`
- Firebase config at repo root `firebase.json`
- No changes to app business logic — security hardening only
- yarn for package management
- All changes must pass `tsc --noEmit` and `yarn lint`

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Modify | `apps/web/package.json` | Replace xlsx with exceljs |
| Modify | `apps/web/src/services/reportScheduling.ts` | Update xlsx imports to exceljs |
| Modify | `apps/web/src/services/reportScheduling.test.ts` | Update test imports |
| Modify | `apps/web/src/services/email.ts` | Remove console.error |
| Modify | `apps/web/src/services/encryption.ts` | Remove console.error |
| Modify | `apps/web/src/components/ui/ErrorBoundary/ErrorBoundary.tsx` | Remove console.error |
| Modify | `firebase.json` | Add security headers to staging target |
| Modify | `apps/web/vite.config.ts` | Remove unsafe-eval from production CSP |
| Modify | `apps/web/src/config/firebase.ts` | Remove console.warn in catch block |

---

### Task 1: Replace xlsx with exceljs

**Files:**
- Modify: `apps/web/package.json` — swap dependency
- Modify: `apps/web/src/services/reportScheduling.ts` — update imports and API calls
- Modify: `apps/web/src/services/reportScheduling.test.ts` — update test imports

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `exportToXlsx` and `exportToCsv` functions using exceljs API

- [ ] **Step 1: Remove xlsx, install exceljs**

```bash
cd apps/web
yarn remove xlsx
yarn add exceljs
```

- [ ] **Step 2: Update reportScheduling.ts imports**

In `src/services/reportScheduling.ts`, find the xlsx import:

```typescript
import * as XLSX from "xlsx";
```

Replace with:

```typescript
import ExcelJS from "exceljs";
```

- [ ] **Step 3: Rewrite exportToXlsx function**

Find the `exportToXlsx` function and replace its body. The current implementation uses `XLSX.utils.json_to_sheet` and `XLSX.write`. Replace with exceljs:

```typescript
export async function exportToXlsx(
  data: Record<string, unknown>[],
  filename: string,
): Promise<string> {
  if (!data.length) throw new Error("No data to export");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  const headers = Object.keys(data[0]);
  sheet.addRow(headers);

  for (const row of data) {
    sheet.addRow(headers.map((h) => row[h]));
  }

  sheet.columns.forEach((col) => {
    col.width = Math.max(
      ...col.values?.map((v) => String(v ?? "").length) ?? [10],
    );
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
  return url;
}
```

- [ ] **Step 4: Rewrite exportToCsv function**

Find the `exportToCsv` function and replace its body:

```typescript
export async function exportToCsv(
  data: Record<string, unknown>[],
  filename: string,
): Promise<string> {
  if (!data.length) throw new Error("No data to export");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sheet1");

  const headers = Object.keys(data[0]);
  sheet.addRow(headers);

  for (const row of data) {
    sheet.addRow(headers.map((h) => row[h]));
  }

  const buffer = await workbook.csv.writeBuffer();
  const blob = new Blob([buffer], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  return url;
}
```

- [ ] **Step 5: Update tests**

In `src/services/reportScheduling.test.ts`, find the xlsx import and remove it (the tests don't import xlsx directly — they test the exported functions). No import changes needed in tests since they import from `./reportScheduling`.

- [ ] **Step 6: Verify build and tests**

```bash
cd apps/web
npx tsc --noEmit
yarn test:run src/services/reportScheduling.test.ts
```

- [ ] **Step 7: Commit**

```bash
cd apps/web
git add package.json yarn.lock src/services/reportScheduling.ts src/services/reportScheduling.test.ts
git commit -m "fix(security): replace xlsx with exceljs to eliminate 2 HIGH CVEs"
```

---

### Task 2: Add Security Headers to Staging

**Files:**
- Modify: `firebase.json` — add headers to staging hosting target

**Interfaces:**
- Consumes: nothing
- Produces: Staging environment with same security headers as production

- [ ] **Step 1: Add headers to staging target**

In `firebase.json`, find the `staging` hosting target (starts around line 37). It currently only has `rewrites`. Add the same headers as production:

```json
{
  "target": "staging",
  "public": "apps/web/dist",
  "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
  "rewrites": [{ "source": "**", "destination": "/index.html" }],
  "headers": [
    {
      "source": "**",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://*.googleusercontent.com https://*.firebaseapp.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com wss://*.firebaseio.com; frame-src 'self' https://*.firebaseapp.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
        },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Verify JSON is valid**

```bash
python3 -c "import json; json.load(open('firebase.json')); print('Valid')"
```

- [ ] **Step 3: Commit**

```bash
git add firebase.json
git commit -m "fix(security): add CSP and security headers to staging environment"
```

---

### Task 3: Remove unsafe-eval from Production CSP

**Files:**
- Modify: `apps/web/vite.config.ts` — CSP in dev server (keep unsafe-eval for dev)
- Modify: `firebase.json` — CSP in production hosting (remove unsafe-eval)

**Interfaces:**
- Consumes: nothing
- Produces: Production CSP without unsafe-eval; dev CSP retains it for React Fast Refresh

- [ ] **Step 1: Update production CSP in firebase.json**

In `firebase.json`, find the production hosting target's CSP header value. Remove `'unsafe-eval'` from the `script-src` directive:

Before:
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googleapis.com;
```

After:
```
script-src 'self' 'unsafe-inline' https://apis.google.com https://www.googleapis.com;
```

- [ ] **Step 2: Keep dev CSP unchanged**

`vite.config.ts` CSP should keep `'unsafe-eval'` — React's development mode requires it. Add a comment:

```typescript
// Note: 'unsafe-eval' kept for React dev mode (Fast Refresh). Production CSP in firebase.json omits it.
```

- [ ] **Step 3: Verify JSON is valid**

```bash
python3 -c "import json; json.load(open('firebase.json')); print('Valid')"
```

- [ ] **Step 4: Commit**

```bash
git add firebase.json vite.config.ts
git commit -m "fix(security): remove unsafe-eval from production CSP"
```

---

### Task 4: Remove console.error/warn from Production Code

**Files:**
- Modify: `apps/web/src/services/email.ts` — remove console.error in catch
- Modify: `apps/web/src/services/encryption.ts:97` — remove console.error
- Modify: `apps/web/src/components/ui/ErrorBoundary/ErrorBoundary.tsx:24` — remove console.error
- Modify: `apps/web/src/config/firebase.ts` — already guarded with `import.meta.env.DEV`, no change needed

**Interfaces:**
- Consumes: nothing
- Produces: Clean console in production, errors only go to Sentry

- [ ] **Step 1: Check email.ts for console.error**

```bash
grep -n "console\." apps/web/src/services/email.ts
```

If there's a `console.error` in a catch block, remove it. The error is already caught and handled — Sentry will capture it via the global error handler.

- [ ] **Step 2: Check encryption.ts:97**

```bash
sed -n '90,100p' apps/web/src/services/encryption.ts
```

Remove the `console.error` call. The error should be re-thrown or handled silently.

- [ ] **Step 3: Check ErrorBoundary.tsx:24**

```bash
sed -n '20,30p' apps/web/src/components/ui/ErrorBoundary/ErrorBoundary.tsx
```

Remove the `console.error` call. The ErrorBoundary already reports to Sentry via `captureException`.

- [ ] **Step 4: Verify firebase.ts is already guarded**

```bash
grep -n "console\." apps/web/src/config/firebase.ts
```

Should show only the `import.meta.env.DEV` guarded `console.warn`. No change needed.

- [ ] **Step 5: Verify build and lint**

```bash
cd apps/web
npx tsc --noEmit
yarn lint
```

- [ ] **Step 6: Commit**

```bash
cd apps/web
git add src/services/email.ts src/services/encryption.ts src/components/ui/ErrorBoundary/ErrorBoundary.tsx
git commit -m "fix(security): remove console.error/warn from production code"
```

---

### Task 5: Verify All Security Fixes

**Files:** None (verification only)

- [ ] **Step 1: Run type check**

```bash
cd apps/web
npx tsc --noEmit
```

- [ ] **Step 2: Run lint**

```bash
yarn lint
```

- [ ] **Step 3: Run tests**

```bash
yarn test:run
```

- [ ] **Step 4: Verify firebase.json is valid**

```bash
python3 -c "import json; json.load(open('firebase.json')); print('Valid')"
```

- [ ] **Step 5: Verify xlsx is gone**

```bash
grep -r "xlsx" apps/web/src/ || echo "No xlsx references in source"
```

Expected: No matches.

- [ ] **Step 6: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(security): verify all security hardening changes"
```
