# System Architecture Document

## 1. Purpose

Document the current PHP application architecture as implemented, including structure, module boundaries, runtime flow, and operational constraints.

## 2. Current System Summary

- **Application Type:** Monolithic web application
- **Framework Pattern:** CodeIgniter 3-style MVC with custom base classes
- **Domain:** Multi-company payroll and HR operations
- **Core Capabilities:** Auth/RBAC, employee master, compensation setup, payroll generation, DTR processing, reports, export/print outputs

## 3. Technology Stack

- **Backend:** PHP (CodeIgniter conventions)
- **Database:** MySQL/MariaDB (`mysqli`)
- **Session:** Database-backed (`account_sessions`)
- **Frontend:** Server-rendered views with Bootstrap + jQuery stack
- **Exports:** XLS-rendered views, printable views

## 4. Logical Architecture

### 4.1 Presentation Layer
- CodeIgniter views in `application/views/v1/default/*`
- Bootstrap theme-driven UI
- Modal-heavy interaction pattern and server-side rendered forms/tables

### 4.2 Application Layer
- Controllers in `application/controllers/v1/*`
- `MY_Controller` enforces auth/session and shared helper logic
- `PAYROLL_Controller` adds payroll-specific shared behavior

### 4.3 Domain/Data Access Layer
- Model-per-table approach in `application/models/*`
- Query building and business logic mixed across controllers/models
- SQL schema snapshots in `application/models/*.sql`

### 4.4 Shared Utility Layer
- Helpers: auth, common, payroll, bootstrap, error, language
- Libraries: `Template_data`, `Reportsdb`, `Payroll_formula`

## 5. High-Level Module Map

- **Access & Session**
  - `Account`, `Welcome`, `MY_Controller`
- **System Admin**
  - `System_users`, `System_companies`, `System_terms`, `System_calendar`, `System_audit`, `System_database`
- **Employee Domain**
  - `Employees`, `Employees_dtr`, `Employees_calendar`, `Employees_*` modules
- **Lists/Catalog**
  - `Lists_names`, `Lists_earnings`, `Lists_deductions`, `Lists_benefits`
- **Payroll Domain**
  - `Payroll`, `Payroll_templates`, `Payroll_dtr`, `Payroll_salaries`, `Payroll_earnings`, `Payroll_benefits`, `Payroll_deductions`, `Payroll_summary`, `Payroll_overall`, `Payroll_config`, `Payroll_employees`
- **Reporting**
  - `Reports_13month`, report actions in employees/names modules

## 6. Runtime Request Flow

1. Request enters CI front controller.
2. Route resolved by convention (`/{controller}/{method}/{params}`).
3. Base controller constructor runs:
   - session/login check
   - company context check
   - permission check
4. Module controller executes business operation.
5. Model queries execute against MySQL.
6. View rendered with template data.

## 7. Security and Access Architecture

- **Auth:** session-based after login
- **Authorization:** department/section/action matrix via `user_accounts_restrictions`
- **Audit:** critical actions logged to `system_audit`
- **Known Gaps:** SHA1 password storage, CSRF disabled, inline dynamic SQL in some paths

## 8. Data Architecture (Summary)

- Shared DB for all modules.
- Multi-company separation is logical via `company_id`.
- Payroll and template systems use normalized table families:
  - `payroll*`
  - `payroll_templates*`
  - `payroll_employees*`
  - employee compensation tables

## 9. Operational Characteristics

- Synchronous processing for generation and exports.
- Heavy report/query pages rely on nested SQL subqueries.
- No queue/worker/scheduler architecture observed for batch processing.

## 10. Architecture Constraints

- Tight coupling between controller and business rules.
- Large controller classes increase maintenance complexity.
- Business logic duplication across payroll stage controllers.
- Limited transaction boundaries for multi-step writes.

## 11. Recommended Near-Term Architecture Improvements

1. Extract payroll generation into service classes.
2. Centralize permission and validation patterns.
3. Introduce repository/query services for heavy reporting queries.
4. Add transaction and idempotency controls for payroll generation.
5. Harden security baseline before major modernization.

