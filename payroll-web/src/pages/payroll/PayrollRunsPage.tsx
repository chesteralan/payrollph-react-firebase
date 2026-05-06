import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2, Lock, Unlock } from 'lucide-react'
import type { Payroll } from '../../types'

export function PayrollRunsPage() {
  const { currentCompanyId } = useAuth()
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', periodStart: '', periodEnd: '', templateId: '' })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCompanyId) return
    const data = { ...formData, companyId: currentCompanyId, status: 'draft' as const, createdBy: currentCompanyId }
    if (editingId) { await updateDoc(doc(db, 'payroll', editingId), data) }
    else { await addDoc(collection(db, 'payroll'), data) }
    setShowForm(false); setEditingId(null); setFormData({ name: '', periodStart: '', periodEnd: '', templateId: '' }); fetchPayrolls()
  }

  const toggleLock = async (payroll: Payroll) => {
    await updateDoc(doc(db, 'payroll', payroll.id), { status: payroll.status === 'locked' ? 'draft' : 'locked' })
    fetchPayrolls()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this payroll?')) { await deleteDoc(doc(db, 'payroll', id)); fetchPayrolls() }
  }

  if (!canView('payroll', 'payroll')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  const statusColors = { draft: 'bg-yellow-100 text-yellow-800', locked: 'bg-blue-100 text-blue-800', published: 'bg-green-100 text-green-800' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Runs</h1>
        {canAdd('payroll', 'payroll') && (
          <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />New Payroll</Button>
        )}
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'New'} Payroll</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input id="name" label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <div className="grid grid-cols-2 gap-4">
                <Input id="periodStart" label="Period Start" type="date" value={formData.periodStart} onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })} required />
                <Input id="periodEnd" label="Period End" type="date" value={formData.periodEnd} onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
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
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[p.status as keyof typeof statusColors]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {p.status !== 'published' && (
                        <Button variant="ghost" size="sm" onClick={() => toggleLock(p)}>
                          {p.status === 'locked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </Button>
                      )}
                      {canEdit('payroll', 'payroll') && p.status === 'draft' && (
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(p.id); setFormData({ name: p.name, periodStart: new Date(p.periodStart).toISOString().split('T')[0], periodEnd: new Date(p.periodEnd).toISOString().split('T')[0], templateId: '' }); setShowForm(true) }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete('payroll', 'payroll') && p.status === 'draft' && (
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
