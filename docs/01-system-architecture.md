# 01 - System Architecture Document

## Current System Overview

The system is a monolithic PHP payroll platform built with CodeIgniter 3 conventions and custom base classes. It supports multi-company payroll operations, employee data management, attendance/leave handling, payroll template-driven generation, payroll processing views, and print/export reporting.

**Evidence (code):**
- `application/controllers/v1/*`
- `application/core/MY_Controller.php`
- `application/config/autoload.php`
- `application/config/payroll.php`
- `application/models/create_table_dump.sql`

## Application Layers

## 1) Presentation Layer
- Server-rendered views in `application/views/v1/default/*`
- Bootstrap + jQuery UI behavior
- Print/XLS output templates for payroll and reports

## 2) Application Layer
- Controllers in `application/controllers/v1/*`
- Module orchestration and request handling
- Shared behavior from:
  - `Login_Controller`
  - `MY_Controller`
  - `PAYROLL_Controller`

## 3) Domain/Data Access Layer
- Model-per-table pattern in `application/models/*`
- Business logic split between controllers and model query operations
- SQL schema source in `application/models/create_table_dump.sql`

## 4) Shared Utilities
- Helpers: `auth_helper.php`, `common_helper.php`, `payroll_helper.php`, etc.
- Libraries: `Template_data.php`, `Reportsdb.php`, `Payroll_formula.php`

## Folder / Module Structure

- `application/controllers/v1/`
  - `Account`, `Welcome`
  - `Employees*`, `Lists*`
  - `Payroll*`, `Reports_13month`
  - `System_*`
- `application/models/`
  - Access, company, employee, payroll, template, audit models
- `application/views/v1/default/`
  - module UIs and output templates
- `application/config/`
  - app, DB, autoload, restrictions, constants

## Request Lifecycle

1. Request mapped using CI conventional route (`/{controller}/{method}/{params}`), configured in `application/config/routes.php`.
2. Base constructor runs auth/session/company checks:
   - `MY_Controller::__construct()`
3. Permission check via `_isAuth(dept, section, action)`.
4. Controller action performs validation + model queries.
5. View rendered with `Template_data`.

## Authentication Flow

1. User submits credentials to `Account::login`.
2. System validates against `user_accounts` (password currently SHA1-based).
3. Session initialized with:
   - `loggedIn`
   - user identity
   - `session_auth` restriction matrix
   - user settings and company context
4. If company assigned, redirect to dashboard with selected company session.

**Evidence:**
- `application/controllers/v1/Account.php`
- `application/controllers/v1/Welcome.php`
- `application/core/MY_Controller.php`

## Integrations (Current)

Detected:
- CSV import for names (`Lists_names::import`)
- XLS exports through view responses (`Payroll_overall`, employee/name reports)

Not detected in code:
- Payment gateways
- External webhook handlers
- External API clients
- Job queue integrations

## Deployment Topology (Current / Inferred)

- Web server + PHP runtime serving monolith
- Single MySQL/MariaDB database
- Session persistence in DB table `account_sessions`
- File-system based imports/backup handling in app paths

**Needs Verification:**
- Exact production topology (single VM vs containerized)
- Reverse proxy/load balancer setup
- Separate worker or scheduler infrastructure

## Key Risks

- SHA1 password hashing (`Account.php`, `System_users.php`)
- CSRF disabled (`application/config/config.php`)
- Hardcoded DB credentials in config files
- Large controller classes (especially payroll modules)
- Dynamic SQL fragments built from request/session values
- Web-exposed database maintenance endpoints (`System_database`)

