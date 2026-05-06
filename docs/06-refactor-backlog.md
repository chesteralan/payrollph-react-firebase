# 06 - Refactor Backlog

## Prioritized Backlog Table

| Priority | Task | Impact | Effort | Owner | Notes |
|---|---|---|---|---|---|
| P0 | Migrate password hashing (SHA1 -> bcrypt/argon2) | Critical security improvement | M | Backend Lead | Add migration-on-login strategy |
| P0 | Enable CSRF globally and patch affected forms | Critical security improvement | M | Backend + Frontend | Config + UI/AJAX compatibility fixes |
| P0 | Externalize DB credentials and secrets | Critical security improvement | S | DevOps + Backend | Remove hardcoded config secrets |
| P0 | Restrict/disable dangerous `system_database` actions in prod | Critical operational risk reduction | S | Backend Lead | Keep admin-only + confirmation guards |
| P1 | Extract payroll generation logic to service layer | High maintainability and reliability | L | Backend Team | Move from `Payroll.php` controller |
| P1 | Add DB transactions for payroll generation writes | High data integrity improvement | M | Backend Team | Prevent partial writes |
| P1 | Replace dynamic SQL concatenation paths | High security and correctness | M | Backend Team | Parameterize/filter safely |
| P1 | Break down oversized controllers (`Payroll`, `Payroll_overall`) | High maintainability | L | Backend Team | Use services/use-case classes |
| P1 | Standardize validation/request DTO patterns | High consistency | M | Backend Team | Reduce repeated validation logic |
| P2 | Consolidate duplicate DTR logic across modules | Medium maintainability | M | Backend Team | Shared attendance/absence/overtime service |
| P2 | Optimize report query paths and add indexes | Medium performance | M | Backend + DBA | Focus payroll/report pages |
| P2 | Fix helper defects and duplicated utility functions | Medium quality | S | Backend Team | `payroll_helper.php` needs cleanup |
| P2 | Normalize audit event payload structure | Medium observability | S | Backend Team | Improve traceability |
| P3 | Refactor view partials and repetitive UI patterns | Medium UX maintainability | M | Frontend Team | Incremental cleanup |
| P3 | Introduce API contract tests for new endpoints | Medium release confidence | M | QA + Backend | Add to CI pipeline |
| P3 | Add async job handling for heavy exports (future) | Medium scalability | L | Backend + DevOps | Needs architecture decision |

## Backlog Notes

- **Impact scale:** Critical / High / Medium
- **Effort scale:** S (1-3 days), M (1-2 weeks), L (2+ weeks)
- Items marked P0 should be completed before major platform migration.
- Final sequencing should align with payroll cycle calendar to reduce operational risk.

