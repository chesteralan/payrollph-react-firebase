# Architecture Scan (Focused on `application/`)

## Critical findings first
- This is a **customized CodeIgniter 3-style monolith** (not Laravel/Symfony/WordPress), with heavy business logic inside controllers and model query-builder wrappers.
- The product is a **multi-company payroll management system** with strong coverage for payroll generation, DTR, earnings/benefits/deductions, templates, and print/export workflows.
- Security posture has notable risks in current implementation: **SHA1 passwords**, **CSRF disabled**, hardcoded DB credentials in config, and multiple raw SQL fragments built from request/session values.
- Role-based access exists and is consistently enforced (`department/section/action` via session restrictions), but authorization granularity is tied to code/config conventions.
- No evidence of payment gateway integrations, external APIs, webhook processing, or scheduler/cron orchestration in the `application/` code.

## Detected framework/CMS
- **Framework:** CodeIgniter (CI3 conventions)
- Evidence: `CI_Controller`, `MY_Controller`, `application/config/routes.php`, `application/config/autoload.php`, CI config/session/database structure.

## High-level structure
- `application/controllers/v1/*`: Business modules (Account, Employees, Payroll, Lists, Reports, System)
- `application/models/*`: table-mapped model classes + SQL schema dumps
- `application/views/v1/default/*`: UI templates for all modules
- `application/core/MY_Controller.php`: auth/session guards, helper navigation, payroll base controller
- `application/helpers/*`: auth checks, audit logging, pagination, common helpers
- `application/config/*`: app config, restrictions matrix, DB/session/security settings
- `application/libraries/*`: template data container, reports helper, payroll formula helper

## Routing model
- `application/config/routes.php` only defines default/404/translate settings.
- Effective routing follows CI convention:  
  `/{controller}/{method}/{params}` (e.g., `payroll/view/{id}`, `system_users/restrictions/{id}`).

---

# 1) Executive PRD (Business-Focused)

# Product Requirements Document

## 1. Executive Summary
SMB Payroll is a web-based payroll operations system for organizations managing employee records, time/attendance, compensation components, and payroll cycles per company.  
Its primary business purpose is to centralize payroll preparation, calculation, review, and output (print/payslip/XLS), with role-based staff access and audit trail support.  
Target users include payroll officers, HR/admin staff, and system administrators in multi-company setups.  
Core value: faster payroll cycle execution with reusable templates, structured payroll components, and configurable reporting outputs.

## 2. Product Overview
- **Product type:** Internal back-office payroll and HR operations system.
- **Main workflows:**
  1. Login -> select company
  2. Maintain employee master and compensation setup
  3. Configure payroll templates and payroll periods
  4. Create payroll run, define inclusive dates, generate data
  5. Review/edit DTR/salary/earnings/benefits/deductions
  6. Publish output (print/payslip/transmittal/journal/xls)
- **User journey summary:** Users authenticate, operate within authorized modules and selected company context, then execute payroll lifecycle end-to-end.

## 3. User Types / Roles
Role model is permission-based (not named static roles) via `user_accounts_restrictions`:
- Access dimensions: `department` + `section` + action flags (`view/add/edit/delete`)
- Departments/sections configured in `application/config/payroll.php`:
  - `payroll`: payroll, templates
  - `employees`: employees, calendar, groups, positions, areas
  - `lists`: names, benefits, earnings, deductions
  - `reports`: 13month
  - `system`: companies, terms, calendar, users, audit, database

## 4. Features & Modules (Business view)

