# SMB Payroll — Admin Guide

## User Management

### Creating Users
Navigate to System > Users to manage user accounts.

1. Click "Add User"
2. Enter email, username, display name
3. Assign the user to one or more companies
4. Configure permissions (see RBAC Configuration)
5. The user will receive login credentials

### User Status
- **Active**: User can log in and access the system
- **Inactive**: User cannot log in (but data is preserved)
- Users can be bulk imported from CSV

### Assigning Companies
Multi-company users can be assigned to multiple companies. Each user has a primary company, which is selected on login.

### Bulk User Operations
- Bulk activate/deactivate users
- Bulk assign companies
- CSV user import

## Permission Management

Navigate to a user record and click the shield icon to open the restrictions matrix.

The matrix shows:
- **Departments** (Payroll, Employees, Lists, Reports, System)
- **Sections** within each department
- **Actions** (View, Add, Edit, Delete) per section

Toggle permissions on/off for each department/section/action combination.

See the [RBAC Configuration Guide](./rbac-configuration.md) for complete details.

## Company Management

### Creating Companies
Navigate to System > Companies:
1. Click "Add Company"
2. Enter company details (name, address, TIN)
3. Configure payroll periods
4. Set default workdays per month
5. Configure print settings

### Company Settings
Each company has:
- **Payroll Period Configuration**: Monthly, semi-monthly, bi-weekly, or weekly with cutoff days
- **Column Groups**: Which payroll processing columns to show (DTR, Salaries, Earnings, Benefits, Deductions)
- **Print Settings**: Logo, header text, footer text, custom print CSS
- **Workday Configuration**: Default number of workdays per month

### Soft Delete
Companies are soft-deleted (marked as inactive) to preserve data integrity. Deleted companies can be restored from the Trash page.

## System Administration

### Calendar Management
Manage the system-wide calendar:
- Add/edit/delete holidays (regular and special)
- Configure special workdays
- Set recurring holiday patterns
- Export calendar data

### Terms Management
Define payroll terms (cutoff periods):
- Types: Monthly, Semi-monthly, Bi-weekly, Weekly
- Configure cutoff dates and days per period
- Link terms to payroll runs for automatic period assignment

### Database Management
Navigate to System > Database:
- **Backup**: Create on-demand Firestore backups
- **Verify**: Run database verification to check data integrity
- **Cleanup**: Remove orphaned records and old data

### Audit Log
Navigate to System > Audit Log to view all system activity:
- Filter by module, user, action type, date range
- View before/after values for edits
- Export audit log to CSV

### System Settings
Global system configuration:
- Session timeout duration
- Password policy (minimum length, complexity)
- Two-factor authentication enforcement
- IP restriction configuration
- Security headers

### Health Check
Navigate to System > Health Check to view:
- Firebase connection status
- Firestore read/write latency
- Authentication service status
- Storage service status
- Overall system health score

### Trash
View and restore soft-deleted entities (companies, employees, etc.).

### User Activity Monitor
View real-time user sessions and activity.

## Email Notifications

The system supports email notifications for:
- Approval requests and responses
- Payroll publishing
- Leave applications and decisions
- Password reset
- Welcome emails for new users
- Deadline reminders

Configure email templates and SMTP settings per company.

## Two-Factor Authentication

Users can enable 2FA:
1. Go to Settings
2. Enable Two-Factor Authentication
3. Scan the QR code with an authenticator app (e.g., Google Authenticator)
4. Enter the verification code to confirm
5. Backup codes are provided for account recovery

## IP Restrictions

Restrict system access by IP address:
- **Whitelist mode**: Only allowlisted IPs can access
- **Blacklist mode**: Block specific IPs
- Supports CIDR notation (e.g., 192.168.1.0/24)

## Session Management

- Sessions expire after 30 minutes of inactivity
- A 1-minute warning is shown before automatic logout
- Users can manually log out from the profile dropdown
- Admin can force log out users (future feature)

## Backup & Recovery

### Creating Backups
1. Navigate to System > Database
2. Click "Create Backup"
3. Monitor backup progress

The system backs up: companies, employees, payroll data, user accounts, system configuration.

### Automated Backups
Configure automated backups via Firebase Console or CLI:
```bash
firebase firestore:backups create
```

### Restore
Backups can be restored through the Firebase Console. See the Deployment Guide for detailed instructions.

## Monitoring

### Sentry Error Tracking
The system uses Sentry for error monitoring:
- Automatic capture of unhandled exceptions
- Performance tracing
- Session replays for debugging

### Firebase Console
Monitor usage, performance, and errors through the Firebase Console:
- Firestore usage and query performance
- Authentication metrics
- Hosting analytics

## Security

### Firestore Security Rules
Access control is enforced at the database level:
- All reads require authentication
- All writes require proper permissions
- Soft-delete support for data safety
- Audit logging for all critical actions

### Security Headers
The production deployment includes:
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options: nosniff
- Referrer-Policy
- Permissions-Policy

### Data Encryption
Sensitive fields (SSS, TIN, PhilHealth, HDMF, bank accounts) are encrypted at rest using AES-GCM via the Web Crypto API.
