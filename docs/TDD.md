# Technical Design Document (TDD)

## 1. Purpose

This document defines the current technical design of the payroll application based on implemented source code in the `application/` codebase. It is intended for developers and technical stakeholders who need to understand architecture, core modules, data flow, and constraints before maintenance, refactoring, or modernization work.

## 2. System Context

- **Product Name:** SMB Payroll
- **Architecture Style:** Monolithic PHP web application (CodeIgniter 3 pattern with custom base controllers/models)
- **Primary Domain:** Multi-company payroll operations
- **Core Functions:** User access control, employee master data, compensation setup, payroll run generation, DTR processing, payroll outputs (print/payslip/XLS), reporting

## 3. Technology Stack

- **Backend:** PHP + CodeIgniter 3 conventions
- **Database:** MySQL/MariaDB via `mysqli`
- **Session Storage:** Database-backed sessions (`account_sessions`)
- **Frontend Libraries:** Bootstrap themes, jQuery, jQuery UI, bootstrap-select, bootstrap-toggle, tag-it, NProgress, numeral.js
- **Template System:** CodeIgniter views + custom `Template_data` library

## 4. Codebase Structure (Logical)

- `application/controllers/v1/`
  - Feature controllers grouped by domain:
    - Account/Welcome
    - Employees and related setup
    - Lists (names/benefits/earnings/deductions)
    - Payroll templates and payroll runs
    - Reports
    - System admin tools
- `application/models/`
  - One model class per table pattern
  - SQL schema dumps (`create_table_dump.sql`, `payrollph.sql`, etc.)
- `application/views/v1/default/`
  - UI templates per module, including print/XLS/payslip views
- `application/core/`
  - `MY_Controller.php` (session/auth guard, authorization helper, payroll navigation helpers)
  - `MY_Model.php` (custom model base behavior)
- `application/helpers/`
  - Auth, common utilities, payroll/company option helpers, UI helpers
- `application/config/`
  - Routing, autoload, security/session/db config, payroll restrictions and constants

## 5. Runtime Architecture

### 5.1 Request Flow

1. HTTP request enters CodeIgniter front controller.
2. Router resolves to controller/method by conventional CI route mapping.
3. `MY_Controller` or `PAYROLL_Controller` constructor executes:
   - Session validation (`loggedIn`)
   - Company context enforcement
   - Permission checks (`_isAuth`)
   - Theme/template defaults
4. Controller method performs input validation and model operations.
5. Controller prepares template data and renders view.

### 5.2 Authorization Model

- Authorization is section-based and action-based:
  - `department` + `section` + action flags (`view`, `add`, `edit`, `delete`)
- Restrictions are loaded at login into `session_auth` from `user_accounts_restrictions`.
- Every protected method invokes `_isAuth(...)` or equivalent checks.

### 5.3 Multi-Company Context

- Current company is stored in session:
  - `current_company_id`, `current_company`, `current_company_theme`
- Most data queries scope by `company_id`.
- Users can be assigned to multiple companies (`user_accounts_companies`) and switch context.

## 6. Functional Module Design

## 6.1 Account & Session

- **Primary Controllers:** `Account`, `Welcome`
- **Key Behaviors:**
  - Login with username/password validation
  - Session initialization with user identity and access matrix
  - Company initialization (first assigned company or explicit selection)
  - User settings persistence (theme/profile updates)
  - Password change

## 6.2 System Administration

- **Controllers:** `System_users`, `System_companies`, `System_terms`, `System_calendar`, `System_audit`, `System_database`
- **Design Notes:**
  - User CRUD, restriction mapping, and company assignment
  - Company configuration (print groups, workdays, payroll periods, column groups)
  - Terminology management (`terms_list`) for status/print group/etc.
  - Database backup browser and schema verification/fix actions (high-risk admin endpoints)

## 6.3 Employee Domain

- **Controllers:** `Employees`, `Employees_*` modules
- **Design Notes:**
  - Separate person identity (`names_*`) from employment (`employees`)
  - Employee profile sections include personal, employment, contacts, IDs, emergency info
  - Support group/position/area/status categorization
  - Salary entries with primary selection and history/trash handling
  - Employee-level earnings, benefits, deductions assignment

## 6.4 DTR, Attendance, Absence, Overtime, Leave

- **Controllers:** `Employees_dtr`, `Payroll_dtr`
- **Design Notes:**
  - Monthly employee calendar view for attendance/absence/overtime
  - Leave benefit entitlement tracking by year/company
  - Payroll DTR view derives per-payroll period metrics from inclusive dates + attendance/absence/overtime data

## 6.5 Lists Management

- **Controllers:** `Lists_names`, `Lists_earnings`, `Lists_deductions`, `Lists_benefits`
- **Design Notes:**
  - Global catalog tables feed template and payroll component columns
  - CSV import pipeline for names (`lists_names/import`)
  - Summary/analysis views for deductions and related entries

## 6.6 Payroll Templates

- **Controller:** `Payroll_templates`
- **Design Notes:**
  - Template defines:
    - grouping strategy
    - template employee assignments
    - earnings/benefits/deductions columns and order
    - print columns and output preferences
  - Template can reference existing payroll as source pattern

## 6.7 Payroll Run Lifecycle

- **Controller:** `Payroll`
- **Lifecycle Steps:**
  1. Create payroll with template and period metadata
  2. Define inclusive dates
  3. Generate payroll data from template or source payroll
  4. Manage groups and employee assignments
  5. Validate/adjust through stage modules:
     - DTR
     - Salaries
     - Earnings
     - Benefits
     - Deductions
     - Summary
  6. Lock/unlock and produce final outputs

## 6.8 Payroll Outputs

