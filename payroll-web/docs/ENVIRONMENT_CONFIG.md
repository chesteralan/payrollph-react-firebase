# Environment Configuration Guide

## Overview

PayrollPH uses environment variables for configuration. Variables are loaded at build time from `.env` files and injected into the application via Vite's `import.meta.env` system.

## Environment Files

| File | Purpose | Git |
|------|---------|-----|
| `.env` | Development defaults | ❌ (never commit) |
| `.env.example` | Template with all variables | ✅ |
| `.env.local` | Local overrides (gitignored) | ❌ |
| `.env.production` | Production build values | ❌ (CI secrets) |

## Variable Reference

### Required Variables

| Variable | Description | Example | Used In |
|----------|-------------|---------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | `AIzaSy...` | All environments |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | `project.firebaseapp.com` | All environments |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `payrollph-prod` | All environments |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | `project.appspot.com` | All environments |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | `123456789` | All environments |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123:web:abc` | All environments |

### Optional Variables

| Variable | Description | Default | Used In |
|----------|-------------|---------|---------|
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics ID | `G-XXXXX` | Analytics |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key | — | Auth security |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking | — | Error monitoring |
| `VITE_APP_VERSION` | App version for release tracking | `0.0.0` | Sentry releases |
| `VITE_API_BASE_URL` | API base URL (if using Cloud Functions) | — | API calls |

## Environments

### Development

```bash
# .env
VITE_FIREBASE_API_KEY=<dev-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<dev-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<dev-project>
VITE_FIREBASE_STORAGE_BUCKET=<dev-project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<dev-sender-id>
VITE_FIREBASE_APP_ID=<dev-app-id>
VITE_RECAPTCHA_SITE_KEY=<optional>
VITE_SENTRY_DSN=<optional-dev-dsn>
```

- Connects to Firebase development project
- Sentry traces sample rate: 1.0 (all traces)
- Sentry replays sample rate: 1.0 (all replays)
- Errors suppressed in development (`beforeSend` returns null)

### Staging

```bash
# .env.staging
VITE_FIREBASE_API_KEY=<staging-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<staging-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<staging-project>
VITE_FIREBASE_STORAGE_BUCKET=<staging-project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<staging-sender-id>
VITE_FIREBASE_APP_ID=<staging-app-id>
VITE_SENTRY_DSN=<sentry-dsn>
VITE_APP_VERSION=1.0.0-staging
```

- Connects to Firebase staging project (separate from production)
- Sentry environment: `staging`
- Deployed automatically on PR merge to `develop`

### Production

```bash
# .env.production
VITE_FIREBASE_API_KEY=<prod-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<prod-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<prod-project>
VITE_FIREBASE_STORAGE_BUCKET=<prod-project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<prod-sender-id>
VITE_FIREBASE_APP_ID=<prod-app-id>
VITE_SENTRY_DSN=<production-sentry-dsn>
VITE_RECAPTCHA_SITE_KEY=<recaptcha-key>
VITE_APP_VERSION=1.0.0
```

- Connects to Firebase production project
- Sentry traces sample rate: 0.1 (10% of transactions)
- Sentry replays sample rate: 0.1 (10% of sessions)
- reCAPTCHA enabled for auth security

## CI/CD Variable Setup

### GitHub Actions Secrets

The following secrets must be configured in GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `FIREBASE_TOKEN` | Firebase CI token (`firebase login:ci`) |
| `FIREBASE_API_KEY` | Production API key |
| `FIREBASE_AUTH_DOMAIN` | Production auth domain |
| `FIREBASE_PROJECT_ID` | Production project ID |
| `FIREBASE_STORAGE_BUCKET` | Production storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Production sender ID |
| `FIREBASE_APP_ID` | Production app ID |
| `RECAPTCHA_SITE_KEY` | reCAPTCHA site key |
| `FIREBASE_STAGING_PROJECT` | Staging Firebase project ID |
| `VITE_SENTRY_DSN` | Sentry DSN |

## Firebase Project Setup

Each environment should have a separate Firebase project.

### Creating Projects

```bash
# Create projects in Firebase Console:
# 1. payrollph-dev — Development
# 2. payrollph-staging — Staging
# 3. payrollph-prod — Production

# Enable services:
firebase --project=payrollph-dev firestore:init
firebase --project=payrollph-dev auth:init
```

### Firestore Indexes

Firestore indexes are defined in `firestore.indexes.json`. Deploy with:

```bash
firebase deploy --only firestore:indexes
```

## Deploy Previews

The project supports Firebase Hosting deploy previews for PR branches.

### Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Configure PR previews in firebase.json:
# {
#   "hosting": {
#     "previews": {
#       "enabled": true,
#       "expire": "30d"
#     }
#   }
# }
```

### Workflow

1. Create PR → CI runs checks
2. Firebase automatically deploys preview channel
3. Preview URL posted as PR comment
4. Preview auto-expires after 30 days or when branch is deleted
