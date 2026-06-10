# PayrollPH — Payroll Management System

A full-featured payroll management application built with **React + Vite** (frontend) and **Firebase** (backend). Designed for Philippine payroll requirements including 13th month pay, government-mandated benefits (SSS, PhilHealth, HDMF), and complex tax computations.

## Features

### Core Payroll
- Payroll wizard with 5-step creation (config → dates → groups → employees → review)
- Payroll processing stages: DTR → Salaries → Earnings → Benefits → Deductions → Summary
- Inline editing with batch save and auto-calculations
- Payroll lock/unlock and status workflow (draft → locked → published)
- Payroll cloning with selective data carry-over
- Payroll output views: Register, Payslip, Bank Transmittal, Journal Entry, Cash Denomination

### Employee Management
- Full employee CRUD with profile tabs (personal info, contacts, compensation, DTR history)
- Employee groups, positions, and areas management
- Employee status tracking (active/inactive/terminated)
- Document upload and employee search/filtering

### Daily Time Record (DTR)
- Calendar view with month navigation
- Per-employee attendance, absence, overtime, and leave management
- Leave balance tracking with validation
- DTR linked to payroll processing

### Reports
- 13th Month Report with XLS export
- Payroll Summary, Earnings/Deductions Breakdown
- Attendance/DTR reports, Benefits Utilization
- Year-End reports, Custom Report Builder
- Report scheduling with email delivery

### System Administration
- User accounts with full RBAC permissions matrix
- Multi-company support with per-company settings
- Company configuration (periods, print settings, workdays)
- Audit logging, database backup/restore, health checks
- Calendar management (holidays, special workdays)

### Security
- Firebase Authentication with email/password
- Role-based access control (department/section/action matrix)
- IP-based access restrictions, two-factor authentication (TOTP)
- Input sanitization, rate limiting, CSRF protection
- Audit logging for all critical actions
- Data encryption for sensitive fields

### Other
- Offline mode with IndexedDB queue and sync
- CSV/XLS import for employees, names, users
- Print-optimized views, batch printing
- Keyboard shortcuts, undo/redo support

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 6, Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **Backend** | Firebase (Auth, Firestore, Storage) |
| **State** | React Context + custom hooks |
| **Testing** | Vitest, Testing Library, Playwright |
| **Package Manager** | yarn |
| **Error Tracking** | Sentry |
| **Monitoring** | Firebase App Check, reCAPTCHA v3 |

## Getting Started

### Prerequisites

- Node.js 20+
- yarn
- Firebase project with Auth, Firestore, and Storage enabled

### Installation

```bash
git clone <repo-url>
cd payroll-web
yarn install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase config:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-key  # optional
```

### Development

```bash
yarn dev          # Start dev server at localhost:5173
yarn lint         # Run ESLint
yarn format       # Format with Prettier
```

### Testing

```bash
yarn test         # Run tests in watch mode
yarn test:run     # Run tests once
yarn test:coverage # Run tests with coverage report
yarn test:e2e     # Run Playwright E2E tests
```

### Build & Deploy

```bash
yarn build              # TypeScript check + Vite build
yarn deploy             # Build + deploy to Firebase Hosting (production)
yarn deploy:all         # Build + deploy everything (including Firestore rules)
```

## Project Structure

```
payroll-web/
├── e2e/                  # Playwright E2E tests
├── public/               # Static assets
├── src/
│   ├── __mocks__/        # Firebase mocks for testing
│   ├── components/       # Reusable UI components
│   │   ├── forms/        # Form components
│   │   ├── layout/       # App layout (sidebar, header, breadcrumbs)
│   │   ├── payroll/      # Payroll-specific components
│   │   └── ui/           # Generic UI primitives
│   ├── config/           # Firebase, Sentry config
│   ├── context/          # React Context providers (auth, company)
│   ├── hooks/            # Custom React hooks
│   ├── i18n/             # Internationalization
│   ├── lib/              # Third-party library wrappers
│   ├── pages/            # Route page components
│   │   ├── auth/         # Login, setup, password management
│   │   ├── dashboard/    # Main dashboard
│   │   ├── dtr/          # Daily Time Record
│   │   ├── employees/    # Employee management
│   │   ├── lists/        # Compensation lists (earnings, deductions, benefits)
│   │   ├── payroll/      # Payroll runs, wizard, detail, output
│   │   ├── reports/      # All report pages
│   │   └── system/       # Admin pages (users, companies, calendar, audit)
│   ├── services/         # Firebase/Firestore service layer
│   ├── test/             # Test setup, integration tests
│   ├── types/            # TypeScript domain types
│   ├── utils/            # Utility functions
│   └── workflows/        # Business workflow logic
├── CLAUDE.md             # Agent instructions
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Scripts

| Script | Description |
|---|---|
| `yarn dev` | Start development server |
| `yarn build` | Type-check + production build |
| `yarn lint` | Run ESLint |
| `yarn format` | Format with Prettier |
| `yarn test` | Run tests (watch mode) |
| `yarn test:run` | Run tests once |
| `yarn test:coverage` | Run tests with coverage |
| `yarn type-check` | Run TypeScript type checking |
| `yarn preview` | Preview production build |
| `yarn deploy` | Build + deploy hosting |
| `yarn deploy:all` | Build + deploy everything |
| `yarn backup:create` | Create Firestore backup |
| `yarn backup:list` | List Firestore backups |

## Documentation

Detailed documentation is available in the `docs/` directory at the repository root:

- [Architecture Overview](docs/ARCHITECTURE.md)
- [User Guide](docs/user-guide.md)
- [Admin Guide](docs/admin-guide.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Firestore Structure](docs/firestore-structure.md)
- [RBAC Configuration](docs/rbac-configuration.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Onboarding Guide](docs/onboarding-guide.md)
