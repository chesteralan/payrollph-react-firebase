# SMB Payroll — Deployment Guide

## Prerequisites

- Node.js 20+
- npm
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Blaze plan (for Firestore backups, Cloud Functions)
- Sentry account (optional, for error tracking)

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd payroll-react-firebase/payroll-web
```

### 2. Configure Environment Variables

Copy the example env file and fill in your Firebase project values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `{project}.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `{project}.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase Console |
| `VITE_FIREBASE_APP_ID` | From Firebase Console |

Optional variables:

| Variable | Description |
|---|---|
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 (App Check) |
| `VITE_SENTRY_DSN` | Sentry Error Tracking |
| `VITE_SENTRY_ENVIRONMENT` | `production` or `staging` |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics ID |

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Firebase Project

```bash
firebase login
firebase use --add
```

Select your Firebase project.

### 5. Deploy Firestore Security Rules

```bash
npm run deploy:rules
```

### 6. Create Composite Indexes

Deploy the indexes defined in `firestore.indexes.json`:

```bash
firebase deploy --only firestore:indexes
```

## Development

Run the local development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Building for Production

```bash
npm run build
```

This runs TypeScript type checking and builds the production bundle to `dist/`.

## Deployment

### Deploy Hosting Only

```bash
npm run deploy
```

### Deploy Everything

```bash
npm run deploy:all
```

### Deploy to Staging

The staging deployment uses `firebase.json` hosting configuration with the `staging` target:

```bash
firebase deploy --only hosting:staging
```

### Deploy to Production

```bash
firebase deploy --only hosting:production
```

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that:

1. **Test**: Runs linting, type checking, and unit tests on every push/PR to `main`/`develop`
2. **Build**: Creates production bundle
3. **Deploy staging**: Auto-deploys `develop` branch to staging Firebase project
4. **Deploy production**: Auto-deploys `main` branch to production Firebase project
5. **E2E tests**: Runs Playwright tests against the staging deployment

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | Production project ID |
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON for production |
| `FIREBASE_STAGING_PROJECT_ID` | Staging project ID |
| `FIREBASE_STAGING_SERVICE_ACCOUNT` | Service account JSON for staging |
| `SENTRY_AUTH_TOKEN` | Sentry auth token (optional) |
| `SENTRY_ORG` | Sentry organization (optional) |

## Production Checklist

- [ ] Firebase project on Blaze plan
- [ ] Environment variables configured for production
- [ ] reCAPTCHA v3 enabled for App Check
- [ ] Sentry DSN configured for error tracking
- [ ] Custom domain configured in Firebase Hosting
- [ ] SSL certificate provisioned (automatic with Firebase)
- [ ] Security headers verified
- [ ] Firestore indexes deployed
- [ ] Automated backups configured
- [ ] Monitoring alerts set up

## Monitoring

### Firebase Console
Monitor the app via the Firebase Console:
- **Firestore**: Usage, queries, indexes
- **Authentication**: User sign-in methods
- **Hosting**: Bandwidth, requests
- **Performance**: Web performance metrics

### Sentry
Error tracking and performance monitoring:
- View errors in the Sentry dashboard
- Set up alert rules for critical errors
- Use session replays for debugging user issues

### Custom Domain
To use a custom domain:
1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow DNS verification steps
4. Wait for SSL certificate provisioning

## Backup Strategy

### Automatic Backups (Firestore)
```bash
firebase firestore:backups create
# Or schedule via Google Cloud Scheduler
```

### Manual Backups
Use the Database page in the app to trigger on-demand backups.

### Recovery
1. Go to Firebase Console > Firestore > Backups
2. Select the backup to restore
3. Choose restore target (same or different database)
4. Monitor restore progress

## Security Configuration

### Firebase Security Rules
Rules are deployed from `firestore.rules`. Key protections:
- All reads require authentication
- RBAC enforced at the document level
- Payroll write protection (status-based)
- Audit log is append-only
- Rate limiting on authentication endpoints

### CORS Configuration
If using Cloud Storage for document uploads, configure CORS:

```bash
gsutil cors set cors.json gs://{project}.firebasestorage.app
```

### Content Security Policy
The production `firebase.json` includes strict CSP headers. Update `script-src` and `connect-src` as needed for third-party integrations.
