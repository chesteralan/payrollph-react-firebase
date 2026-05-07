# SMB Payroll — User Guide

## Overview

SMB Payroll is a web-based payroll management system for small-to-medium businesses. It handles employee management, time tracking, payroll computation, government remittance reporting, and payslip generation.

## Getting Started

### Login
1. Navigate to your company's payroll URL
2. Enter your email and password
3. Optionally check "Remember me" to stay logged in across sessions
4. Click "Sign In"

### First-time Setup
If you are the first administrator, you will be redirected to the Setup page where you will:
1. Create your admin account (email, password, display name)
2. Name your company
3. The system will auto-configure default permissions and company settings

### Password Management
- **Change password**: Go to Settings > Change Password (or click your profile dropdown > Change Password)
- **Forgot password**: Click "Forgot Password" on the login page and follow the email reset link

## Dashboard

The dashboard shows:
- **Payroll statistics cards**: Total payroll runs, active employees, pending approvals
- **Recent payroll activity**: A timeline of recent payroll actions
- **Employee statistics**: Active employee count, new hires
- **Upcoming payroll reminders**: Based on configured payroll periods
- **Quick actions**: Shortcuts to common tasks (New Payroll, Add Employee)

## Employees

### Employee Registry
Navigate to Employees > Employee Registry to view, add, edit, and deactivate employees.

**Each employee has:**
- Employee Code (unique identifier)
- Name (linked to the Names list)
- Group, Position, Area assignments
- Status (Active/Inactive/Terminated)
- Hire date and regularization date

### Employee Profile
Click an employee to open their profile with tabs:
- **Personal Info**: Government IDs (SSS, TIN, PhilHealth, HDMF), bank details, demographics
- **Contact**: Phone numbers, email addresses, physical address
- **Compensation**: Salary history and current rate
- **DTR History**: Daily time record history

### Employee Groups / Positions / Areas
Manage organizational structure:
- **Groups**: Departmental or team groupings (e.g., "Operations", "Sales")
- **Positions**: Job titles (e.g., "Staff", "Supervisor", "Manager")
- **Areas**: Physical or regional locations

### Employee Statuses
Define custom statuses (Active, On Leave, Terminated, etc.) used across the system.

## Names List & CSV Import

### Names Management
Navigate to Lists > Names to manage the master list of employee names.
- Add individual names (First, Middle, Last, Suffix)
- Edit existing names
- Delete unused names

### CSV Import
Import names in bulk:
1. Click "Import CSV"
2. Choose a file (comma-separated, tab-separated, or LastFirst format)
3. Preview and validate the data
4. Review import statistics (rows added, skipped, errors)
5. Confirm the import

### Bulk Edit
Select multiple names to edit in bulk, or use the inline edit feature.

### Export
Export the names list to CSV for external use.

## Payroll Lists

### Earnings
Define earnings types:
- **Fixed**: Set amount per payroll (e.g., transportation allowance)
- **Percentage**: Calculated as percentage of basic salary
- **Per Hour/Per Day**: Based on hours worked or days present
- **Custom**: Formula-based calculation
Each earning can be marked as taxable or non-taxable.

### Benefits
Define benefit items with:
- **Employee share**: How much the employee contributes (fixed amount or percentage)
- **Employer share**: How much the company contributes
- **Allocation rules**: How benefits are distributed

### Deductions
Define deduction items:
- **Fixed**: Set amount (e.g., uniform deduction)
- **Percentage**: Percentage of salary or earnings

## Payroll Templates

Templates define the structure of a payroll run before creation.

### Creating a Template
1. Navigate to Payroll > Templates
2. Click "New Template"
3. Configure:
   - **General**: Name, description, print format
   - **Groups**: Select which employee groups, areas, or positions to include
   - **Employees**: Refine employee selection
   - **Columns**: Choose earnings, benefits, and deductions to include
   - **Print Columns**: Configure visible columns in output views

### Cloning Templates
Existing templates can be cloned to create variations without starting from scratch.

### Print Format Templates
Define reusable print format settings (paper size, orientation, header/footer, column layout).

## Payroll Runs

### Creating a Payroll Run
Navigate to Payroll > Payroll Runs and click "New Payroll" (or use the quick action in the sidebar).

