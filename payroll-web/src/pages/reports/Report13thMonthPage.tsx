import { Card, CardContent } from '../../components/ui/Card'
import { usePermissions } from '../../hooks/usePermissions'

export function Report13thMonthPage() {
  const { canView } = usePermissions()
  if (!canView('reports', '13month')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">13th Month Report</h1>
      <Card><CardContent className="pt-6"><p className="text-gray-500">Configure date range and generate the 13th month pay report.</p></CardContent></Card>
    </div>
  )
}
