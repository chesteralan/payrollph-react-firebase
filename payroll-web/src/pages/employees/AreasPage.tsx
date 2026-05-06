import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { EmployeeArea } from '../../types'

export function AreasPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [areas, setAreas] = useState<EmployeeArea[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => { fetchAreas() }, [])

  const fetchAreas = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'employee_areas'))
    setAreas(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as EmployeeArea[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) { await updateDoc(doc(db, 'employee_areas', editingId), formData) }
    else { await addDoc(collection(db, 'employee_areas'), { ...formData, isActive: true }) }
    setShowForm(false); setEditingId(null); setFormData({ name: '', description: '' }); fetchAreas()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this area?')) { await deleteDoc(doc(db, 'employee_areas', id)); fetchAreas() }
  }

  if (!canView('employees', 'areas')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Areas</h1>
        {canAdd('employees', 'areas') && (
          <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add Area</Button>
        )}
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} Area</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input id="name" label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input id="description" label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : areas.length === 0 ? <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No areas found</td></tr>
              : areas.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{a.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{a.description || '-'}</td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${a.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{a.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit('employees', 'areas') && <Button variant="ghost" size="sm" onClick={() => { setEditingId(a.id); setFormData({ name: a.name, description: a.description || '' }); setShowForm(true) }}><Edit className="w-4 h-4" /></Button>}
                      {canDelete('employees', 'areas') && <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}><Trash2 className="w-4 h-4" /></Button>}
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
