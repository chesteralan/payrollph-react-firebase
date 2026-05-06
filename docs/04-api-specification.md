# 04 - API Specification

## Scope

This document includes:
1. Existing endpoint patterns discovered in the current PHP app.
2. Recommended REST API design for a headless backend.

## Existing Endpoints (Discovered)

Current app follows CI conventional routes:
- `/{controller}/{method}/{params}`

Key controller endpoints (examples):
- `account/login`, `account/logout`
- `welcome/index`, `welcome/select_company/{id}`
- `system_users/*`, `system_companies/*`, `system_terms/*`
- `employees/*`, `employees_dtr/*`, `employees_salaries/*`, `employees_benefits/*`, `employees_earnings/*`, `employees_deductions/*`
- `lists_names/*`, `lists_earnings/*`, `lists_benefits/*`, `lists_deductions/*`
- `payroll/*`, `payroll_templates/*`, `payroll_dtr/*`, `payroll_salaries/*`, `payroll_earnings/*`, `payroll_benefits/*`, `payroll_deductions/*`, `payroll_summary/*`, `payroll_overall/*`
- `reports_13month/*`

**Evidence:** `application/controllers/v1/*.php`

## Proposed REST API (Headless)

Base URL: `/api/v1`

## Authentication
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`

## Companies
- `GET /companies`
- `POST /companies`
- `GET /companies/{id}`
- `PATCH /companies/{id}`
- `GET /companies/{id}/periods`
- `POST /companies/{id}/periods`
- `PUT /companies/{id}/options`

## Employees
- `GET /employees`
- `POST /employees`
- `GET /employees/{nameId}`
- `PATCH /employees/{nameId}`
- `DELETE /employees/{nameId}`

## Employee DTR
- `GET /employees/{nameId}/attendance`
- `PUT /employees/{nameId}/attendance/{date}`
- `GET /employees/{nameId}/absences`
- `PUT /employees/{nameId}/absences/{date}`
- `GET /employees/{nameId}/overtime`
- `PUT /employees/{nameId}/overtime/{date}`

## Payroll Templates
- `GET /payroll-templates`
- `POST /payroll-templates`
- `GET /payroll-templates/{id}`
- `PATCH /payroll-templates/{id}`
- `PUT /payroll-templates/{id}/groups`
- `PUT /payroll-templates/{id}/employees`
- `PUT /payroll-templates/{id}/earnings`
- `PUT /payroll-templates/{id}/benefits`
- `PUT /payroll-templates/{id}/deductions`

## Payroll Runs
- `GET /payroll-runs`
- `POST /payroll-runs`
- `GET /payroll-runs/{id}`
- `PATCH /payroll-runs/{id}`
- `PUT /payroll-runs/{id}/inclusive-dates`
- `PUT /payroll-runs/{id}/groups`
- `PUT /payroll-runs/{id}/employees`
- `POST /payroll-runs/{id}/generate`
- `POST /payroll-runs/{id}/lock`
- `POST /payroll-runs/{id}/unlock`

## Payroll Stage Data
- `GET|PUT /payroll-runs/{id}/dtr`
- `GET|PUT /payroll-runs/{id}/salaries`
- `GET|PUT /payroll-runs/{id}/earnings`
- `GET|PUT /payroll-runs/{id}/benefits`
- `GET|PUT /payroll-runs/{id}/deductions`
- `GET /payroll-runs/{id}/summary`

## Reports/Outputs
- `GET /reports/13th-month?year=YYYY`
- `GET /reports/employees`
- `GET /payroll-runs/{id}/outputs?mode=summary|payslip|journal|transmittal|xls`

## Auth Methods

Option A (recommended for web + mobile):
- JWT access + refresh tokens

Option B:
- server session with CSRF protection (web-focused)

## Request / Response Examples

## Example: Login Request
```json
{
  "username": "admin",
  "password": "******"
}
```

## Example: Login Response
```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User"
    },
    "token": "jwt-token",
    "expires_in": 3600
  },
  "meta": {
    "request_id": "req-123"
  },
  "errors": []
}
```

## Example: Validation Error
```json
{
  "data": null,
  "meta": {
    "request_id": "req-124"
  },
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "name",
      "message": "Name is required."
    }
  ]
}
```

## Error Format

Standard error object:
- `code`
- `message`
- `field` (optional)
- `details` (optional)

Common codes:
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `CONFLICT`
- `INTERNAL_ERROR`

## Versioning Strategy

- URL versioning: `/api/v1`
- Backward-compatible additions within `v1`
- Breaking changes released as `v2`
- Deprecation window and migration notes per major version

## Notes

- Exact payload fields should be finalized with OpenAPI (`openapi.yaml`).
- Existing PHP endpoints are server-rendered and not REST-native; mapping to REST is part of modernization scope.

