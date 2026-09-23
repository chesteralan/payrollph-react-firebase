# UI Review — SMB Payroll Application

**Audited:** 2026-09-23
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md)
**Screenshots:** Captured (desktop, tablet, mobile) at http://localhost:5174/

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Good empty states, generic CTAs need specificity |
| 2. Visuals | 3/4 | Clear hierarchy, icon-only action buttons lack labels |
| 3. Color | 3/4 | Consistent blue primary, hardcoded colors in PayslipMode |
| 4. Typography | 3/4 | 7 font sizes (slightly high), 3 weights — consistent |
| 5. Spacing | 3/4 | Standard Tailwind spacing, minor arbitrary values |
| 6. Experience Design | 4/4 | Loading, error, empty states all present |

**Overall: 19/24**

---

## Top 3 Priority Fixes

1. **Icon-only action buttons need aria-labels** — Payroll table has 4 icon buttons (view, copy, lock, delete) with no visible or accessible labels — Add `aria-label` and tooltips
2. **Hardcoded colors in PayslipMode.tsx** — Inline styles use `#e5e7eb`, `#6b7280`, `#f9fafb` — Replace with Tailwind classes for consistency
3. **Generic CTA labels** — "Cancel", "Save", "Submit" used across modals without context — Add descriptive labels like "Save Employee" or "Cancel Edit"

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Good:**
- ErrorBoundary uses clear language: "Something went wrong" with recovery instruction
- EmptyState component provides consistent empty state messaging
- Alert banner: "No Employees Added — Add employees to get started with payroll processing" is actionable
- Report pages handle empty data: "No data found for the selected filters"

**Issues:**
- **Generic CTAs:** "Cancel", "Save", "Submit" used across multiple modals (`ConfirmDialog.tsx:25`, `LeaveApplicationModal.tsx:100-102`, `DayEntryModal.tsx:167-169`)
- **Table column headers:** "ACTIONS" is generic — could be more descriptive
- **Status badge:** "draft" is lowercase — should be "Draft" for consistency

**Recommendation:** Create copy constants file for recurring CTAs; capitalize status badges

---

### Pillar 2: Visuals (3/4)

**Good:**
- Clear visual hierarchy with h1 page titles and h2 section headers
- Consistent use of lucide-react icons throughout
- Status badges use color coding (green for active, yellow/orange for draft)
- Sidebar navigation has clear active state (blue highlight)
- Dashboard stat cards use colored icon backgrounds for visual distinction

**Issues:**
- **Icon-only action buttons:** Payroll table has 4 icons (eye, copy, lock, trash) with no labels — unclear what each does without hover
- **Sidebar arrows:** Expandable menu items have arrows but no visual indication of current expansion state
- **Quick Actions card:** The "+" button is ambiguous — what action will it take?

**Recommendation:** Add tooltips/aria-labels to icon buttons; indicate sidebar expansion state

---

### Pillar 3: Color (3/4)

