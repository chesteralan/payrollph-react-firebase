import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Plus, Trash2, Lock, Unlock, ArrowRight } from 'lucide-react'
import type { Payroll } from '../../types'

export function PayrollRunsPage() {
  const { currentCompanyId } = useAuth()
  const { canView, canAdd, canDelete } = usePermissions()
  const navigate = useNavigate()
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentCompanyId) fetchPayrolls()
  }, [currentCompanyId])

  const fetchPayrolls = async () => {
    if (!currentCompanyId) return
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'payroll'), where('companyId', '==', currentCompanyId)))
    setPayrolls(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Payroll[])
    setLoading(false)
  }

  const toggleLock = async (payroll: Payroll) => {
    await updateDoc(doc(db, 'payroll', payroll.id), { isLocked: !payroll.isLocked })
    fetchPayrolls()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this payroll?')) { await deleteDoc(doc(db, 'payroll', id)); fetchPayrolls() }
  }

  if (!canView('payroll', 'payroll')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Runs</h1>
        {canAdd('payroll', 'payroll') && (
          <Button onClick={() => navigate('/payroll/new')}><Plus className="w-4 h-4 mr-2" />New Payroll</Button>
        )}
      </div>

      <Card><CardContent className="p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : payrolls.length === 0 ? <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No payroll runs found</td></tr>
              : payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 cursor-pointer" onClick={() => navigate(`/payroll/${p.id}`)}>{p.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(0, p.month - 1).toLocaleString('default', { month: 'long' })} {p.year}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${p.isLocked ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {p.isLocked ? 'Locked' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/payroll/${p.id}`)}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleLock(p)}>
                        {p.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </Button>
                      {canDelete('payroll', 'payroll') && !p.isLocked && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  )
}
