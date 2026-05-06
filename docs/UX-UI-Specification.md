# UX/UI Specification

## 1. Objective

Define how the payroll platform should look and behave so users can complete payroll workflows with minimal error, low cognitive load, and fast completion time.

## 2. Design Principles

- **Workflow first:** prioritize payroll lifecycle tasks over visual complexity.
- **Consistency:** same patterns for list/filter/edit/save across all modules.
- **Safety:** high-risk actions (generate, lock, delete) require confirmation and clear status.
- **Context persistence:** always show current company, payroll, and selected filters.
- **Progressive disclosure:** advanced settings hidden until needed.

## 3. Target Users

- Payroll Officer
- HR/Admin Staff
- System Administrator
- Management reviewer (read-only/report consumer)

## 4. Information Architecture

- **Global Navigation**
  - Dashboard
  - Employees
  - Lists
  - Payroll
  - Reports
  - System (restricted)
- **Context Bar**
  - Current company
  - Current payroll
  - Active period/filter
  - Logged-in user
- **Local Module Tabs**
  - Example payroll: Config -> Inclusive Dates -> Employees -> DTR -> Salaries -> Earnings -> Benefits -> Deductions -> Summary -> Output

## 5. UX Requirements by Module

## 5.1 Authentication & Session

- Login form with clear validation and error copy.
- Optional "remember last company" behavior after successful login.
- Session timeout warning modal before forced logout.

## 5.2 Dashboard

- Show quick cards:
  - upcoming/active payroll runs
  - birthdays/work anniversaries
  - pending payroll actions
- Provide one-click deep links to continue last payroll run.

## 5.3 Employee Management

- Search bar always visible.
- Filter chips for group/position/area/status/trash.
- Employee profile split into clear sections:
  - personal
  - employment
  - contacts
  - IDs
  - emergency
  - compensation
- Sticky save bar on long forms.

## 5.4 Payroll Creation & Configuration

- Wizard-like flow:
  1. select template + period
  2. set inclusive dates
  3. assign groups/employees
  4. generate
- Display generation prerequisites with check indicators.
- Disable generate button until prerequisites are met.

## 5.5 Payroll Processing Screens

- Column-heavy tables should support:
  - horizontal scroll with sticky name column
  - totals row pinned at bottom
  - inline edits with clear "unsaved changes" indicator
- Per-employee quick action menu for status/group/payslip/print group.

## 5.6 Payroll Output

- Output selector with preview:
  - summary
  - payslip variants
  - transmittal
  - journal
  - denomination
  - XLS download
- Print CSS preview pane and reset-to-default action.

## 5.7 System Administration

- Restriction matrix UI with bulk grant/revoke actions.
- Confirmation and warning banners for destructive operations.
- Database tools marked as "Advanced / Admin Only".

## 6. Visual Design Specification

- **Base style:** Bootstrap-compatible, themeable.
- **Typography:** clean sans-serif, 14-16px body text.
- **Color semantics:**
  - success = green
  - warning = amber
  - danger = red
  - info = blue
- **Density options:** compact table mode for payroll pages.
- **Dark mode:** optional future enhancement; not required for current release.

## 7. Interaction & Behavior Standards

- All forms:
  - client-side required markers
  - server-side validation messages mapped to fields
- All saves:
  - toast confirmation + inline status near action source
- All async actions:
  - loading indicator + disabled controls while pending
- All long pages:
  - sticky page actions (Save / Cancel / Back)

## 8. Accessibility Requirements

- Keyboard reachable controls and modal navigation.
- Labels bound to form inputs.
- Minimum contrast ratio for status text and alerts.
- Avoid color-only meaning; include icon/text labels.

## 9. Responsive Behavior

- Desktop-first for payroll operations.
- Tablet support for review/approvals.
- Mobile support for basic views (dashboard, quick lookup), not full payroll editing.

## 10. Error and Empty State Guidelines

- Empty state must include:
  - what is empty
  - why it might be empty
  - primary call-to-action
- Error states should include:
  - plain-language issue
  - suggested recovery step
  - reference code for support logs

## 11. UX Metrics (Success Criteria)

- Payroll run setup completion time reduced by 30%.
- Fewer correction edits after generation.
- Faster employee lookup and update time.
- Lower support tickets related to navigation confusion.

## 12. Deliverables

- Page wireframes (low fidelity)
- Clickable prototype for payroll lifecycle
- UI component guide
- Final annotated handoff screens
