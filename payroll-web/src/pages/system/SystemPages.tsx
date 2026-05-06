import { Card, CardContent } from '../../components/ui/Card'
import { usePermissions } from '../../hooks/usePermissions'

export function CalendarPage() {
  const { canView } = usePermissions()
  if (!canView('system', 'calendar')) return <div className="text-center py-12 text-gray-500">Access denied</div>
  return (<div className="space-y-6"><h1 className="text-2xl font-bold text-gray-900">System Calendar</h1><Card><CardContent className="pt-6"><p className="text-gray-500">Manage holidays and special workdays.</p></CardContent></Card></div>)
}

export function TermsPage() {
  const { canView } = usePermissions()
  if (!canView('system', 'terms')) return <div className="text-center py-12 text-gray-500">Access denied</div>
  return (<div className="space-y-6"><h1 className="text-2xl font-bold text-gray-900">Terms</h1><Card><CardContent className="pt-6"><p className="text-gray-500">Manage terms and conditions.</p></CardContent></Card></div>)
}

export function UsersPage() {
  const { canView } = usePermissions()
  if (!canView('system', 'users')) return <div className="text-center py-12 text-gray-500">Access denied</div>
  return (<div className="space-y-6"><h1 className="text-2xl font-bold text-gray-900">User Accounts</h1><Card><CardContent className="pt-6"><p className="text-gray-500">Manage user accounts and access.</p></CardContent></Card></div>)
}

export function RestrictionsPage() {
  const { canView } = usePermissions()
  if (!canView('system', 'users')) return <div className="text-center py-12 text-gray-500">Access denied</div>
  return (<div className="space-y-6"><h1 className="text-2xl font-bold text-gray-900">User Restrictions</h1><Card><CardContent className="pt-6"><p className="text-gray-500">Configure department and section permissions.</p></CardContent></Card></div>)
}

export function AuditPage() {
  const { canView } = usePermissions()
  if (!canView('system', 'audit')) return <div className="text-center py-12 text-gray-500">Access denied</div>
  return (<div className="space-y-6"><h1 className="text-2xl font-bold text-gray-900">Audit Log</h1><Card><CardContent className="pt-6"><p className="text-gray-500">View system audit trail.</p></CardContent></Card></div>)
}

export function DatabasePage() {
  const { canView } = usePermissions()
  if (!canView('system', 'database')) return <div className="text-center py-12 text-gray-500">Access denied</div>
  return (<div className="space-y-6"><h1 className="text-2xl font-bold text-gray-900">Database</h1><Card><CardContent className="pt-6"><p className="text-gray-500">Database maintenance and backup tools.</p></CardContent></Card></div>)
}
