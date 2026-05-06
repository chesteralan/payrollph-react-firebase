import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CompanyProvider } from './context/CompanyContext'
import { ToastProvider } from './components/ui/Toast'
import { ProtectedRoute } from './components/ui/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { SetupPage } from './pages/auth/SetupPage'
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { UserSettingsPage } from './pages/auth/UserSettingsPage'

const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const EmployeesPage = lazy(() => import('./pages/employees/EmployeesPage').then(m => ({ default: m.EmployeesPage })))
const EmployeeProfilePage = lazy(() => import('./pages/employees/EmployeeProfilePage').then(m => ({ default: m.EmployeeProfilePage })))
const EmployeeCalendarPage = lazy(() => import('./pages/employees/CalendarPage').then(m => ({ default: m.EmployeeCalendarPage })))
const EmployeeGroupsPage = lazy(() => import('./pages/employees/GroupsPage').then(m => ({ default: m.EmployeeGroupsPage })))
const PositionsPage = lazy(() => import('./pages/employees/PositionsPage').then(m => ({ default: m.PositionsPage })))
const AreasPage = lazy(() => import('./pages/employees/AreasPage').then(m => ({ default: m.AreasPage })))
const NamesListPage = lazy(() => import('./pages/lists/NamesListPage').then(m => ({ default: m.NamesListPage })))
const BenefitsPage = lazy(() => import('./pages/lists/ListPages').then(m => ({ default: m.BenefitsPage })))
const EarningsPage = lazy(() => import('./pages/lists/ListPages').then(m => ({ default: m.EarningsPage })))
const DeductionsPage = lazy(() => import('./pages/lists/ListPages').then(m => ({ default: m.DeductionsPage })))
const PayrollRunsPage = lazy(() => import('./pages/payroll/PayrollRunsPage').then(m => ({ default: m.PayrollRunsPage })))
const PayrollWizardPage = lazy(() => import('./pages/payroll/PayrollWizardPage').then(m => ({ default: m.PayrollWizardPage })))
const PayrollDetailPage = lazy(() => import('./pages/payroll/PayrollDetailPage').then(m => ({ default: m.PayrollDetailPage })))
const TemplatesPage = lazy(() => import('./pages/payroll/TemplatesPage').then(m => ({ default: m.TemplatesPage })))
const PrintFormatsPage = lazy(() => import('./pages/payroll/PrintFormatsPage').then(m => ({ default: m.PrintFormatsPage })))
const DTRPage = lazy(() => import('./pages/dtr/DTRPage').then(m => ({ default: m.DTRPage })))
const Report13thMonthPage = lazy(() => import('./pages/reports/Report13thMonthPage').then(m => ({ default: m.Report13thMonthPage })))
const CompaniesPage = lazy(() => import('./pages/system/CompaniesPage').then(m => ({ default: m.CompaniesPage })))
const CalendarPage = lazy(() => import('./pages/system/SystemPages').then(m => ({ default: m.CalendarPage })))
const TermsPage = lazy(() => import('./pages/system/SystemPages').then(m => ({ default: m.TermsPage })))
const UsersPage = lazy(() => import('./pages/system/SystemPages').then(m => ({ default: m.UsersPage })))
const RestrictionsPage = lazy(() => import('./pages/system/SystemPages').then(m => ({ default: m.RestrictionsPage })))
const AuditPage = lazy(() => import('./pages/system/SystemPages').then(m => ({ default: m.AuditPage })))
const DatabasePage = lazy(() => import('./pages/system/SystemPages').then(m => ({ default: m.DatabasePage })))
const TrashPage = lazy(() => import('./pages/system/TrashPage').then(m => ({ default: m.TrashPage })))

function LoadingFallback() {
  return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-500">Loading...</div></div>
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <ToastProvider>
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
              <Route index element={<LazyPage><DashboardPage /></LazyPage>} />
              <Route path="settings" element={<LazyPage><UserSettingsPage /></LazyPage>} />
              <Route path="employees" element={<LazyPage><EmployeesPage /></LazyPage>} />
              <Route path="employees/:id" element={<LazyPage><EmployeeProfilePage /></LazyPage>} />
              <Route path="employees/calendar" element={<LazyPage><EmployeeCalendarPage /></LazyPage>} />
              <Route path="employees/groups" element={<LazyPage><EmployeeGroupsPage /></LazyPage>} />
              <Route path="employees/positions" element={<LazyPage><PositionsPage /></LazyPage>} />
              <Route path="employees/areas" element={<LazyPage><AreasPage /></LazyPage>} />
              <Route path="lists/names" element={<LazyPage><NamesListPage /></LazyPage>} />
              <Route path="lists/benefits" element={<LazyPage><BenefitsPage /></LazyPage>} />
              <Route path="lists/earnings" element={<LazyPage><EarningsPage /></LazyPage>} />
              <Route path="lists/deductions" element={<LazyPage><DeductionsPage /></LazyPage>} />
              <Route path="payroll" element={<LazyPage><PayrollRunsPage /></LazyPage>} />
              <Route path="payroll/new" element={<LazyPage><PayrollWizardPage /></LazyPage>} />
              <Route path="payroll/:id" element={<LazyPage><PayrollDetailPage /></LazyPage>} />
              <Route path="payroll/:id/wizard" element={<LazyPage><PayrollWizardPage /></LazyPage>} />
              <Route path="payroll/templates" element={<LazyPage><TemplatesPage /></LazyPage>} />
              <Route path="payroll/print-formats" element={<LazyPage><PrintFormatsPage /></LazyPage>} />
              <Route path="dtr" element={<LazyPage><DTRPage /></LazyPage>} />
              <Route path="reports/13th-month" element={<LazyPage><Report13thMonthPage /></LazyPage>} />
              <Route path="system/companies" element={<LazyPage><CompaniesPage /></LazyPage>} />
              <Route path="system/calendar" element={<LazyPage><CalendarPage /></LazyPage>} />
              <Route path="system/terms" element={<LazyPage><TermsPage /></LazyPage>} />
              <Route path="system/users" element={<LazyPage><UsersPage /></LazyPage>} />
              <Route path="system/restrictions" element={<LazyPage><RestrictionsPage /></LazyPage>} />
              <Route path="system/audit" element={<LazyPage><AuditPage /></LazyPage>} />
              <Route path="system/database" element={<LazyPage><DatabasePage /></LazyPage>} />
              <Route path="system/trash" element={<LazyPage><TrashPage /></LazyPage>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
