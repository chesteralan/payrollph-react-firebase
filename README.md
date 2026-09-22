# PayrollPH

A comprehensive payroll management system for Philippine businesses, built with React and Firebase.

## Features

- **Employee Management** — Profiles, groups, positions, areas, and document tracking
- **Payroll Processing** — Create payrolls with configurable earnings, deductions, benefits, and 13th month computation
- **Daily Time Record (DTR)** — Track attendance, leaves, overtime, and late hours
- **Reports** — Payroll summary, earnings/deductions breakdown, attendance, benefits utilization, year-end, and 13th month reports
- **Print Formats** — Customizable payslips, registers, journals, denomination tables, and transmittal forms
- **System Administration** — Multi-company support, user management, IP restrictions, audit logs, and database management
- **Offline Support** — Service worker caching and IndexedDB action queuing for offline resilience
- **Security** — Firebase App Check, AES-GCM encryption for sensitive fields, rate limiting, and input sanitization

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript 6, Tailwind CSS v4 |
| Build | Vite 8, Turborepo |
| Backend | Firebase (Auth, Firestore, Storage, Hosting) |
| Testing | Vitest (unit), Playwright (E2E) |
| Package Manager | Yarn 1.x workspaces |

## Project Structure

```
payrollph-react-firebase/
├── apps/
│   └── web/                    # Main web application
│       ├── src/
│       │   ├── components/     # Reusable UI components
│       │   ├── context/        # React context providers
│       │   ├── hooks/          # Custom React hooks
│       │   ├── pages/          # Page components (route-level)
│       │   ├── services/       # Firebase services and business logic
│       │   ├── utils/          # Utility functions
│       │   ├── validation/     # Zod validation schemas
│       │   └── types/          # TypeScript type definitions
│       ├── e2e/                # Playwright E2E tests
│       └── public/             # Static assets
├── docs/                       # Project documentation
│   ├── superpowers/            # Audit reports and fix plans
│   ├── admin-guide.md
│   ├── deployment-guide.md
│   ├── firestore-structure.md
│   ├── user-guide.md
│   └── ...
├── firebase.json               # Firebase hosting configuration
├── firestore.rules             # Firestore security rules
└── turbo.json                  # Turborepo pipeline config
```

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn 1.x
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

```bash
# Clone the repository
git clone https://github.com/chesteralan/payrollph-react-firebase.git
cd payrollph-react-firebase

# Install dependencies
yarn install
```

### Environment Setup

Create `apps/web/.env.local` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_EMAIL_API_URL=https://your-cloud-function-url
```

### Development

```bash
# Start dev server
yarn dev

# Build for production
yarn build

# Run all tests
yarn test

# Run E2E tests
cd apps/web && npx playwright test
```

## Scripts

| Command | Description |
|---------|-------------|
| `yarn dev` | Start Vite dev server |
| `yarn build` | Production build |
| `yarn lint` | Run ESLint |
| `yarn test` | Run Vitest unit tests |
| `yarn type-check` | Run TypeScript compiler |
| `yarn deploy` | Deploy to Firebase Hosting |

## Testing

### Unit Tests (Vitest)

```bash
cd apps/web
yarn test:run              # Run all tests
yarn test:run --coverage   # Run with coverage report
```

- 204 test files covering utilities, components, hooks, contexts, services, and pages
- Firebase mocking via global test setup

### E2E Tests (Playwright)

```bash
cd apps/web
npx playwright test                        # Run all E2E tests
npx playwright test --project=chromium     # Run Chromium only
npx playwright test e2e/login.spec.ts      # Run specific test file
npx playwright show-report                 # View HTML report
```

- 71 E2E tests across smoke, login, and page tests
- Firebase auth mocking for protected page testing

## Architecture

### Route Structure

All protected routes are wrapped in `ProtectedRoute` → `AppLayout` → `LazyPage`:

| Route | Page |
|-------|------|
| `/` | Dashboard |
| `/employees` | Employee list |
| `/employees/:id` | Employee profile |
| `/payroll` | Payroll runs |
| `/payroll/new` | Create payroll wizard |
| `/payroll/:id` | Payroll detail |
| `/dtr` | Daily Time Record |
| `/reports/*` | Report pages (7 reports) |
| `/system/*` | System administration (11 pages) |
| `/lists/*` | Names, benefits, earnings, deductions |

### Key Patterns

- **Lazy loading** — All page components are lazy-loaded via `lazyNamed()` helper
- **Context providers** — `AuthContext` and `CompanyContext` with observable `ValueStore` pattern
- **Custom hooks** — `useAuth`, `useCompany`, `usePermissions`, `useToast`, `useTableSort`
- **Zod validation** — Runtime validation for Firestore document shapes
- **Service layer** — Firebase operations abstracted in `src/services/`

## Security

- **Firebase App Check** — ReCAPTCHA v3 abuse protection
- **AES-GCM encryption** — SSS, TIN, PhilHealth, HDMF, bank account fields
- **Rate limiting** — Client-side rate limiters for auth, API, search, and import
- **Input sanitization** — XSS and SQL injection prevention
- **CSP headers** — Content Security Policy in production and staging
- **Session timeout** — 30-minute idle timeout with 1-minute warning

## Deployment

```bash
# Build and deploy to Firebase Hosting
yarn deploy

# Deploy Firestore rules
cd apps/web && yarn deploy:rules
```

See [docs/deployment-guide.md](docs/deployment-guide.md) for detailed deployment instructions.

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the coding standards in `docs/REFACTOR_RULES.md`
3. Run `yarn lint` and `yarn type-check` before committing
4. Add tests for new features
5. Submit a pull request

## License

Private — Internal use only.
