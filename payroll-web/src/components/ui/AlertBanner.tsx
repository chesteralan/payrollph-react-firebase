import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../hooks/useAuth'
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react'

interface SystemAlert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  dismissed: boolean
  expiresAt?: Date
}

interface AlertBannerProps {
  alert: SystemAlert
  onDismiss: (id: string) => void
}

function AlertBanner({ alert, onDismiss }: AlertBannerProps) {
  const icons = {
    info: <Info className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
  }

  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  }

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-lg ${colors[alert.type]}`}>
      <span className="flex-shrink-0 mt-0.5">{icons[alert.type]}</span>
      <div className="flex-1">
        <h3 className="text-sm font-semibold">{alert.title}</h3>
        <p className="text-sm mt-1 opacity-90">{alert.message}</p>
      </div>
      <button
        onClick={() => onDismiss(alert.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function generateSystemAlerts(payrollCount: number, employeeCount: number): SystemAlert[] {
  const alerts: SystemAlert[] = []
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const dayOfMonth = now.getDate()

  const midMonth = dayOfMonth >= 10 && dayOfMonth <= 18
  const endMonth = dayOfMonth >= 25

  if (payrollCount === 0) {
    alerts.push({
      id: 'no-payroll',
      type: 'warning',
      title: 'No Payroll Runs Found',
      message: 'You haven\'t created any payroll runs yet. Start by creating your first payroll run.',
      dismissed: false,
    })
  }

  if (midMonth && payrollCount > 0) {
    alerts.push({
      id: 'midmonth-reminder',
      type: 'info',
      title: 'Mid-Month Payroll Reminder',
      message: `It's mid-${new Date(0, currentMonth - 1).toLocaleString('default', { month: 'long' })}. If you have semi-monthly payroll, prepare your cutoff payroll run.`,
      dismissed: false,
    })
  }

  if (endMonth) {
    alerts.push({
      id: 'monthend-reminder',
      type: 'warning',
      title: 'Month-End Payroll Due',
      message: `End of ${new Date(0, currentMonth - 1).toLocaleString('default', { month: 'long' })} approaching. Ensure your monthly payroll is processed on time.`,
      dismissed: false,
    })
  }

  if (employeeCount === 0) {
    alerts.push({
      id: 'no-employees',
      type: 'info',
      title: 'No Employees Added',
      message: 'Add employees to get started with payroll processing.',
      dismissed: false,
    })
  }

  return alerts
}

export function AlertBannerProvider({ children }: { children: React.ReactNode }) {
  const { currentCompanyId } = useAuth()
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!currentCompanyId) return

    const checkAlerts = async () => {
      const payrollSnap = await getDocs(
        query(collection(db, 'payroll'), where('companyId', '==', currentCompanyId), limit(1))
      )

      const employeeSnap = await getDocs(
        query(collection(db, 'employees'), where('companyId', '==', currentCompanyId), limit(1))
      )

      const generated = generateSystemAlerts(payrollSnap.size, employeeSnap.size)
      const filtered = generated.filter(a => !dismissedIds.has(a.id))
      setAlerts(filtered)
    }

    checkAlerts()
  }, [currentCompanyId, dismissedIds])

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <>
      {alerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {alerts.map(alert => (
            <AlertBanner key={alert.id} alert={alert} onDismiss={handleDismiss} />
          ))}
        </div>
      )}
      {children}
    </>
  )
}
