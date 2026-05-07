# RBAC Configuration Guide

## Overview

SMB Payroll uses a Role-Based Access Control (RBAC) system with a department/section/action permission matrix. Permissions are stored per user in the `user_restrictions` Firestore collection and enforced both in the frontend (UI visibility) and backend (Firestore security rules).

## Permission Structure

The permission system has three levels:

```
Department → Section → Action
```

### Departments

| Department | Description |
|---|---|
| `payroll` | Payroll processing and templates |
| `employees` | Employee registry, calendar, groups, positions, areas |
| `lists` | Names, benefits, earnings, deductions |
| `reports` | Reports and analytics |
| `system` | System administration, users, audit |

### Sections per Department

```
payroll:
  - payroll      (Payroll Runs)
  - templates    (Templates, Print Formats)

employees:
  - employees    (Employee Registry)
  - calendar     (Employee Calendar)
  - groups       (Employee Groups)
  - positions    (Employee Positions)
  - areas        (Employee Areas)

lists:
  - names        (Names List)
  - benefits     (Benefits List)
  - earnings     (Earnings List)
  - deductions   (Deductions List)

reports:
  - 13month      (13th Month Report)

system:
  - companies    (Companies, Company Settings, System Settings, Trash)
  - terms        (Payroll Terms)
  - calendar     (System Calendar)
  - users        (Users, Restrictions, Activity Monitor)
  - audit        (Audit Log)
  - database     (Database, Health Check)
```

### Actions

Each section has four possible actions:

| Action | Description |
|---|---|
| `View` | See the page and its data |
| `Add` | Create new records |
| `Edit` | Modify existing records |
| `Delete` | Remove records |

## Managing Permissions

### Via the UI

1. Navigate to **System > Users**
2. Find the user in the list
3. Click the shield icon on the user's row
4. The permissions matrix opens showing all departments, sections, and actions
5. Toggle each permission on (green check) or off (red X)
6. Changes save immediately

### Matrix Layout

```
┌─────────────────────────────────────────────────────┐
│                  View  │  Add  │  Edit  │  Delete    │
├─────────────────────────────────────────────────────┤
│ PAYROLL                                              │
│  ├ Payroll Runs    [✓]    [✓]    [✓]    [✓]         │
│  └ Templates       [✓]    [✓]    [✓]    [✓]         │
│ EMPLOYEES                                            │
│  ├ Employees       [✓]    [✓]    [✓]    [✓]         │
│  ├ Calendar        [✓]    [✓]    [✓]    [✓]         │
│  ├ Groups          [✓]    [✓]    [✓]    [✓]         │
│  ├ Positions       [✓]    [✓]    [✓]    [✓]         │
│  └ Areas           [✓]    [✓]    [✓]    [✓]         │
│ ...                                                  │
└─────────────────────────────────────────────────────┘
```

## Default Permission Templates

### Administrator
All departments, all sections, all actions = enabled.

### Payroll Processor
- `payroll.*` — Full access
- `employees.employees` — View
- `lists.*` — View
- `reports.*` — View
- `system.*` — No access

### Employee Manager
- `employees.*` — Full access
- `lists.names` — Full access
- `payroll.*` — No access

### View-Only User
- Specific sections — View only
- All other sections — No access

## Data Layer Enforcement

### Frontend (UI)
- The sidebar filters navigation items based on `canView()` permissions
- Buttons and actions are conditionally rendered based on `canAdd()`, `canEdit()`, `canDelete()`
- API calls check permissions before executing

### Backend (Firestore Rules)
Security rules enforce permissions at the document level:
```
hasPermission(userId, 'employees', 'employees', 'view')  // can read
hasPermission(userId, 'employees', 'employees', 'edit')   // can write
```

Rules check that the requesting user has the required permission for the specific collection being accessed.

## Audit Trail

All permission-related actions are logged to the audit log:
- `create` on `user_restrictions` (when user is created)
- `update` on `user_restrictions` (when permissions are changed)
- Access denials are logged as `permission_denied` actions

## Best Practices

1. **Principle of Least Privilege**: Grant only the permissions each role needs
2. **Regular Audits**: Review user permissions quarterly using the Audit Log
3. **Department Separation**: Keep payroll and employee management permissions separate
4. **View-Only Access**: Use view-only permissions for external auditors
5. **No Delete Access**: Consider not granting delete access to most users to prevent data loss (use deactivation instead)