The 5-step wizard:

1. **Configuration**: Name, print format, and grouping option
2. **Inclusive Dates**: Set the date range this payroll covers
3. **Group Selection**: Choose groups, areas, or positions
4. **Employee Selection**: Review and refine which employees are included
5. **Review and Create**: Confirm all settings and create the payroll

### Processing a Payroll

Open a payroll run to access the tabbed processing stages:

1. **DTR Stage**: Enter days worked, absences, late hours, and overtime for each employee
2. **Salaries Stage**: Review basic salary, rate per day, and computed amount
3. **Earnings Stage**: Matrix view with earnings columns and row totals
4. **Benefits Stage**: EE (employee) and ER (employer) share columns
5. **Deductions Stage**: Matrix view with deduction columns and row totals
6. **Summary Stage**: Consolidated view with auto-calculations (gross pay, total deductions, net pay)

### Editing Data
- Click any editable cell to modify values inline
- Changes are saved individually or you can use batch save
- The Summary stage auto-calculates from DTR through Deductions

### Status Workflow
- **Draft**: Editable, not finalized
- **Locked**: Data is frozen, no further edits allowed
- **Published**: Finalized for reporting and payslip generation

### Operations
- **Clone**: Create a copy of an existing payroll run
- **Lock**: Prevent further edits
- **Unlock**: Re-open a locked payroll (if permissions allow)
- **Publish**: Finalize the payroll
- **Delete**: Remove a draft payroll

## Payroll Output Views

From a published payroll, access these views:

### Payroll Register
A consolidated table with all employees, earnings, deductions, and totals.

### Payslips
Individual employee payslips. Select an employee from the grid to view their detailed breakdown.

### Bank Transmittal
List of employees with net pay amounts for bank processing.

### Journal Entry
Accounting summary with debit/credit entries.

### Cash Denomination
Payout preparation view showing how much of each denomination is needed.

### Export Options
- **XLS**: Formatted Excel export with borders and headers
- **CSV**: Raw data export
- **Print**: Print-optimized views with company header/footer

## DTR (Daily Time Record)

### Calendar View
Navigate to DTR to see a calendar-based view of employee attendance.

### Attendance Tracking
Record time-in and time-out for each employee per day.

### Absence Recording
Mark absences by type (Absent, Late, Undertime) with optional reasons.

### Overtime
Record overtime hours with approval status.

### Leave Management
- **Leave Balances**: Track yearly allowance and used/remaining days per leave type
- **Leave Applications**: Employees can apply; supervisors can approve/reject
- **Validation**: System validates against yearly allowance

### Import/Export
Bulk import DTR data or export for external reporting.

### DTR Summary Reports
Summarized view of attendance patterns over a period.

## Reports

### 13th Month Report
Year-based report showing the 13th month pay computation per employee with summary totals and XLS export.

### Payroll Summary
Consolidated summary of payroll runs with totals by earnings, deductions, and benefits.

### Employee Master List
Complete employee registry with all details.

### Earnings/Deductions Breakdown
Detailed analysis of earnings and deductions across the organization.

### Attendance Report
DTR-based attendance analysis.

### Benefits Utilization Report
View how benefits are being used across employees.

### Year-End Report
Annual summaries for tax and reporting purposes.

### Custom Report Builder
Create ad-hoc reports by selecting fields, filters, and grouping options.

### Report Scheduling
Schedule recurring reports (daily, weekly, monthly, quarterly) with automatic email delivery.

## Calendar Management

### System Calendar
Navigate to System > Calendar to manage:
- **Holidays**: Regular and special non-working holidays
- **Special Workdays**: Days that are normally weekends but declared as working days
- **Paid/Unpaid toggle**: Mark holidays as paid or unpaid
- **Recurring patterns**: Set up annually recurring holidays

### Integration
Calendar data affects DTR and payroll calculations (working days, holiday pay).

## User Settings

Access your personal settings from the profile dropdown or navigate to Settings:

- **Theme**: Light or Dark mode
- **Items Per Page**: Pagination preference (10/25/50/100)
- **Default Currency**: PHP, USD, EUR, and more
- **Language/Locale**: Interface language preference
- **Default Company**: For multi-company users, select your primary company
- **Change Password**: Update your login password
