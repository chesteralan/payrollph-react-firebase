import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { EmployeeGroup } from '../../types'

export function EmployeeGroupsPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [groups, setGroups] = useState<EmployeeGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'employee_groups'))
    setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as EmployeeGroup[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateDoc(doc(db, 'employee_groups', editingId), formData)
    } else {
      await addDoc(collection(db, 'employee_groups'), { ...formData, isActive: true })
    }
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', description: '' })
    fetchGroups()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this group?')) {
      await deleteDoc(doc(db, 'employee_groups', id))
      fetchGroups()
    }
  }

  if (!canView('employees', 'groups')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Employee Groups</h1>
        {canAdd('employees', 'groups') && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Group
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Group' : 'Add Group'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="name"
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                id="description"
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
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
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : groups.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No groups found</td></tr>
              ) : (
                groups.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{g.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{g.description || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${g.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {g.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit('employees', 'groups') && (
                          <Button variant="ghost" size="sm" onClick={() => { setEditingId(g.id); setFormData({ name: g.name, description: g.description || '' }); setShowForm(true) }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete('employees', 'groups') && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(g.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