**Good:**
- Consistent blue primary color (#2563EB equivalent) used for CTAs, active states, links
- Dark navy sidebar (#1E293B) provides good contrast with white text
- Status colors: green for active/companies, purple for payroll, blue for employees
- Alert banner uses light blue background with blue text — accessible

**Issues:**
- **BLOCKER:** Hardcoded hex colors in `PayslipMode.tsx:74-95` — `#e5e7eb`, `#6b7280`, `#f9fafb` used in inline styles for print stylesheet
- **Color distribution:** Blue is heavily used as primary — no evidence of 60/30/10 analysis
- **Icon backgrounds:** 4 different colors (blue, purple, green, blue) — the two blues are slightly different shades

**Recommendation:** Replace hardcoded colors with Tailwind classes; verify icon background color consistency

---

### Pillar 4: Typography (3/4)

**Good:**
- Consistent font weights: `font-medium` for labels, `font-semibold` for headings, `font-bold` for emphasis
- Standard Tailwind font sizes used throughout
- Responsive text sizing with `text-sm` as minimum for body text

**Issues:**
- **7 distinct font sizes:** `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl` — slightly above recommended 4 for strict hierarchy
- **Arbitrary font size:** `text-[10px]` used in `DTRCalendar.tsx:110,115,120` for calendar day numbers
- **Inconsistent heading levels:** Dashboard uses h1 for "Dashboard", but sub-sections use div with bold styling instead of h2

**Recommendation:** Consider reducing to 5 core font sizes; use semantic heading elements consistently

---

### Pillar 5: Spacing (3/4)

**Good:**
- Standard Tailwind spacing classes used extensively (`py-`, `px-`, `gap-`, `space-`)
- Consistent card padding across dashboard stats and content areas
- Table rows have adequate spacing for readability

**Issues:**
- **Arbitrary values:** `min-h-[400px]` in `LazyPage.tsx:5` for loading minimum height
- **Inconsistent card gaps:** Dashboard stat cards use `gap-4`, while Recent/Upcoming Payrolls sections use different spacing
- **Mobile spacing:** Cards stack with consistent padding, but some sections could use tighter spacing on mobile

**Recommendation:** Create spacing scale guidelines; replace arbitrary values with Tailwind tokens

---

### Pillar 6: Experience Design (4/4)

**Good:**
- **Loading states:** Skeleton components used for content loading
- **Error states:** ErrorBoundary wraps entire app with fallback UI
- **Empty states:** Dedicated EmptyState component with icon, title, description, and action slot
- **Disabled states:** Buttons support disabled prop with visual feedback
- **Destructive actions:** ConfirmDialog component for delete/lock confirmations
- **Offline handling:** NetworkStatusBanner detects connectivity issues
- **Toast notifications:** Toast component provides feedback for actions

**Issues:**
- No significant gaps found — comprehensive state coverage

**Recommendation:** Maintain current state coverage as new features are added

---

## Visual Design Analysis

### Login Page
- Clean, centered card layout with subtle shadow
- Blue logo icon provides brand recognition
- "Sign in to your account" subtitle sets context
- "Forgot your password?" link is appropriately styled
- **Score: 4/4** — Excellent first impression

### Dashboard
- 4 stat cards with colored icon backgrounds provide at-a-glance metrics
- "Recent Payrolls" and "Upcoming Payrolls" sections split layout well
- Empty state for "Upcoming Payrolls" uses checkmark icon — positive framing
- Alert banner at top provides actionable guidance
- **Score: 4/4** — Well-organized information hierarchy

### Employees Page
- Breadcrumb navigation: "Home > Employee Master List"
- Search bar with "All Status" filter dropdown
- Table headers: CODE, STATUS, HIRE DATE, ACTIONS
- Empty state: "No employees found" centered in table
- **Score: 3/4** — Missing: row hover states, bulk selection UX

### Payroll Page
- Similar layout to Employees with search and status filter
- Status badge shows "draft" — lowercase should be capitalized
- Action icons: view, copy, lock, delete — need labels
- **Score: 3/4** — Icon buttons need accessibility improvements

### DTR (Daily Time Record)
- Filter bar with employee dropdown, month/year navigation
- Calendar/Summary toggle buttons
- Import/Export buttons in header
- Empty calendar grid — needs "Select an employee" guidance
- **Score: 3/4** — Missing empty state guidance

### Responsive Design
- **Desktop (1440px):** Full sidebar visible, 4-column stat cards, spacious layout
- **Tablet (768px):** Sidebar visible, 2-column stat cards, appropriate padding
- **Mobile (375px):** Sidebar collapsed to hamburger, single-column cards, touch-friendly targets
- **Score: 4/4** — Excellent responsive behavior

---

## Files Audited

**Visual Screenshots Captured:**
- Login page (desktop, tablet, mobile)
- Dashboard (desktop, tablet, mobile)
- Employees (desktop, tablet, mobile)
- Payroll (desktop, tablet, mobile)
- DTR (desktop, tablet, mobile)

**Code Files Analyzed:**
- `apps/web/src/components/ui/ConfirmDialog/ConfirmDialog.tsx`
- `apps/web/src/components/ui/EmptyState/EmptyState.tsx`
- `apps/web/src/components/ui/ErrorBoundary/ErrorBoundary.tsx`
- `apps/web/src/components/payroll/PayrollOutputView/PayslipMode.tsx`
- `apps/web/src/pages/dtr/DTRPage/DTRCalendar.tsx`
- `apps/web/src/components/ui/LazyPage.tsx`
- `apps/web/src/pages/dtr/DTRPage/LeaveApplicationModal.tsx`
- `apps/web/src/pages/dtr/DTRPage/DayEntryModal.tsx`
- `apps/web/src/pages/dtr/DTRPage/DTRImportModal.tsx`

**Total files in codebase:** 281 frontend files (`.tsx`, `.jsx`, `.css`, `.scss`)

---

## Recommendations Summary

| Priority | Issue | Pillar | Effort |
|----------|-------|--------|--------|
| High | Add aria-labels to icon-only action buttons | Visuals | Low |
| High | Replace hardcoded colors in PayslipMode.tsx | Color | Low |
| High | Capitalize status badges ("draft" → "Draft") | Copywriting | Low |
| Medium | Create copy constants for recurring CTAs | Copywriting | Medium |
| Medium | Reduce font sizes from 7 to 5 core sizes | Typography | Medium |
| Medium | Replace arbitrary spacing values | Spacing | Low |
| Medium | Add empty state guidance to DTR calendar | Experience | Low |
| Low | Indicate sidebar expansion state visually | Visuals | Low |
| Low | Create spacing scale guidelines | Spacing | Medium |

---

## Next Steps

1. **Immediate:** Fix icon button accessibility (aria-labels + tooltips)
2. **Immediate:** Replace hardcoded colors in PayslipMode.tsx
3. **Short-term:** Capitalize status badges, improve CTA labels
4. **Medium-term:** Typography hierarchy refinement, spacing guidelines
5. **Long-term:** Consider design system documentation with UI-SPEC.md