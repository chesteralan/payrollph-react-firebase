# Payroll v2 - User Guide

## Introduction

Payroll v2 is a comprehensive payroll management system built with React and Firebase. It supports multi-company payroll processing, employee management, and detailed reporting.

## Getting Started

### First-Time Setup

1. Navigate to the application URL
2. Click **Setup** when prompted
3. Enter your company details:
   - Company Name
   - Address
   - TIN (Tax Identification Number)
   - Default workdays per month
4. Create the admin account:
   - Email address
   - Password (min 8 characters)
   - Display name
5. Login with your new credentials

### Logging In

1. Go to the login page
2. Enter your email and password
3. Click **Login**
4. If your account has access to multiple companies, select the company from the dropdown in the header

## Dashboard

The dashboard provides an overview of your payroll system:

- **Payroll Statistics**: View total payrolls, active employees, and current month's payroll
- **Recent Activity**: See the latest payroll runs and their status
- **Employee Statistics**: Quick view of employee counts by status
- **Upcoming Reminders**: Payroll deadlines and important dates
- **Quick Actions**: Fast access to common tasks

## Employee Management

### Employee List

Navigate to **Employees** in the sidebar to:
- View all employees with search and filtering
- Add new employees
- Edit employee details
- Change employee status (Active/Inactive/Terminated)

### Employee Profile

Click on an employee to view their profile with tabs:

#### Personal Info
- Government IDs (SSS, TIN, PhilHealth, HDMF)
- Bank account details
- Demographics (date of birth, gender, civil status)
- Biometric data (if configured)

#### Contact
- Phone numbers
- Email addresses
- Physical addresses

#### Compensation
- Salary configuration
- Pay rate settings
- Benefits eligibility

#### DTR History
- Daily Time Record entries
- Attendance history
- Leave balances

### Employee Groups

Organize employees into groups:
1. Go to **Employees > Groups**
2. Create groups (e.g., "Regular", "Contractual", "Probationary")
3. Assign employees to groups

### Positions & Areas

- **Positions**: Define job titles and departments
- **Areas**: Define work locations or departments

## Payroll Processing

### Creating a Payroll

1. Click **New Payroll** in the sidebar or dashboard
2. Follow the 5-step wizard:

#### Step 1: Configuration
- Payroll name (e.g., "May 2026 - Regular")
- Print format template
- Grouping option (by Group, Position, or Area)

#### Step 2: Inclusive Dates
- Select the payroll period
- Mark holidays and special days
- Configure paid/unpaid days

#### Step 3: Group Selection
- Choose which employee groups to include
- Filter by position or area

#### Step 4: Employee Selection
- Select specific employees
- Review employee list

#### Step 5: Review & Create
- Verify all settings
- Create the payroll

### Processing Payroll

After creating a payroll, process it through these stages:

#### DTR Stage
- Review days worked
- Mark absences
- Record late arrivals
- Add overtime hours

#### Salaries Stage
- Verify basic salary
- Check rate per day calculations
- Confirm salary amounts

#### Earnings Stage
- Add earnings (allowances, bonuses)
- Configure formulas
- Set EE/ER shares

#### Benefits Stage
- Review employee benefits
- Adjust EE/ER contributions
- Validate benefit calculations

#### Deductions Stage
- Add deductions (loans, advances)
- Set fixed amounts or percentages
- Configure max amounts

#### Summary Stage
- View consolidated totals
- Check net pay calculations
- Verify all entries

### Actions

- **Save**: Save current progress
- **Lock**: Prevent further edits
- **Unlock**: Allow edits again
- **Publish**: Finalize and make payslips available
- **Clone**: Copy payroll for next period

## Output Views

### Payroll Register
- Consolidated table with all employees
- Column totals and summaries
- Export to Excel or CSV

### Payslip View
- Individual employee payslips
- Grid view for selection
- Detailed breakdown

### Bank Transmittal
- List of employee net pay
- Bank transfer preparation
- Export for bank upload

### Journal Entry
- Accounting summary
- Debit/Credit entries
- Export for accounting systems

### Cash Denomination
- Payout preparation
- Bill breakdown required
- Cash counting sheet

## Reports

### 13th Month Report
- Year-based calculation
- Employee-level breakdown
- Export to Excel

### Employee Report
- Master list with details
- Filter by status, group, position
- Export options

### Payroll Summary
- Summary by payroll period
- Comparison across periods

### Earnings/Deductions Breakdown
- Detailed view of each category
- Employee-level details

### Attendance/DTR Reports
- Attendance summaries
- Late and overtime reports
- Leave utilization

### Benefits Utilization
- Benefit plan usage
- EE/ER contribution summaries

## Calendar Management

### System Calendar
- Year-based view
- Mark holidays (Regular/Special)
- Configure special workdays
- Toggle paid/unpaid status
- Export calendar data

## Settings

### User Settings
- Theme (Light/Dark)
- Items per page
- Default company

### Company Settings
- Print header/footer
- Logo upload
- CSS customization
- Column group settings

## Notifications

- In-app notifications appear in the bell icon
- Approval workflows notify relevant users
- Deadline reminders help you stay on track
- System alerts show important information

## Tips & Tricks

1. **Keyboard Shortcuts**: Press `?` to see available shortcuts
2. **Bulk Operations**: Use checkboxes to perform actions on multiple items
3. **Search Everywhere**: Use the global search (Ctrl+K) to find anything
4. **Export Often**: Regular exports provide backups of your data
5. **Check Audit Log**: Review the audit log in System > Audit Log to track all changes

## FAQ

**Q: How do I reset my password?**
A: Click "Forgot Password" on the login page and follow the email instructions.

**Q: Can I have multiple companies?**
A: Yes! Admins can create multiple companies and switch between them using the company selector in the header.

**Q: How do I setup 2FA?**
A: Go to your profile settings and follow the Two-Factor Authentication setup.

**Q: Can I import employee data?**
A: Yes! Go to Names List and use the CSV import feature.

**Q: How do I schedule reports?**
A: Go to Reports > Custom Report Builder and set up scheduling with email delivery.

## Support

For additional support:
- Check the in-app help tooltips
- Review the audit log for troubleshooting
- Contact your system administrator
