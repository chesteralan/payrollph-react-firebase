import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { EmployeePosition } from '../../types'

export function PositionsPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [positions, setPositions] = useState<EmployeePosition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', department: '' })

  useEffect(() => { fetchPositions() }, [])

  const fetchPositions = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'employee_positions'))
    setPositions(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as EmployeePosition[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateDoc(doc(db, 'employee_positions', editingId), formData)
    } else {
      await addDoc(collection(db, 'employee_positions'), { ...formData, isActive: true })
    }
    setShowForm(false); setEditingId(null); setFormData({ name: '', department: '' }); fetchPositions()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this position?')) { await deleteDoc(doc(db, 'employee_positions', id)); fetchPositions() }
  }

  if (!canView('employees', 'positions')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Positions</h1>
        {canAdd('employees', 'positions') && (
          <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add Position</Button>
        )}
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} Position</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input id="name" label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input id="department" label="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
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
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : positions.length === 0 ? <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No positions found</td></tr>
              : positions.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.department || '-'}</td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit('employees', 'positions') && <Button variant="ghost" size="sm" onClick={() => { setEditingId(p.id); setFormData({ name: p.name, department: p.department || '' }); setShowForm(true) }}><Edit className="w-4 h-4" /></Button>}
                      {canDelete('employees', 'positions') && <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>}
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
