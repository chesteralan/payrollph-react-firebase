# Rollback Automation

This document describes the rollback procedure for the PayrollPH application.

## Quick Rollback (Git Revert)

```bash
# 1. Revert the problematic commit
git checkout main
git pull
git log --oneline -5          # Find the commit to revert
git revert HEAD               # Revert latest commit
# Or: git revert <commit-hash>

# 2. Push to trigger CI/CD deployment
git push origin main

# 3. Verify deployment
curl https://{project}.firebaseapp.com/api/health
```

## Firestore Rollback

### Via Firebase Console
1. Go to Firebase Console → Firestore → Backups
2. Select the backup before the problematic change
3. Click "Restore" → Choose target database
4. Update app configuration to point to restored database

### Via gcloud CLI
```bash
# List available backups
gcloud firestore backups list --project={project-id}

# Restore from backup
gcloud firestore backups restore \
  --backup={backup-id} \
  --database={target-database} \
  --project={project-id}
```

## Automated Rollback Script

```bash
#!/bin/bash
# rollback.sh — Automated rollback to previous deployment

set -e

echo "🔄 Starting rollback..."

# 1. Checkout previous version
git checkout HEAD~1

# 2. Install deps
cd payroll-web
yarn install --frozen-lockfile

# 3. Build
VITE_APP_VERSION="rollback-$(git rev-parse --short HEAD)"
yarn build

# 4. Deploy
firebase deploy --only hosting --project=$FIREBASE_PROJECT_ID

# 5. Verify
echo "✅ Rollback complete. Verifying deployment..."
curl -f -I https://$FIREBASE_PROJECT_ID.firebaseapp.com && echo "  ✓ Site is live"
curl -f https://$FIREBASE_PROJECT_ID.firebaseapp.com/api/health && echo "  ✓ Health check passed"

# 6. Notify
echo "Rollback to $(git rev-parse --short HEAD~1) completed at $(date)"
```

## CI/CD Rollback

GitHub Actions workflow for automated rollback:

```yaml
# .github/workflows/rollback.yml
name: Rollback
on:
  workflow_dispatch:
    inputs:
      commit:
        description: 'Commit to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.commit }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Build
        run: |
          cd payroll-web
          yarn install --frozen-lockfile
          yarn build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}

      - name: Deploy
        run: |
          cd payroll-web
          firebase deploy --only hosting

      - name: Smoke Test
        run: |
          curl -f https://${{ secrets.FIREBASE_PROJECT_ID }}.firebaseapp.com/api/health
```

## Pre-Rollback Checklist

- [ ] Identify the problematic commit/change
- [ ] Confirm the target rollback version is stable
- [ ] Notify stakeholders of rollback
- [ ] Ensure Firestore backup exists (for data rollbacks)
- [ ] Check that rollback doesn't introduce regressions
- [ ] Have revert/rollback command ready
- [ ] Post-rollback: verify health endpoint
- [ ] Post-rollback: run E2E smoke test suite
- [ ] Post-rollback: monitor Sentry for new errors