- **Controller:** `Payroll_overall`
- **Output Modes:** print summary, payslip variants, transmittal, journal, denomination, XLS
- **Design Notes:**
  - Supports print groups and configurable per-company print CSS
  - Relies on extensive computed query fields across payroll component tables

## 6.9 Reporting

- **Controllers:** `Reports_13month`, employee and names report actions
- **Design Notes:**
  - 13th month computations are query-driven from payroll employee salary/absence context
  - Employee and names report export available via XLS-rendered views

## 7. Data Design

### 7.1 Core Entity Groups

- **Identity/Access:** `user_accounts`, `user_accounts_restrictions`, `user_accounts_companies`, `user_accounts_options`, `account_sessions`
- **Organization Config:** `companies_list`, `companies_options`, `companies_period`, `terms_list`, `system_audit`, `calendar`
- **People & Employment:** `names_list`, `names_info`, `names_meta`, `employees`, `employees_contacts`, `employees_groups`, `employees_positions`, `employees_areas`
- **Time & Leave:** `employees_attendance`, `employees_absences`, `employees_overtime`, `employees_leave_benefits`, `employees_timesheets`
- **Compensation Catalog:** `benefits_list`, `earnings_list`, `deductions_list`
- **Payroll Runtime:** `payroll`, `payroll_inclusive_dates`, `payroll_groups`, `payroll_employees`, `payroll_earnings`, `payroll_benefits`, `payroll_deductions`, `payroll_employees_*`
- **Template Runtime:** `payroll_templates`, `payroll_templates_*`, `payroll_print_columns`, `payroll_meta`

### 7.2 Relationship Highlights

- User -> many companies (`user_accounts_companies`)
- Company -> many employees, payrolls, options, periods
- Employee (`name_id`) -> salaries, earnings, benefits, deductions, absences, attendance, overtime
- Payroll -> many inclusive dates, groups, payroll employees, component column definitions
- Payroll employee -> salary + earning + benefit + deduction entries for the run
- Template -> group/employee/component selection reused for generation

## 8. Core Algorithm Design: Payroll Generation

The generation pipeline (in `Payroll` controller) performs:

1. Load payroll and inclusive date summary (start/end/working_days).
2. Resolve source:
   - from prior payroll (`_generate_from_payroll`) or
   - from template (`_generate_from_template`).
3. Seed payroll groups and payroll employee rows.
4. Copy/resolve base salary entries for payroll employees.
5. Build payroll-level component columns (earnings/deductions/benefits).
6. For each employee and each selected component:
   - evaluate computation mode (`month`, `day`, `hour`)
   - apply multipliers (employment years, birthday years, day-of-week counts, inclusive days)
   - enforce max amount caps (if configured)
   - insert payroll employee component rows if amount > 0

## 9. Non-Functional Design

## 9.1 Security

- **Implemented:** session auth, section/action authorization checks, audit logging
- **Current Risks:**
  - SHA1 password hashing
  - CSRF disabled
  - hardcoded DB credentials in config
  - dynamic SQL string composition in query filters/conditions

## 9.2 Performance

- Uses pagination in many list pages.
- Heavy reliance on nested subqueries in list and print views may degrade on large datasets.
- No background processing for generation/export; requests can become heavy.

## 9.3 Reliability

- Core multi-step payroll writes lack explicit transaction orchestration across all operations.
- Soft-delete patterns are common; restoration workflows are available for key entities.

## 10. External Interfaces

- **HTTP UI Endpoints:** controller/method URI model
- **Data Import:** CSV upload for names import
- **Data Export:** XLS outputs from views
- **Not Implemented (in analyzed code):** payment gateways, webhook receivers, third-party API clients, scheduler workers

## 11. Deployment/Configuration Considerations

- DB and environment configs are currently file-based under `application/config/`.
- Session driver uses database (`account_sessions`).
- Theme and various module settings are persisted via company/user options tables.

## 12. Known Risks and Design Debt

1. Controller classes are large and contain mixed concerns (input handling, business rules, query logic).
2. Business logic duplication across payroll stage controllers.
3. Helper-level defects indicate missing automated validation.
4. Admin database mutation endpoints can be dangerous if not strongly access-controlled.

## 13. Modernization Design Recommendations

### 13.1 Architecture
- Introduce domain services:
  - `PayrollGenerationService`
  - `PayrollComputationService`
  - `EmployeeCompensationService`
- Move SQL-heavy derived fields into repository/query service layer.

### 13.2 Security
- Migrate password hashing to Argon2/Bcrypt.
- Enable CSRF and tighten cookie/session flags.
- Replace inline dynamic SQL with parameterized query-builder patterns.
- Move credentials and secret config to environment variables.

### 13.3 Data and Processing
- Add DB transactions around payroll generation workflows.
- Add idempotency protections for repeated generation actions.
- Consider asynchronous jobs for report/export generation.

### 13.4 Quality
- Add test coverage for:
  - authorization matrix
  - payroll generation math
  - leave allowance calculations
  - import/export paths

## 14. Appendix: Key Files

- `application/core/MY_Controller.php`
- `application/controllers/v1/Account.php`
- `application/controllers/v1/Welcome.php`
- `application/controllers/v1/Employees.php`
- `application/controllers/v1/Employees_dtr.php`
- `application/controllers/v1/Payroll.php`
- `application/controllers/v1/Payroll_templates.php`
- `application/controllers/v1/Payroll_dtr.php`
- `application/controllers/v1/Payroll_overall.php`
- `application/controllers/v1/System_users.php`
- `application/controllers/v1/System_companies.php`
- `application/controllers/v1/System_database.php`
- `application/config/payroll.php`
- `application/config/autoload.php`
- `application/config/config.php`
- `application/models/create_table_dump.sql`