| Module | Purpose | Key User Actions | Core Rules |
|---|---|---|---|
| Account & Session | Secure access and context init | login/logout/change password/settings | must be logged in; session company context required for most modules |
| Multi-company context | Isolate payroll data by company | select/switch company | current company stored in session; many queries filter by company |
| Employee Registry | Manage employee records and profile | add/edit/deactivate/restore, profile tabs, report export | employee linked to person (`names_*`) + company/group/position/area/status |
| DTR & Leave | Track attendance/absences/overtime/leave usage | edit day entries, add leave, overtime updates, attendance assignment | leave benefits validated against yearly allowance context |
| Compensation Lists | Maintain global component catalogs | CRUD for earnings/deductions/benefits/terms | used as selectable columns/items in templates and payroll |
| Employee Compensation | Assign salaries, earnings, deductions, benefits | add/edit entries, mark primary salary, archive/trash | entries may be active/trash/primary and template-scoped |
| Payroll Templates | Reusable payroll blueprint | configure groups, employees, earning/benefit/deduction columns, print columns | template can clone from existing payroll |
| Payroll Runs | Execute payroll cycle | add/edit/lock/unlock, inclusive dates, generate, assign employees/groups | generation composes payroll employee lines and component entries |
| Payroll Processing Views | Stage-by-stage validation | DTR, Salaries, Earnings, Benefits, Deductions, Summary | gated by company column-group settings |
| Payroll Output | Final outputs for operations/accounting | print, payslip, transmittal, journal, denomination, XLS | supports print groups, custom company print CSS, configurable columns |
| Reporting | 13th month and employee report exports | filter and export data | payroll/year-linked calculations |
| System Admin | Governance and maintenance | users/restrictions/companies/terms/calendar/audit/database backup/verify | admin-like capabilities controlled by restrictions |

## 5. Functional Requirements (inferred from implementation)
- User must authenticate with username/password; successful login loads authorization matrix and user settings.
- User must have `current_company_id` for most core modules.
- System must support assigning users to one or many companies.
- Payroll run must support:
  - template link
  - inclusive dates calendar
  - grouped employee assignment
  - generated salary/earning/benefit/deduction entries
- Payroll run must support manual overrides/entries and per-employee status/group/position/area/print group/payslip template.
- System must maintain audit records of key user actions.
- Data exports must support browser-delivered `.xls`.
- Names import must support CSV ingest to create/update person/profile records.

## 6. Non-Functional Requirements (observed/implicit)
- **Security:** session-based auth, per-module permissions; but CSRF disabled and weak password hashing.
- **Performance:** pagination and selective queries in many lists; large subquery usage may degrade at scale.
- **Scalability:** single DB monolith, no queue/scheduler patterns detected.
- **Reliability:** direct DB writes and transactional complexity in generation flows; limited explicit transaction handling visible.
- **Usability:** modal-heavy Bootstrap UI, search/autocomplete flows, print-friendly outputs.
- **Accessibility:** no explicit accessibility framework/patterns detected (Needs Verification).

## 7. Technical Architecture
- **Framework:** CodeIgniter 3-style with custom `MY_Controller`, `PAYROLL_Controller`
- **Language:** PHP (exact version not explicitly declared in scanned files; Needs Verification)
- **DB:** MySQL/MariaDB via `mysqli`
- **Session store:** database table `account_sessions`
- **Frontend stack:** Bootstrap themes, jQuery/jQuery UI, bootstrap-select, bootstrap-toggle, tag-it, NProgress, numeral.js
- **Versioning in code:** `APP_VERSION = 1.2.3`, `APP_NAME = SMB Payroll`

## 8. Data Model (main entities)
- Identity & access: `user_accounts`, `user_accounts_restrictions`, `user_accounts_companies`, `user_accounts_options`, `account_sessions`
- Organization: `companies_list`, `companies_options`, `companies_period`, `system_audit`, `calendar`, `terms_list`
- Person/employee master: `names_list`, `names_info`, `names_meta`, `employees`, `employees_contacts`, `employees_groups`, `employees_positions`, `employees_areas`
- Time & leave: `employees_attendance`, `employees_absences`, `employees_overtime`, `employees_leave_benefits`, `employees_timesheets`
- Compensation configuration: `benefits_list`, `earnings_list`, `deductions_list`, plus employee-level entries/tables
- Payroll runtime: `payroll`, `payroll_inclusive_dates`, `payroll_groups`, `payroll_employees`, payroll component tables (`payroll_*`, `payroll_employees_*`)
- Template layer: `payroll_templates`, `payroll_templates_*`, `payroll_print_columns`, `payroll_meta`

## 9. Integrations
- **Detected:** file-based CSV import and XLS exports.
- **Not detected in `application/`:** payment gateways, external payroll APIs, webhooks, message queues, email provider integration, SMS gateways.

