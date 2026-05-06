# Database Documentation

## 1. Purpose

Document the relational data model, major tables, and relationships used by the payroll system, including an ERD-ready structure.

## 2. Database Overview

- **Engine:** MySQL/MariaDB
- **Primary Schema Source:** `application/models/create_table_dump.sql`
- **Model Mapping Pattern:** table-per-model in `application/models/*_model.php`
- **Multi-Tenancy Model:** logical tenant separation by `company_id` in business tables

## 3. Entity Domains

## 3.1 Identity and Access

- `user_accounts`
- `user_accounts_restrictions`
- `user_accounts_companies`
- `user_accounts_options`
- `account_sessions`

Purpose: authentication, authorization matrix, user settings, company assignment, active sessions.

## 3.2 Company and System Configuration

- `companies_list`
- `companies_options`
- `companies_period`
- `terms_list`
- `calendar`
- `system_audit`

Purpose: company profile, payroll periods, option flags, terminology dictionaries, audit logs.

## 3.3 Person and Employee Master

- `names_list`
- `names_info`
- `names_meta`
- `employees`
- `employees_contacts`
- `employees_groups`
- `employees_positions`
- `employees_areas`

Purpose: normalize identity data (`names_*`) from employment assignment (`employees`).

## 3.4 Attendance, Leave, and Time

- `employees_attendance`
- `employees_absences`
- `employees_overtime`
- `employees_leave_benefits`
- `employees_timesheets`

Purpose: daily activity and leave usage driving payroll adjustments.

## 3.5 Compensation Catalog and Employee Compensation

- Catalog tables:
  - `earnings_list`
  - `deductions_list`
  - `benefits_list`
- Employee compensation tables:
  - `employees_salaries`
  - `employees_earnings`
  - `employees_deductions`
  - `employees_benefits`
  - `employees_earnings_templates`
  - `employees_deductions_templates`
  - `employees_benefits_templates`

Purpose: define compensation components and employee-level entries used in payroll generation.

## 3.6 Payroll Runtime

- `payroll`
- `payroll_inclusive_dates`
- `payroll_groups`
- `payroll_employees`
- `payroll_supplemental` group:
  - `payroll_earnings`
  - `payroll_deductions`
  - `payroll_benefits`
  - `payroll_employees_salaries`
  - `payroll_employees_earnings`
  - `payroll_employees_deductions`
  - `payroll_employees_benefits`
- `payroll_meta`
- `payroll_print_columns`

Purpose: instantiated payroll run data and computed entries.

## 3.7 Payroll Templates

- `payroll_templates`
- `payroll_templates_groups`
- `payroll_templates_employees`
- `payroll_templates_earnings`
- `payroll_templates_deductions`
- `payroll_templates_benefits`
- `payroll_templates_columns`

Purpose: reusable blueprint for payroll run setup and generation.

## 4. Key Relationships (Conceptual)

- `user_accounts (1) -> (M) user_accounts_restrictions`
- `user_accounts (1) -> (M) user_accounts_companies`
- `companies_list (1) -> (M) employees`
- `companies_list (1) -> (M) payroll`
- `companies_list (1) -> (M) companies_options`
- `companies_list (1) -> (M) companies_period`
- `names_list (1) -> (1) names_info`
- `names_list (1) -> (M) names_meta`
- `names_list (1) -> (M) employees` (through `employees.name_id`)
- `employees (1) -> (M) employees_salaries/earnings/deductions/benefits`
- `payroll (1) -> (M) payroll_inclusive_dates`
- `payroll (1) -> (M) payroll_groups`
- `payroll (1) -> (M) payroll_employees`
- `payroll_employees (1) -> (M) payroll_employees_salaries/earnings/deductions/benefits`
- `payroll_templates (1) -> (M) payroll_templates_*`

## 5. ERD (Textual Model)

Use this section as source for ERD generation tools:

- **UserAccess**
  - user_accounts
  - user_accounts_restrictions
  - user_accounts_companies
  - user_accounts_options
  - account_sessions
- **CompanyConfig**
  - companies_list
  - companies_options
  - companies_period
  - terms_list
  - calendar
- **PeopleEmployment**
  - names_list
  - names_info
  - names_meta
  - employees
  - employees_contacts
  - employees_groups
  - employees_positions
  - employees_areas
- **TimeLeave**
  - employees_attendance
  - employees_absences
  - employees_overtime
  - employees_leave_benefits
  - employees_timesheets
- **Compensation**
  - earnings_list
  - deductions_list
  - benefits_list
  - employees_salaries
  - employees_earnings
  - employees_deductions
  - employees_benefits
- **PayrollTemplate**
  - payroll_templates
  - payroll_templates_groups
  - payroll_templates_employees
  - payroll_templates_earnings
  - payroll_templates_deductions
  - payroll_templates_benefits
  - payroll_templates_columns
- **PayrollRuntime**
  - payroll
  - payroll_inclusive_dates
  - payroll_groups
  - payroll_employees
  - payroll_earnings
  - payroll_deductions
  - payroll_benefits
  - payroll_employees_salaries
  - payroll_employees_earnings
  - payroll_employees_deductions
  - payroll_employees_benefits
  - payroll_meta
  - payroll_print_columns

## 6. Data Integrity Notes

- Soft delete flags (`trash`, `active`) are used in multiple domains.
- Application logic enforces many relationships even where DB-level FK constraints may be minimal.
- Payroll generation depends on consistency among:
  - employee compensation entries
  - inclusive dates
  - template mappings

## 7. Indexing and Performance Considerations

Recommend validating indexes on:
- `company_id`
- `name_id`
- `payroll_id`
- `template_id`
- date fields used in range filters (`inclusive_date`, `date_absent`, `date_present`, `date_overtime`)

## 8. Suggested Data Governance Improvements

1. Add explicit foreign keys where safe and feasible.
2. Enforce uniqueness constraints for key combinations (e.g. payroll+employee component rows).
3. Standardize soft-delete patterns across tables.
4. Add migration-managed schema versioning.

