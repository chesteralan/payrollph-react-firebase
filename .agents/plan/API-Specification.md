# API Specification (Headless Backend Target)

## 1. Purpose

Define a proposed API contract if the system is evolved into a headless backend for web/mobile clients.

## 2. API Style

- **Protocol:** HTTPS
- **Format:** JSON
- **Versioning:** `/api/v1/...`
- **Auth:** JWT or session token (implementation decision)
- **Authorization:** role/permission matrix mapped from existing department/section/action model

## 3. Resource Domains

- Authentication
- Users and Access Control
- Companies and Settings
- Employees and Profiles
- DTR (attendance/absence/overtime/leave)
- Lists (earnings/deductions/benefits/terms)
- Payroll Templates
- Payroll Runs
- Payroll Processing (stages)
- Reports and Exports
- Audit

## 4. Core Endpoints (Proposed)

## 4.1 Authentication

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/change-password`
- `GET  /api/v1/auth/me`

## 4.2 Users / RBAC

- `GET    /api/v1/users`
- `POST   /api/v1/users`
- `GET    /api/v1/users/{id}`
- `PATCH  /api/v1/users/{id}`
- `DELETE /api/v1/users/{id}`
- `GET    /api/v1/users/{id}/restrictions`
- `PUT    /api/v1/users/{id}/restrictions`
- `GET    /api/v1/users/{id}/companies`
- `PUT    /api/v1/users/{id}/companies`

## 4.3 Companies

- `GET    /api/v1/companies`
- `POST   /api/v1/companies`
- `GET    /api/v1/companies/{id}`
- `PATCH  /api/v1/companies/{id}`
- `DELETE /api/v1/companies/{id}`
- `GET    /api/v1/companies/{id}/options`
- `PUT    /api/v1/companies/{id}/options`
- `GET    /api/v1/companies/{id}/periods`
- `POST   /api/v1/companies/{id}/periods`
- `PATCH  /api/v1/companies/{id}/periods/{periodId}`
- `DELETE /api/v1/companies/{id}/periods/{periodId}`

## 4.4 Employees

- `GET    /api/v1/employees`
- `POST   /api/v1/employees`
- `GET    /api/v1/employees/{nameId}`
- `PATCH  /api/v1/employees/{nameId}`
- `DELETE /api/v1/employees/{nameId}`
- `POST   /api/v1/employees/import` (CSV)
- `GET    /api/v1/employees/{nameId}/salaries`
- `POST   /api/v1/employees/{nameId}/salaries`
- `PATCH  /api/v1/employees/{nameId}/salaries/{salaryId}`
- `DELETE /api/v1/employees/{nameId}/salaries/{salaryId}`

## 4.5 DTR

- `GET    /api/v1/employees/{nameId}/attendance`
- `PUT    /api/v1/employees/{nameId}/attendance/{date}`
- `GET    /api/v1/employees/{nameId}/absences`
- `PUT    /api/v1/employees/{nameId}/absences/{date}`
- `GET    /api/v1/employees/{nameId}/overtime`
- `PUT    /api/v1/employees/{nameId}/overtime/{date}`
- `GET    /api/v1/employees/{nameId}/leave-benefits`
- `PUT    /api/v1/employees/{nameId}/leave-benefits/{year}`

## 4.6 Lists

- `GET|POST|PATCH|DELETE /api/v1/lists/earnings`
- `GET|POST|PATCH|DELETE /api/v1/lists/deductions`
- `GET|POST|PATCH|DELETE /api/v1/lists/benefits`
- `GET|POST|PATCH|DELETE /api/v1/lists/terms`

## 4.7 Payroll Templates

- `GET    /api/v1/payroll-templates`
- `POST   /api/v1/payroll-templates`
- `GET    /api/v1/payroll-templates/{id}`
- `PATCH  /api/v1/payroll-templates/{id}`
- `DELETE /api/v1/payroll-templates/{id}`
- `PUT    /api/v1/payroll-templates/{id}/groups`
- `PUT    /api/v1/payroll-templates/{id}/employees`
- `PUT    /api/v1/payroll-templates/{id}/earnings`
- `PUT    /api/v1/payroll-templates/{id}/benefits`
- `PUT    /api/v1/payroll-templates/{id}/deductions`
- `PUT    /api/v1/payroll-templates/{id}/print-columns`

## 4.8 Payroll Runs

- `GET    /api/v1/payroll-runs`
- `POST   /api/v1/payroll-runs`
- `GET    /api/v1/payroll-runs/{id}`
- `PATCH  /api/v1/payroll-runs/{id}`
- `POST   /api/v1/payroll-runs/{id}/lock`
- `POST   /api/v1/payroll-runs/{id}/unlock`
- `PUT    /api/v1/payroll-runs/{id}/inclusive-dates`
- `PUT    /api/v1/payroll-runs/{id}/groups`
- `PUT    /api/v1/payroll-runs/{id}/employees`
- `POST   /api/v1/payroll-runs/{id}/generate`

## 4.9 Payroll Stage Endpoints

- `GET|PUT /api/v1/payroll-runs/{id}/dtr`
- `GET|PUT /api/v1/payroll-runs/{id}/salaries`
- `GET|PUT /api/v1/payroll-runs/{id}/earnings`
- `GET|PUT /api/v1/payroll-runs/{id}/benefits`
- `GET|PUT /api/v1/payroll-runs/{id}/deductions`
- `GET     /api/v1/payroll-runs/{id}/summary`

## 4.10 Reports and Exports

- `GET /api/v1/reports/13th-month?year=YYYY`
- `GET /api/v1/reports/employees`
- `GET /api/v1/payroll-runs/{id}/outputs?mode=summary|payslip|journal|transmittal|xls`

## 5. Request/Response Standards

- Standard envelope:
  - `data`
  - `meta`
  - `errors`
- Pagination:
  - `page`, `per_page`, `total`, `total_pages`
- Validation errors:
  - field-level messages
  - machine-readable error code

## 6. Security and Access Rules

- Token/session required for all non-auth endpoints.
- Company scope required for tenant data requests.
- Permission checks mapped from current restrictions:
  - `view`, `add`, `edit`, `delete` per module section.

## 7. Idempotency and Concurrency

- Support idempotency key on `POST /generate` and other high-impact actions.
- Add optimistic concurrency/version fields for payroll updates where practical.

## 8. API Non-Functional Requirements

- P95 response target:
  - standard reads < 400ms
  - heavy report endpoints < 2s (async option for larger loads)
- Structured logs for all write operations.
- Audit events emitted for critical changes.

## 9. OpenAPI Deliverable (Next Step)

- Produce `openapi.yaml` with:
  - schema definitions
  - endpoint contracts
  - auth schemes
  - error catalog