## 10. Risks / Technical Debt
- SHA1 password hashing in account flows.
- CSRF protection disabled in config.
- DB credentials hardcoded in repo config.
- Raw SQL string concatenation with request-derived values in multiple controllers.
- Large fat controllers and heavy SQL subqueries reduce maintainability.
- Legacy utility bugs in helpers (`payroll_helper.php` variable misuse), suggesting low test coverage.
- Database maintenance endpoints (`system_database/*`) allow schema mutation through web actions; high operational risk if exposed.

## 11. Improvement Opportunities (v2)
- Security hardening: migrate passwords to bcrypt/argon2, enable CSRF, parameterize all dynamic SQL, move secrets to env.
- Service-layer refactor: extract payroll generation/calculation from controllers into domain services with tests.
- Data/API modernization: introduce REST API boundary and DTO validation for critical writes.
- UX modernization: improve workflow guidance, reduce page reload/modal nesting, add stronger validation/error feedback.
- Observability: add structured logs, job/audit event analytics, and payroll run diagnostics.

## 12. Open Questions
- Exact production PHP/CI versions and deployment topology (Needs Verification).
- Whether any external integrations exist outside `application/` folder.
- Intended security model for `system_database` endpoints in production.
- Whether payroll calculations are legally localized beyond current formulas/rules.

---

# 2) Technical PRD (Developer-Focused)

## A. Module inventory with evidence (routes/files/tables)

| Feature | Routes/Endpoints (examples) | Core PHP Files | Primary Tables |
|---|---|---|---|
| Authentication & session | `account/login`, `account/logout`, `welcome/change_password` | `controllers/v1/Account.php`, `controllers/v1/Welcome.php`, `core/MY_Controller.php` | `user_accounts`, `account_sessions`, `user_accounts_options`, `user_accounts_restrictions` |
| Authorization matrix | invoked in almost all controllers via `_isAuth(...)` | `core/MY_Controller.php`, `helpers/auth_helper.php`, `config/payroll.php` | `user_accounts_restrictions` |
| Company context switching | `welcome/select_company`, `welcome/change_company` | `controllers/v1/Welcome.php` | `user_accounts_companies`, `companies_list` |
| User admin | `system_users/*` | `controllers/v1/System_users.php` | `user_accounts`, `user_accounts_restrictions`, `user_accounts_companies` |
| Company admin/settings | `system_companies/*` | `controllers/v1/System_companies.php` | `companies_list`, `companies_options`, `companies_period` |
| Employee master | `employees/*` | `controllers/v1/Employees.php` | `employees`, `names_list`, `names_info`, `employees_groups`, `employees_positions`, `employees_areas`, `employees_contacts` |
| Employee DTR | `employees_dtr/*` | `controllers/v1/Employees_dtr.php` | `employees_absences`, `employees_attendance`, `employees_overtime`, `employees_leave_benefits` |
| Lists (names/earnings/deductions/benefits) | `lists_names/*`, `lists_earnings/*`, `lists_deductions/*`, `lists_benefits/*` | corresponding controllers in `controllers/v1` | `names_*`, `earnings_list`, `deductions_list`, `benefits_list` |
| CSV import (names) | `lists_names/import` | `controllers/v1/Lists_names.php` | `names_list`, `names_info`, `names_meta` |
| Payroll templates | `payroll_templates/*` | `controllers/v1/Payroll_templates.php` | `payroll_templates`, `payroll_templates_groups`, `payroll_templates_employees`, `payroll_templates_earnings`, `payroll_templates_benefits`, `payroll_templates_deductions`, `payroll_templates_columns` |
| Payroll run lifecycle | `payroll/*` | `controllers/v1/Payroll.php` | `payroll`, `payroll_inclusive_dates`, `payroll_groups`, `payroll_employees`, `payroll_*`, `payroll_employees_*` |
| Payroll stage views | `payroll_dtr/*`, `payroll_salaries/*`, `payroll_earnings/*`, `payroll_benefits/*`, `payroll_deductions/*`, `payroll_summary/*` | corresponding controllers | payroll runtime tables + employee component tables |
| Payroll outputs | `payroll_overall/view/{id}/{group}/{mode}` | `controllers/v1/Payroll_overall.php` + `views/v1/default/payroll/payroll/overall/*` | payroll runtime tables, print-column/options tables |
| Reports | `reports_13month/*`, employee/name reports | `controllers/v1/Reports_13month.php`, `Employees.php`, `Lists_names.php` | payroll and employee-related tables |
| System audit | appears on core writes and in system module | `helpers/common_helper.php`, `controllers/v1/System_audit.php` | `system_audit` |
| Database tools | `system_database/*` | `controllers/v1/System_database.php` | all mapped tables via model metadata |

