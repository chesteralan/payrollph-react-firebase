import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2 } from 'lucide-react'
import type { Company } from '../../types'

export function CompaniesPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', address: '', tin: '' })

  useEffect(() => { fetchCompanies() }, [])

  const fetchCompanies = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'companies'))
    setCompanies(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Company[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) { await updateDoc(doc(db, 'companies', editingId), formData) }
    else { await addDoc(collection(db, 'companies'), { ...formData, isActive: true }) }
    setShowForm(false); setEditingId(null); setFormData({ name: '', address: '', tin: '' }); fetchCompanies()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this company?')) { await deleteDoc(doc(db, 'companies', id)); fetchCompanies() }
  }

  if (!canView('system', 'companies')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        {canAdd('system', 'companies') && (
          <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add Company</Button>
        )}
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} Company</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input id="name" label="Company Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input id="address" label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              <Input id="tin" label="TIN" value={formData.tin} onChange={(e) => setFormData({ ...formData, tin: e.target.value })} />
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
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">TIN</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : companies.length === 0 ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No companies found</td></tr>
              : companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.address || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.tin || '-'}</td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit('system', 'companies') && <Button variant="ghost" size="sm" onClick={() => { setEditingId(c.id); setFormData({ name: c.name, address: c.address || '', tin: c.tin || '' }); setShowForm(true) }}><Edit className="w-4 h-4" /></Button>}
                      {canDelete('system', 'companies') && <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>}
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
