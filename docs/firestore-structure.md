# Firestore Database Structure

## Overview

This document describes the Firestore database schema used by SMB Payroll. The database uses Firebase Firestore with collections, subcollections, and security rules enforcing RBAC at the document level.

## Collection Map

### User & Access Management

| Collection | Document Fields | Description |
|---|---|---|
| `user_accounts` | `id, email, username, displayName, avatarUrl?, isActive, createdAt, updatedAt` | Registered user accounts |
| `user_restrictions` | `id, userId, department, section, canView, canAdd, canEdit, canDelete` | Per-user RBAC permissions |
| `user_companies` | `id, userId, companyId, isPrimary` | User-to-company assignments |
| `user_settings` | `id, userId, theme, itemsPerPage, defaultCompanyId?, locale?` | User preferences |
| `ip_restrictions` | `id, companyId, type(whitelist\|blacklist), ipAddress, subnet?, description?, isActive, createdAt, createdBy, expiresAt?` | IP access control |
| `ip_access_logs` | `id, userId, ipAddress, userAgent, timestamp, allowed, reason?, path` | IP access attempt log |

### Company & Configuration

| Collection | Document Fields | Description |
|---|---|---|
| `companies` | `id, name, address?, tin?, isActive, isDeleted?, deletedAt?, printHeader?, printFooter?, printCss?, defaultWorkdays?, currency?, payrollPeriods?, createdAt, updatedAt` | Company records |
| `company_periods` | `id, companyId, type, payDay` | Payroll period configuration |
| `company_options` | `id, companyId, columnGroup{dtr,salaries,earnings,benefits,deductions}, workDays[], printGroup?, payslipTemplate?` | Company feature flags and options |

### Employee Data

| Collection | Document Fields | Description |
|---|---|---|
| `names` | `id, firstName, middleName?, lastName, suffix?, createdAt, updatedAt` | Master name registry |
| `employees` | `id, nameId, companyId, groupId?, positionId?, areaId?, statusId, employeeCode, isActive, hireDate?, regularizationDate?, createdAt, updatedAt` | Employee records |
| `employee_contacts` | `id, employeeId, type(phone\|email\|address), value, isPrimary` | Contact details |
| `employee_profiles` | `id, nameId, sss?, tin?, philhealth?, hdmf?, bankName?, bankAccount?, dateOfBirth?, gender?, civilStatus?` | Government IDs and PII |
| `employee_documents` | `id, employeeId, fileName, fileType, fileSize, fileUrl, storagePath, uploadedAt, uploadedBy?, category(ID\|Contract\|Tax Form\|Medical\|Certificate\|Other), notes?` | Uploaded employee documents |
| `employee_groups` | `id, name, description?, isActive` | Department/team groupings |
| `employee_positions` | `id, name, department?, isActive` | Job titles |
| `employee_areas` | `id, name, description?, isActive` | Physical/regional locations |
| `employee_statuses` | `id, name, isActive` | Employment statuses |

### Compensation

| Collection | Document Fields | Description |
|---|---|---|
| `earnings` | `id, name, description?, isTaxable, isActive` | Earning item definitions |
| `deductions` | `id, name, description?, type(fixed\|percentage), isActive` | Deduction item definitions |
| `benefits` | `id, name, description?, isActive` | Benefit item definitions |
| `terms` | `id, name, description?, type, frequency, daysPerPeriod, isActive, cutOff1?, cutOff2?, validateOnCreate?` | Payroll term definitions |
| `employee_earnings` | `id, employeeId, earningId, amount, isPrimary, isActive, templateId?` | Per-employee earnings |
| `employee_deductions` | `id, employeeId, deductionId, amount, isActive, templateId?` | Per-employee deductions |
| `employee_benefits` | `id, employeeId, benefitId, amount, isActive, templateId?` | Per-employee benefits |
| `employee_salaries` | `id, employeeId, amount, frequency(monthly\|semi-monthly\|weekly\|daily), isPrimary, effectiveDate, isActive` | Salary history |

### Payroll

| Collection | Document Fields | Description |
|---|---|---|
| `payroll` | `id, companyId, templateId?, termId?, name, month, year, status(draft\|locked\|published), isActive, isLocked, isPublished?, publishedAt?, printFormat?, groupBy?, createdAt, updatedAt, createdBy` | Payroll run headers |
| `payroll_inclusive_dates` | `id, payrollId, date` | Covered dates |
| `payroll_groups` | `id, payrollId, groupId?, areaId?, positionId?, statusId?, order, page` | Payroll grouping assignment |
| `payroll_employees` | `id, payrollId, nameId, orderId, isActive, statusId?, groupId?, areaId?, positionId?, printGroup?, payslipTemplate?, daysWorked, absences, lateHours, overtimeHours, basicSalary, grossPay, netPay` | Per-payroll employee data |
| `payroll_earnings` | `id, payrollId, nameId, earningId, entryId, amount, notes?, isManual` | Per-payroll earnings data |
| `payroll_deductions` | `id, payrollId, nameId, deductionId, entryId, amount, maxAmount?, notes?, isManual` | Per-payroll deductions data |
| `payroll_benefits` | `id, payrollId, nameId, benefitId, entryId, employeeShare, employerShare, notes?` | Per-payroll benefits data |
| `payroll_print_columns` | `id, payrollId, termId, columnId, order` | Print column configuration |
| `payroll_meta` | `id, payrollId, key, value` | Key-value metadata |

### Templates

