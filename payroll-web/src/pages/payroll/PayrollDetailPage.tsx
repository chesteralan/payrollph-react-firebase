import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ArrowLeft, Lock, Unlock, Printer, Download } from 'lucide-react'
import type { Payroll } from '../../types'

const STAGES = ['dtr', 'salaries', 'earnings', 'benefits', 'deductions', 'summary']

export function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [payroll, setPayroll] = useState<Payroll | null>(null)
  const [activeStage, setActiveStage] = useState('summary')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchPayroll()
  }, [id])

  const fetchPayroll = async () => {
    if (!id) return
    setLoading(true)
    const snap = await getDoc(doc(db, 'payroll', id))
    if (snap.exists()) {
      setPayroll({ id: snap.id, ...snap.data() } as Payroll)
    }
    setLoading(false)
  }

  const toggleLock = async () => {
    if (!payroll || !id) return
    await updateDoc(doc(db, 'payroll', id), { isLocked: !payroll.isLocked })
    fetchPayroll()
  }

  if (loading || !payroll) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/payroll')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{payroll.name}</h1>
            <p className="text-gray-500">
              {new Date(0, payroll.month - 1).toLocaleString('default', { month: 'long' })} {payroll.year}
              {payroll.isLocked && ' (Locked)'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={toggleLock}>
            {payroll.isLocked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            {payroll.isLocked ? 'Unlock' : 'Lock'}
          </Button>
          <Button variant="secondary"><Printer className="w-4 h-4 mr-2" />Print</Button>
          <Button variant="secondary"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {STAGES.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveStage(stage)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeStage === stage
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {stage}
          </button>
        ))}
      </div>

      {activeStage === 'dtr' && <DTRStage />}
      {activeStage === 'salaries' && <SalariesStage />}
      {activeStage === 'earnings' && <EarningsStage />}
      {activeStage === 'benefits' && <BenefitsStage />}
      {activeStage === 'deductions' && <DeductionsStage />}
      {activeStage === 'summary' && <SummaryStage />}
    </div>
  )
}

function DTRStage() {
  return (<Card><CardHeader><CardTitle>Daily Time Record</CardTitle></CardHeader><CardContent><p className="text-gray-500">Review and edit attendance, absences, overtime, and leave data.</p></CardContent></Card>)
}

function SalariesStage() {
  return (<Card><CardHeader><CardTitle>Salaries</CardTitle></CardHeader><CardContent><p className="text-gray-500">Review and adjust salary computations.</p></CardContent></Card>)
}

function EarningsStage() {
  return (<Card><CardHeader><CardTitle>Earnings</CardTitle></CardHeader><CardContent><p className="text-gray-500">Review and edit earning entries.</p></CardContent></Card>)
}

function BenefitsStage() {
  return (<Card><CardHeader><CardTitle>Benefits</CardTitle></CardHeader><CardContent><p className="text-gray-500">Review and edit benefit entries (employee and employer shares).</p></CardContent></Card>)
}

function DeductionsStage() {
  return (<Card><CardHeader><CardTitle>Deductions</CardTitle></CardHeader><CardContent><p className="text-gray-500">Review and edit deduction entries.</p></CardContent></Card>)
}

function SummaryStage() {
  return (<Card><CardHeader><CardTitle>Payroll Summary</CardTitle></CardHeader><CardContent><p className="text-gray-500">View consolidated payroll totals by employee and component.</p></CardContent></Card>)
}
