import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2, Upload } from 'lucide-react'

interface NameRecord {
  id: string
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
}

export function NamesListPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [names, setNames] = useState<NameRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ firstName: '', middleName: '', lastName: '', suffix: '' })

  useEffect(() => { fetchNames() }, [])

  const fetchNames = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'names'))
    setNames(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as NameRecord[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) { await updateDoc(doc(db, 'names', editingId), formData) }
    else { await addDoc(collection(db, 'names'), formData) }
    setShowForm(false); setEditingId(null); setFormData({ firstName: '', middleName: '', lastName: '', suffix: '' }); fetchNames()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this name record?')) { await deleteDoc(doc(db, 'names', id)); fetchNames() }
  }

  if (!canView('lists', 'names')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Names List</h1>
        <div className="flex gap-2">
          <Button variant="secondary"><Upload className="w-4 h-4 mr-2" />Import CSV</Button>
          {canAdd('lists', 'names') && (
            <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add Name</Button>
          )}
        </div>
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} Name</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input id="firstName" label="First Name" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                <Input id="middleName" label="Middle Name" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} />
                <Input id="lastName" label="Last Name" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                <Input id="suffix" label="Suffix" value={formData.suffix} onChange={(e) => setFormData({ ...formData, suffix: e.target.value })} />
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
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : names.length === 0 ? <tr><td colSpan={2} className="px-6 py-4 text-center text-gray-500">No names found</td></tr>
              : names.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {n.firstName} {n.middleName || ''} {n.lastName}{n.suffix ? `, ${n.suffix}` : ''}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit('lists', 'names') && <Button variant="ghost" size="sm" onClick={() => { setEditingId(n.id); setFormData({ firstName: n.firstName, middleName: n.middleName || '', lastName: n.lastName, suffix: n.suffix || '' }); setShowForm(true) }}><Edit className="w-4 h-4" /></Button>}
                      {canDelete('lists', 'names') && <Button variant="ghost" size="sm" onClick={() => handleDelete(n.id)}><Trash2 className="w-4 h-4" /></Button>}
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
