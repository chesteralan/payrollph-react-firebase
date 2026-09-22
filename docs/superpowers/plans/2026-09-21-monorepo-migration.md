# Monorepo Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the single-app repository into a Turborepo monorepo with `apps/web/` as the first workspace, ready for future apps (mobile, desktop, API).

**Architecture:** Move `payroll-web/` → `apps/web/`, create root workspace files (`package.json`, `turbo.json`), update all path references (Firebase hosting, CI/CD, dependabot), and verify the build/test/lint pipeline works from the root.

**Tech Stack:** Turborepo, yarn workspaces, Vite, TypeScript, Firebase Hosting, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-09-21-monorepo-migration-design.md`

## Global Constraints

- yarn for package management (node-modules linker)
- Firebase config stays at root (`firebase.json`, `firestore.rules`)
- No changes to `apps/web/src/` internal code
- No dependency changes in `apps/web/package.json`
- Workspace name `payroll-web` preserved for Turborepo filtering

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Create | `package.json` (root) | Workspace root — defines workspaces, turbo scripts |
| Create | `turbo.json` (root) | Turborepo pipeline configuration |
| Move | `payroll-web/` → `apps/web/` | Relocate web app into apps directory |
| Move | `.yarnrc.yml` | From `payroll-web/` to root (controls all workspaces) |
| Modify | `firebase.json` | Update hosting paths: `payroll-web/dist` → `apps/web/dist` |
| Modify | `.github/workflows/ci-cd.yml` | Update all `payroll-web/` references → `apps/web/` |
| Modify | `.github/dependabot.yml` | Update directory path: `/payroll-web` → `/apps/web` |
| Delete | `apps/web/.github/` | Remove duplicate GitHub config (consolidated to root) |
| Delete | `apps/web/.yarnrc.yml` | Moved to root |
| Create | `.gitignore` (root) | Root-level ignores for monorepo (node_modules, dist, etc.) |

---

### Task 1: Move `payroll-web/` → `apps/web/`

**Files:**
- Move: `payroll-web/*` → `apps/web/*`
- Delete: `apps/web/.github/` (duplicate)
- Delete: `apps/web/.yarnrc.yml` (moves to root)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `apps/web/` directory with all web app files intact

- [ ] **Step 1: Create apps directory and move payroll-web**

```bash
mkdir -p apps
git mv payroll-web apps/web
```

- [ ] **Step 2: Remove duplicate .github from apps/web**

```bash
git rm -r apps/web/.github
```

- [ ] **Step 3: Remove .yarnrc.yml from apps/web (will be at root)**

```bash
git rm apps/web/.yarnrc.yml
```

- [ ] **Step 4: Verify the move — check apps/web structure**

```bash
ls apps/web/
```

Expected: `src/`, `package.json`, `vite.config.ts`, `tsconfig.json`, etc. — everything except `.github/` and `.yarnrc.yml`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: move payroll-web → apps/web for monorepo layout"
```

---

### Task 2: Create Root Workspace Configuration

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json` (root)
- Create: `.yarnrc.yml` (root, moved from payroll-web)
- Create: `.gitignore` (root)

**Interfaces:**
- Consumes: `apps/web/` from Task 1
- Produces: Root workspace that Turborepo and yarn recognize

- [ ] **Step 1: Create root package.json**

```bash
cat > package.json << 'EOF'
{
  "name": "payrollph",
  "private": true,
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "test:run": "turbo test:run",
    "type-check": "turbo type-check",
    "deploy": "turbo deploy --filter=web",
    "deploy:all": "turbo deploy"
  },
  "devDependencies": {
    "turbo": "^2"
  },
  "packageManager": "yarn@1.22.22"
}
EOF
```

- [ ] **Step 2: Create turbo.json**

```bash
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    },
    "test:run": {
      "dependsOn": ["build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "deploy": {
      "dependsOn": ["build"],
      "cache": false
    }
  }
}
EOF
```

- [ ] **Step 3: Move .yarnrc.yml to root**

```bash
# Already at root from Task 1? No — it was deleted from apps/web.
# Create it at root:
cat > .yarnrc.yml << 'EOF'
approvedGitRepositories:
  - "**"

enableScripts: true

nodeLinker: node-modules

npmMinimalAgeGate: 0
EOF
```

- [ ] **Step 4: Create root .gitignore**

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Build outputs
dist/
dist-ssr/

# Turborepo
.turbo/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/*
!.vscode/extensions.json
.idea/
.DS_Store

# Environment
.env
.env.local
.env.*.local

# Coverage
coverage/
*.lcov
.nyc_output/

# Yarn state
.yarn/install-state.gz

# Build artifacts
*.tsbuildinfo
EOF
```

- [ ] **Step 5: Install turbo dependency**

```bash
yarn install
```

- [ ] **Step 6: Verify turbo is available**

```bash
npx turbo --version
```

Expected: prints Turbo version (2.x).

- [ ] **Step 7: Commit**

```bash
git add package.json turbo.json .yarnrc.yml .gitignore yarn.lock
git commit -m "chore: add Turborepo workspace root config"
```

---

### Task 3: Update Firebase Hosting Paths

**Files:**
- Modify: `firebase.json` — update `public` paths

**Interfaces:**
- Consumes: `apps/web/` from Task 1
- Produces: Firebase config pointing to correct build output

- [ ] **Step 1: Update production hosting target**

In `firebase.json`, find the `production` hosting target and change:
```json
"public": "payroll-web/dist"
```
to:
```json
"public": "apps/web/dist"
```

- [ ] **Step 2: Update staging hosting target**

In `firebase.json`, find the `staging` hosting target and change:
```json
"public": "payroll-web/dist"
```
to:
```json
"public": "apps/web/dist"
```

- [ ] **Step 3: Verify both targets updated**

```bash
grep -n '"public"' firebase.json
```

Expected: both lines show `"apps/web/dist"`.

- [ ] **Step 4: Commit**

```bash
git add firebase.json
git commit -m "chore: update firebase.json hosting paths for apps/web"
```

---

### Task 4: Update CI/CD Workflow

**Files:**
- Modify: `.github/workflows/ci-cd.yml`

**Interfaces:**
- Consumes: `apps/web/` from Task 1
- Produces: CI/CD pipeline that works with new directory structure

- [ ] **Step 1: Update cache-dependency-path references**

Replace all instances of:
```yaml
cache-dependency-path: payroll-web/yarn.lock
```
with:
```yaml
cache-dependency-path: yarn.lock
```

Note: After moving to root workspaces, `yarn.lock` lives at root. The cache path should point to root `yarn.lock`.

There are 7 occurrences (lines 27, 57, 107, 144, 239, 273 — check all).

- [ ] **Step 2: Update working-directory references**

Replace all instances of:
```yaml
working-directory: payroll-web
```
with:
```yaml
working-directory: apps/web
```

There are many occurrences throughout the file (install, lint, type-check, test, build, deploy steps).

- [ ] **Step 3: Update artifact paths**

Replace:
```yaml
path: payroll-web/coverage/
```
with:
```yaml
path: apps/web/coverage/
```

Replace:
```yaml
path: payroll-web/dist/
```
with:
```yaml
path: apps/web/dist/
```

Replace:
```yaml
path: payroll-web/playwright-report/
```
with:
```yaml
path: apps/web/playwright-report/
```

Replace:
```yaml
path: payroll-web/e2e/snapshots/
```
with:
```yaml
path: apps/web/e2e/snapshots/
```

- [ ] **Step 4: Update install step to use root**

The install step currently does `yarn install --frozen-lockfile` inside `payroll-web`. Change to install from root (which resolves all workspaces):

```yaml
- name: Install dependencies
  run: yarn install --frozen-lockfile
```

(Remove `working-directory: payroll-web` from install steps — let yarn resolve from root.)

- [ ] **Step 5: Update deploy working-directory**

Change deploy steps from:
```yaml
working-directory: payroll-web
```
to:
```yaml
working-directory: apps/web
```

- [ ] **Step 6: Verify no remaining payroll-web references**

```bash
grep -n "payroll-web" .github/workflows/ci-cd.yml
```

Expected: no matches.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/ci-cd.yml
git commit -m "chore: update CI/CD workflow paths for apps/web"
```

---

### Task 5: Update Dependabot Config

**Files:**
- Modify: `.github/dependabot.yml`

**Interfaces:**
- Consumes: `apps/web/` from Task 1
- Produces: Dependabot scanning the correct directory

- [ ] **Step 1: Update npm directory path**

Change:
```yaml
directory: "/payroll-web"
```
to:
```yaml
directory: "/apps/web"
```

- [ ] **Step 2: Verify change**

```bash
grep -n "directory" .github/dependabot.yml
```

Expected: shows `"/apps/web"`.

- [ ] **Step 3: Commit**

```bash
git add .github/dependabot.yml
git commit -m "chore: update dependabot directory path for apps/web"
```

---

### Task 6: Verify Build Pipeline

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Confirmed working build/test/lint from root

- [ ] **Step 1: Install dependencies from root**

```bash
yarn install
```

Expected: yarn resolves workspaces, installs turbo + web app deps.

- [ ] **Step 2: Verify web app builds via Turborepo**

```bash
npx turbo run build --filter=web
```

Expected: Vite build succeeds, `apps/web/dist/` created.

- [ ] **Step 3: Verify lint passes**

```bash
npx turbo run lint --filter=web
```

Expected: 0 errors.

- [ ] **Step 4: Verify type-check passes**

```bash
npx turbo run type-check --filter=web
```

Expected: 0 errors.

- [ ] **Step 5: Verify tests pass**

```bash
npx turbo run test:run --filter=web
```

Expected: all tests pass.

- [ ] **Step 6: Verify root scripts work**

```bash
yarn build
yarn lint
yarn type-check
```

Expected: Turborepo runs tasks for `web` app, all pass.

- [ ] **Step 7: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "chore: monorepo migration complete"
```