## B. Functional requirements by subsystem
- **Auth/session:** login validates credentials, sets session + access map + current company fallback.
- **RBAC:** every module method checks capability (`view/add/edit/delete`) by section.
- **Employee domain:** decoupled identity (`names_*`) and employment (`employees`).
- **Payroll generation engine:** builds payroll rows from template or source payroll, with computed earnings/deductions/benefits and salary propagation.
- **DTR integration:** absences/overtime/attendance feed payroll context and leave analytics.
- **Output engine:** print group filtering + configurable print columns + multiple output formats.

## C. Non-functional constraints (technical)
- Stateful web session and request-driven workflows.
- No queue/worker separation for heavy generation.
- SQL-heavy rendering for reports/print pages.
- Legacy CI view/controller coupling.

## D. Technical debt hotspots
- `controllers/v1/Payroll.php` and `controllers/v1/Payroll_overall.php`: very large and tightly coupled.
- `helpers/payroll_helper.php`: apparent defects (`$options` undefined in functions).
- Config security defaults (`csrf_protection` false, plaintext DB credentials in code).

---

# 3) Feature Inventory Checklist

- [x] Login/logout/session management  
- [x] Change password and personal settings  
- [x] Multi-company selection and context switching  
- [x] Permission-based module/action access control  
- [x] User account CRUD  
- [x] User-to-company assignment  
- [x] User restriction matrix management  
- [x] Company CRUD + soft-delete/restore  
- [x] Company payroll period setup  
- [x] Company print/group/column/workday settings  
- [x] Employee CRUD and profile tabs  
- [x] Employee groups/positions/areas management  
- [x] Employee salary management (primary salary support)  
- [x] Employee earnings/deductions/benefits management  
- [x] Employee DTR (attendance/absences/overtime)  
- [x] Leave benefits entitlement tracking  
- [x] Names list management + CSV import  
- [x] Earnings/deductions/benefits list management  
- [x] Payroll template CRUD/configuration  
- [x] Payroll run CRUD + lock/unlock  
- [x] Inclusive dates calendar management  
- [x] Payroll generation from template or prior payroll  
- [x] Payroll employees assignment and grouping  
- [x] Payroll earnings/benefits/deductions staging and entry edits  
- [x] Payroll summary and by-name views  
- [x] Payroll print/payslip/transmittal/journal/denomination outputs  
- [x] Payroll XLS export  
- [x] Employee and names report XLS export  
- [x] 13th month report  
- [x] System audit trail  
- [x] Database backup listing/download/delete + schema verify/fix tools  
- [ ] Public registration (not found)  
- [ ] Payment gateway integration (not found)  
- [ ] Email notification pipeline (Needs Verification; not found in scanned code)  
- [ ] Scheduled cron tasks (not found)

---

# 4) Suggested v2 Modernization Roadmap

## Phase 1 (Security + Stability)
- Replace SHA1 auth with bcrypt/argon2 + forced password migration.
- Enable CSRF and tighten cookie/session policies.
- Move DB secrets to env; remove hardcoded credentials.
- Lock down or remove web-exposed schema mutation endpoints (`system_database/*`).

## Phase 2 (Architecture Refactor)
- Extract payroll generation/calculation from controllers into dedicated services.
- Add transaction boundaries around multi-table payroll generation.
- Add unit/integration tests for payroll math, leave logic, and permission checks.

## Phase 3 (Data + API)
- Introduce API layer for core entities (employees, payroll runs, components).
- Replace SQL subquery-heavy screens with pre-aggregated query services.
- Add background jobs for heavy print/report/export tasks.

## Phase 4 (UX + Observability)
- Streamline modal-heavy flows with clearer stepper workflows.
- Add analytics on payroll run duration, error rates, and user action telemetry.
- Add structured logs and alerting around payroll generation failures.
