import { type ComponentType, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ui/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LazyPage } from "./components/ui/LazyPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { SetupPage } from "./pages/auth/SetupPage";
import { ChangePasswordPage } from "./pages/auth/ChangePasswordPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { UserSettingsPage } from "./pages/auth/UserSettingsPage";

/** Helper: lazy-load a named export from a dynamic import */
function lazyNamed<T extends Record<string, unknown>>(
  imp: () => Promise<T>,
  name: keyof T,
) {
  return lazy(() =>
    imp().then((m) => ({ default: m[name] as ComponentType<object> })),
  );
}

const DashboardPage = lazyNamed(() => import("./pages/dashboard/DashboardPage"), "DashboardPage");
const EmployeesPage = lazyNamed(() => import("./pages/employees/EmployeesPage"), "EmployeesPage");
const EmployeeProfilePage = lazyNamed(() => import("./pages/employees/EmployeeProfilePage"), "EmployeeProfilePage");
const EmployeeCalendarPage = lazyNamed(() => import("./pages/employees/CalendarPage"), "EmployeeCalendarPage");
const EmployeeGroupsPage = lazyNamed(() => import("./pages/employees/GroupsPage"), "EmployeeGroupsPage");
const PositionsPage = lazyNamed(() => import("./pages/employees/PositionsPage"), "PositionsPage");
const AreasPage = lazyNamed(() => import("./pages/employees/AreasPage"), "AreasPage");
const NamesListPage = lazyNamed(() => import("./pages/lists/NamesListPage"), "NamesListPage");
const BenefitsPage = lazyNamed(() => import("./pages/lists/ListPages"), "BenefitsPage");
const EarningsPage = lazyNamed(() => import("./pages/lists/ListPages"), "EarningsPage");
const DeductionsPage = lazyNamed(() => import("./pages/lists/ListPages"), "DeductionsPage");
const PayrollRunsPage = lazyNamed(() => import("./pages/payroll/PayrollRunsPage"), "PayrollRunsPage");
const PayrollWizardPage = lazyNamed(() => import("./pages/payroll/PayrollWizardPage"), "PayrollWizardPage");
const PayrollDetailPage = lazyNamed(() => import("./pages/payroll/PayrollDetailPage"), "PayrollDetailPage");
const TemplatesPage = lazyNamed(() => import("./pages/payroll/TemplatesPage"), "TemplatesPage");
const PrintFormatsPage = lazyNamed(() => import("./pages/payroll/PrintFormatsPage"), "PrintFormatsPage");
const DTRPage = lazyNamed(() => import("./pages/dtr/DTRPage"), "DTRPage");
const Report13thMonthPage = lazyNamed(() => import("./pages/reports/Report13thMonthPage"), "Report13thMonthPage");
const PayrollSummaryPage = lazyNamed(() => import("./pages/reports/PayrollSummaryPage"), "PayrollSummaryPage");
const EmployeeReportPage = lazyNamed(() => import("./pages/reports/EmployeeReportPage"), "EmployeeReportPage");
const EarningsDeductionsReportPage = lazyNamed(() => import("./pages/reports/EarningsDeductionsReportPage"), "EarningsDeductionsReportPage");
const AttendanceReportPage = lazyNamed(() => import("./pages/reports/AttendanceReportPage"), "AttendanceReportPage");
const BenefitsUtilizationReportPage = lazyNamed(() => import("./pages/reports/BenefitsUtilizationReportPage"), "BenefitsUtilizationReportPage");
const YearEndReportPage = lazyNamed(() => import("./pages/reports/YearEndReportPage"), "YearEndReportPage");
const CompaniesPage = lazyNamed(() => import("./pages/system/CompaniesPage"), "CompaniesPage");
const CompanySettingsPage = lazyNamed(() => import("./pages/system/CompanySettingsPage"), "CompanySettingsPage");
const CalendarPage = lazyNamed(() => import("./pages/system/SystemPages"), "CalendarPage");
const TermsPage = lazyNamed(() => import("./pages/system/SystemPages"), "TermsPage");
const UsersPage = lazyNamed(() => import("./pages/system/SystemPages"), "UsersPage");
const RestrictionsPage = lazyNamed(() => import("./pages/system/SystemPages"), "RestrictionsPage");
const AuditPage = lazyNamed(() => import("./pages/system/SystemPages"), "AuditPage");
const DatabasePage = lazyNamed(() => import("./pages/system/SystemPages"), "DatabasePage");
const UserActivityPage = lazyNamed(() => import("./pages/system/SystemPages"), "UserActivityPage");
const SystemSettingsPage = lazyNamed(() => import("./pages/system/SystemSettingsPage"), "SystemSettingsPage");
const TrashPage = lazyNamed(() => import("./pages/system/TrashPage"), "TrashPage");
const HealthCheckPage = lazyNamed(() => import("./pages/system/HealthCheckPage"), "HealthCheckPage");

interface RouteConfig {
  path?: string;
  index?: boolean;
  Component: ComponentType<object>;
}

const protectedRoutes: RouteConfig[] = [
  { index: true, Component: DashboardPage },
  { path: "settings", Component: UserSettingsPage },
  { path: "employees", Component: EmployeesPage },
  { path: "employees/:id", Component: EmployeeProfilePage },
  { path: "employees/calendar", Component: EmployeeCalendarPage },
  { path: "employees/groups", Component: EmployeeGroupsPage },
  { path: "employees/positions", Component: PositionsPage },
  { path: "employees/areas", Component: AreasPage },
  { path: "lists/names", Component: NamesListPage },
  { path: "lists/benefits", Component: BenefitsPage },
  { path: "lists/earnings", Component: EarningsPage },
  { path: "lists/deductions", Component: DeductionsPage },
  { path: "payroll", Component: PayrollRunsPage },
  { path: "payroll/new", Component: PayrollWizardPage },
  { path: "payroll/:id", Component: PayrollDetailPage },
  { path: "payroll/:id/wizard", Component: PayrollWizardPage },
  { path: "payroll/templates", Component: TemplatesPage },
  { path: "payroll/print-formats", Component: PrintFormatsPage },
  { path: "dtr", Component: DTRPage },
  { path: "reports/13th-month", Component: Report13thMonthPage },
  { path: "reports/payroll-summary", Component: PayrollSummaryPage },
  { path: "reports/employees", Component: EmployeeReportPage },
  { path: "reports/earnings-deductions", Component: EarningsDeductionsReportPage },
  { path: "reports/attendance", Component: AttendanceReportPage },
  { path: "reports/benefits-utilization", Component: BenefitsUtilizationReportPage },
  { path: "reports/year-end", Component: YearEndReportPage },
  { path: "system/companies", Component: CompaniesPage },
  { path: "system/company-settings", Component: CompanySettingsPage },
  { path: "system/calendar", Component: CalendarPage },
  { path: "system/terms", Component: TermsPage },
  { path: "system/users", Component: UsersPage },
  { path: "system/restrictions", Component: RestrictionsPage },
  { path: "system/audit", Component: AuditPage },
  { path: "system/database", Component: DatabasePage },
  { path: "system/settings", Component: SystemSettingsPage },
  { path: "system/trash", Component: TrashPage },
  { path: "system/health", Component: HealthCheckPage },
  { path: "system/activity", Component: UserActivityPage },
];

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {protectedRoutes.map((r) => (
          <Route
            key={r.path ?? "index"}
            index={r.index}
            path={r.path}
            element={
              <LazyPage>
                <r.Component />
              </LazyPage>
            }
          />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
