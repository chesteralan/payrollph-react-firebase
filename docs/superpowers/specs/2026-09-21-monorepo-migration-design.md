# Monorepo Migration Design Spec

**Date:** 2026-09-21
**Status:** Approved
**Scope:** Restructure single-app repo into Turborepo monorepo

## Goal

Convert the current single-app repository into a Turborepo monorepo to support future apps:
- Desktop (Electron)
- Mobile (React Native)
- Backend API (NestJS)

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Workspace tool | Turborepo | Build caching, parallel execution, remote caching |
| Layout | `apps/` directory | Standard Turborepo convention, symmetric, scalable |
| Mobile framework | React Native | Shares React concepts with web app |
| Backend | NestJS (full REST API) | Serves APIs, background jobs, webhooks |
| Shared code | Separate per app | No shared packages for now |
| Firebase config | Keep at root | Simpler Firebase CLI usage |

## Target Directory Structure

```
payrollph-react-firebase/
├── apps/
│   └── web/                    ← current payroll-web (moved here)
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig*.json
│       └── ...
├── firebase.json                ← stays at root
├── firestore.rules
├── firestore.indexes.json
├── turbo.json                   ← NEW: Turborepo config
├── package.json                 ← NEW: workspace root
├── .yarnrc.yml                  ← moved from payroll-web/ to root
├── yarn.lock                    ← stays at root (deduped)
├── docs/
├── .github/
│   └── workflows/ci-cd.yml     ← updated paths
├── TASKS.md
├── REFACTOR.md
└── README.md
```

## Root Configuration

### `package.json` (workspace root)

```json
{
  "name": "payrollph",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "type-check": "turbo type-check",
    "deploy": "turbo deploy --filter=web",
    "deploy:all": "turbo deploy"
  },
  "devDependencies": {
    "turbo": "^2"
  },
  "packageManager": "yarn@1.22.22"
}
```

### `turbo.json`

```json
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
    "type-check": {
      "dependsOn": ["^build"]
    },
    "deploy": {
      "dependsOn": ["build"],
      "cache": false
    }
  }
}
```

## Migration Steps

### Step 1: Move `payroll-web/` → `apps/web/`

```bash
mkdir -p apps
git mv payroll-web apps/web
```

Update `firebase.json` hosting paths:
- `"public": "payroll-web/dist"` → `"public": "apps/web/dist"` (production target)
- `"public": "payroll-web/dist"` → `"public": "apps/web/dist"` (staging target)

Remove duplicate configs from `apps/web/`:
- `apps/web/.github/` (consolidated to root)
- `apps/web/.yarnrc.yml` (moves to root)

### Step 2: Create root workspace files

Create `package.json` at root (workspace orchestrator, no app code).
Create `turbo.json` at root (pipeline definitions).
Move `.yarnrc.yml` from `payroll-web/` to root.

### Step 3: Update `apps/web/package.json`

- Keep all dependencies and scripts as-is
- Name stays `payroll-web` (Turborepo uses it for `--filter=web`)

### Step 4: Update CI/CD

Update `.github/workflows/ci-cd.yml`:
- Change working directory references from `payroll-web/` → `apps/web/`
- Update any path triggers

### Step 5: Verify

```bash
yarn install                    # resolves workspaces
turbo run build --filter=web    # confirms web app builds
turbo run test --filter=web     # confirms tests pass
turbo run lint --filter=web     # confirms lint passes
```

## Future App Onboarding

When adding a new app (e.g., `apps/mobile/`):

1. Create `apps/mobile/` with its own `package.json`
2. Run `yarn install` from root (auto-discovers workspace)
3. Add app-specific scripts to root `package.json` if needed
4. Turborepo automatically includes it in `turbo dev`, `turbo build`, etc.

### Future Apps (Not In Scope Now)

| App | Directory | Framework | Purpose |
|-----|-----------|-----------|---------|
| Web | `apps/web/` | React + Vite | Payroll management UI |
| Mobile | `apps/mobile/` | React Native | Native iOS/Android app |
| Desktop | `apps/desktop/` | Electron | Desktop wrapper |
| API | `apps/api/` | NestJS | REST API server |

## What NOT to Change

- `apps/web/src/` — no internal code changes
- `apps/web/package.json` deps — no dependency changes
- Firebase project config — same project, same rules
- `firestore.rules` — stays at root
- `docs/` — stays at root
