import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CompanyProvider } from './context/CompanyContext'
import { ProtectedRoute } from './components/ui/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { SetupPage } from './pages/auth/SetupPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { EmployeesPage } from './pages/employees/EmployeesPage'
import { EmployeeProfilePage } from './pages/employees/EmployeeProfilePage'
import { EmployeeCalendarPage } from './pages/employees/CalendarPage'
import { EmployeeGroupsPage } from './pages/employees/GroupsPage'
import { PositionsPage } from './pages/employees/PositionsPage'
import { AreasPage } from './pages/employees/AreasPage'
import { NamesListPage } from './pages/lists/NamesListPage'
import { BenefitsPage, EarningsPage, DeductionsPage } from './pages/lists/ListPages'
import { PayrollRunsPage } from './pages/payroll/PayrollRunsPage'
import { PayrollWizardPage } from './pages/payroll/PayrollWizardPage'
import { PayrollDetailPage } from './pages/payroll/PayrollDetailPage'
import { TemplatesPage } from './pages/payroll/TemplatesPage'
import { DTRPage } from './pages/dtr/DTRPage'
import { Report13thMonthPage } from './pages/reports/Report13thMonthPage'
import { CompaniesPage } from './pages/system/CompaniesPage'
import { CalendarPage, TermsPage, UsersPage, RestrictionsPage, AuditPage, DatabasePage } from './pages/system/SystemPages'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="employees/:id" element={<EmployeeProfilePage />} />
              <Route path="employees/calendar" element={<EmployeeCalendarPage />} />
              <Route path="employees/groups" element={<EmployeeGroupsPage />} />
              <Route path="employees/positions" element={<PositionsPage />} />
              <Route path="employees/areas" element={<AreasPage />} />
              <Route path="lists/names" element={<NamesListPage />} />
              <Route path="lists/benefits" element={<BenefitsPage />} />
              <Route path="lists/earnings" element={<EarningsPage />} />
              <Route path="lists/deductions" element={<DeductionsPage />} />
              <Route path="payroll" element={<PayrollRunsPage />} />
              <Route path="payroll/new" element={<PayrollWizardPage />} />
              <Route path="payroll/:id" element={<PayrollDetailPage />} />
              <Route path="payroll/:id/wizard" element={<PayrollWizardPage />} />
              <Route path="payroll/templates" element={<TemplatesPage />} />
              <Route path="dtr" element={<DTRPage />} />
              <Route path="reports/13th-month" element={<Report13thMonthPage />} />
              <Route path="system/companies" element={<CompaniesPage />} />
              <Route path="system/calendar" element={<CalendarPage />} />
              <Route path="system/terms" element={<TermsPage />} />
              <Route path="system/users" element={<UsersPage />} />
              <Route path="system/restrictions" element={<RestrictionsPage />} />
              <Route path="system/audit" element={<AuditPage />} />
              <Route path="system/database" element={<DatabasePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