| Collection | Document Fields | Description |
|---|---|---|
| `payroll_templates` | `id, companyId, name, description?, pages, checkedBy?, approvedBy?, printFormat?, groupBy?, isActive, earnings[], deductions[], benefits[], printColumns[]` | Payroll template definitions |
| `payroll_template_groups` | `id, templateId, groupId?, areaId?, positionId?, statusId?, order, page` | Template group filters |
| `payroll_template_employees` | `id, templateId, nameId, order, isActive, statusId?, groupId?, areaId?, positionId?, printGroup?, payslipTemplate?` | Template employee selection |
| `printFormats` | `id, companyId?, name, description?, outputType(register\|payslip\|transmittal\|journal\|denomination), paperSize(A4\|Letter\|Legal), orientation, showHeader, showFooter, headerHtml?, footerHtml?, showCompanyLogo, showCompanyName, showCompanyAddress, showCompanyTIN, showTitle, showPeriod, showSignatureLines, signatureLabels?, columnOrder?, fontSize, includeTotals, isActive, createdAt, updatedAt` | Print format templates |

### Time & Attendance

| Collection | Document Fields | Description |
|---|---|---|
| `dtr` | `id, employeeId, date, timeIn?, timeOut?, hoursWorked, overtimeHours, lateHours, absenceType?(absent\|late\|undertime\|sick\|vacation), absenceReason?, notes?, createdAt, updatedAt` | Daily time records |
| `attendance` | `id, employeeId, date, timeIn?, timeOut?, hoursWorked` | Attendance records |
| `absences` | `id, employeeId, date, type(absent\|late\|undertime), hours, reason?` | Absence records |
| `overtime` | `id, employeeId, date, hours, rate?, reason?, approved` | Overtime records |
| `leave_benefits` | `id, employeeId, benefitId, year, totalAllowance, used, remaining` | Leave benefit balances |
| `leave_applications` | `id, employeeId, benefitId, startDate, endDate, days, reason, status(pending\|approved\|rejected), createdAt` | Leave requests |
| `leave_balances` | `id, employeeId, benefitId, year, totalAllowance, used, remaining` | Leave balance tracking |
| `timesheets` | `id, employeeId, date, hoursWorked, overtimeHours, absences, lateHours` | Timesheet entries |
| `calendar` | `id, companyId, date, type(holiday\|special\|workday), name` | Company calendar events |

### Audit & System

| Collection | Document Fields | Description |
|---|---|---|
| `system_audit` | `id, userId, userName, action, module, description, entityId?, entityType?, timestamp, metadata?` | Audit trail |
| `backups` | `id, timestamp, collections[], documentCount, sizeBytes, status, triggeredBy, backupUrl?, notes?` | Backup records |
| `notifications` | `id, recipientId, senderId?, type, priority(low\|medium\|high\|urgent), title, message, entityType?, entityId?, isRead, isArchived, actionUrl?, metadata?, createdAt, readAt?, archivedAt?` | In-app notifications |
| `approval_works` | `id, entityType, entityId, requestedBy, approvedBy?, status, currentLevel, maxLevel, approvals[], createdAt, resolvedAt?, comments?` | Approval workflows |
| `scheduled_reports` | `id, name, description?, reportType, frequency, dayOfWeek?, dayOfMonth?, time, recipients[], deliveryMethod, format, filters?, fields?, isActive, lastRun?, nextRun, createdBy, createdAt, updatedAt` | Report schedules |
| `report_runs` | `id, scheduleId, runAt, status, downloadUrl?, errorMessage?, recipientsNotified` | Report execution log |

## Key Relationships

```
UserAccount
  ├── user_restrictions (1:N)
  ├── user_companies (1:N)
  └── user_settings (1:1)

Company
  ├── employees (1:N)
  ├── payroll (1:N)
  ├── payroll_templates (1:N)
  ├── printFormats (1:N)
  └── calendar (1:N)

Employee
  ├── employee_contacts (1:N)
  ├── employee_profiles (1:1)
  ├── employee_documents (1:N)
  ├── employee_earnings (1:N)
  ├── employee_deductions (1:N)
  ├── employee_benefits (1:N)
  ├── employee_salaries (1:N)
  └── dtr (1:N)

Payroll
  ├── payroll_inclusive_dates (1:N)
  ├── payroll_groups (1:N)
  ├── payroll_employees (1:N)
  │   ├── payroll_earnings (1:N)
  │   ├── payroll_deductions (1:N)
  │   └── payroll_benefits (1:N)
  └── payroll_print_columns (1:N)

NameRecord ──> Employee (via nameId)
EmployeeGroup ──> Employee (via groupId)
EmployeePosition ──> Employee (via positionId)
EmployeeArea ──> Employee (via areaId)
```

## Security Rules Summary

- **Authentication required**: All operations
- **User must be active**: All operations
- **Company access required**: Most data reads/writes
- **Per-department/section/action RBAC**: Enforced on all collections
- **Payroll write protection**: Only editable when `status == 'draft'`
- **Audit log**: Append-only (no updates or deletes)
- **Sensitive fields**: Encrypted at application level (SSN, TIN, bank accounts)

## Composite Indexes

Required composite indexes for common queries:

| Collection | Fields |
|---|---|
| `employees` | `companyId ASC, isActive ASC, createdAt DESC` |
| `payroll` | `companyId ASC, month ASC, year ASC` |
| `payroll_employees` | `payrollId ASC, nameId ASC` |
| `system_audit` | `userId ASC, timestamp DESC` |
| `user_restrictions` | `userId ASC` |
