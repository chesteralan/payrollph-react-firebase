# SMB Payroll — Onboarding Guide

This guide walks new users through their first experience with SMB Payroll, from account setup to running their first payroll.

## For Administrators

### Step 1: Initial Setup

When you first access the application, you'll see the Setup page:

1. **Create Admin Account**: Enter your email, password, and display name
2. **Name Your Company**: Enter your company name
3. **Complete**: The system creates your account with full administrator permissions

After setup, you can log in with your new credentials.

### Step 2: Configure Your Company

Navigate to **System > Company Settings**:

1. **Set Payroll Period**: Monthly, semi-monthly, bi-weekly, or weekly
2. **Configure Cutoffs**: Set cutoff dates for semi-monthly payroll
3. **Default Workdays**: Set the standard working days per month (e.g., 22)
4. **Print Settings**: Upload your company logo, set header/footer text
5. **Currency**: Set your default currency (PHP, USD, etc.)

### Step 3: Configure System Calendar

Navigate to **System > Calendar**:

1. Add holidays for the current year (regular and special non-working)
2. Mark special workdays (weekends that are working days)
3. Set up recurring holidays (e.g., New Year, Christmas)
4. Mark holidays as paid or unpaid

### Step 4: Set Up Payroll Terms

Navigate to **System > Terms**:

1. Create a term (e.g., "Monthly Regular" or "1st Cutoff")
2. Set the term type (monthly, semi-monthly, etc.)
3. Configure cutoff days and days per period

### Step 5: Create User Accounts

Navigate to **System > Users**:

1. Add users with their email, username, and display name
2. Assign users to your company
3. Configure permissions (see [RBAC Configuration Guide](./rbac-configuration.md))
4. Users can now log in with their credentials

### Step 6: Define Organizational Structure

Navigate to **Employees**:

1. **Groups**: Create departments/teams (e.g., Operations, Sales, HR)
2. **Positions**: Create job titles (e.g., Staff, Supervisor, Manager)
3. **Areas**: Create locations (e.g., Main Office, Branch 1)
4. **Statuses**: Configure employment statuses (Active, Probationary, Terminated)

### Step 7: Add Employees

1. **Via Names List** (Lists > Names):
   - Add individual employee names
   - Or import via CSV (see Step 8)

2. **Via Employee Registry** (Employees > Employee Registry):
   - Click "Add Employee"
   - Select the name from the Names list
   - Assign employee code, group, position, area, status
   - Set hire date

3. **Complete Profile**:
   - **Personal Info**: Add government IDs (SSS, TIN, PhilHealth, HDMF), bank details
   - **Contact**: Add phone, email, address
   - **Compensation**: Set salary and configure earnings/deductions/benefits

### Step 8: Import Employees via CSV (Optional)

1. Export a sample CSV from Lists > Names
2. Prepare your data (supported: comma-separated, tab-separated, LastFirst format)
3. Click "Import CSV" and select your file
4. Preview and validate the data
5. Confirm the import
6. Duplicate detection prevents duplicate entries

### Step 9: Configure Compensation Lists

Navigate to **Lists**:

1. **Earnings**: Add earning items (Basic Pay, Overtime Pay, Allowance, Commission, etc.)
2. **Deductions**: Add deduction items (Tax, SSS, PhilHealth, HDMF, Loans, etc.)
3. **Benefits**: Add benefit items with EE/ER share (SSS ER, PhilHealth ER, Leave credits, etc.)

### Step 10: Create a Payroll Template

Navigate to **Payroll > Templates**:

1. Click "New Template"
2. Name it (e.g., "Monthly Regular Payroll")
3. Select groups to include
4. Choose earnings, deductions, and benefits columns
5. Configure print columns
6. Save the template

## For Payroll Processors

### Running Your First Payroll

1. **Create Payroll Run**: Payroll > New Payroll
   - Name: "January 2025 Payroll"
   - Select template (if created)
   - Set inclusive dates (e.g., Jan 1–31, 2025)
   - Select groups
   - Review employees
   - Create

2. **Enter DTR Data** (if applicable):
   - Go to the DTR tab in the payroll detail
   - Enter days worked, absences, late hours, overtime per employee
   - Bulk edit if needed

3. **Review Salaries**:
   - Go to the Salaries tab
   - Verify basic salary, rate per day, and computed amounts

4. **Review Earnings**:
   - Go to the Earnings tab
   - Verify earning amounts
   - Edit cells directly for manual adjustments

5. **Review Benefits**:
   - Go to the Benefits tab
   - Verify EE and ER shares

6. **Review Deductions**:
   - Go to the Deductions tab
   - Verify deduction amounts

7. **Check Summary**:
   - Go to the Summary tab
   - Review gross pay, total deductions, and net pay for each employee
   - Verify totals at the bottom

8. **Lock the Payroll**: Once everything is verified, lock it to prevent changes

9. **Publish**: Publish the payroll for output generation

### Generating Outputs

After publishing:

1. **Payroll Register**: Consolidated table with all columns
2. **Payslips**: Individual employee payslips (select from grid)
3. **Bank Transmittal**: Net pay list for bank processing
4. **Journal Entry**: Accounting entries
5. **Cash Denomination**: Payout preparation

### Exporting

- **XLS**: Formatted Excel with borders and headers (best for reporting)
- **CSV**: Raw data for external processing
- **Print**: Print-optimized view with company letterhead

## For Regular Users

### Daily Tasks

- **View dashboard** for upcoming deadlines and recent activity
- **Check DTR** to ensure your time records are accurate
- **Apply for leave** if needed
- **View payslips** after payroll is published

### Viewing Payslips

1. From the Dashboard, find the published payroll
2. Click on the payroll
3. Go to the Output views
4. Select "Payslips"
5. Choose your name from the employee grid
6. View/download/print your payslip

### Changing Your Password

1. Click your profile icon in the top-right corner
2. Select "Change Password"
3. Enter current password, new password, and confirm
4. Click "Change Password"

### Setting Preferences

1. Click your profile icon > Settings
2. Choose your theme (Light/Dark)
3. Set items per page preference
4. Select default currency
5. Choose language/locale
6. Select default company (if multi-company)
7. Click "Save Settings"

## Next Steps

- **Explore Reports**: Navigate to Reports to run 13th Month, Payroll Summary, and other reports
- **Schedule Reports**: Set up recurring report delivery
- **Review Audit Log**: Administrators should periodically review the Audit Log
- **Configure Two-Factor Authentication**: Enable 2FA for enhanced security (Settings > 2FA)
