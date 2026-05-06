import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2, Copy } from 'lucide-react'

interface PayrollTemplate {
  id: string
  name: string
  description?: string
  isActive: boolean
  earnings: string[]
  deductions: string[]
  benefits: string[]
}

export function TemplatesPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [templates, setTemplates] = useState<PayrollTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => { fetchTemplates() }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'payroll_templates'))
    setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PayrollTemplate[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) { await updateDoc(doc(db, 'payroll_templates', editingId), formData) }
    else { await addDoc(collection(db, 'payroll_templates'), { ...formData, isActive: true, earnings: [], deductions: [], benefits: [] }) }
    setShowForm(false); setEditingId(null); setFormData({ name: '', description: '' }); fetchTemplates()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this template?')) { await deleteDoc(doc(db, 'payroll_templates', id)); fetchTemplates() }
  }

  if (!canView('payroll', 'templates')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Templates</h1>
        {canAdd('payroll', 'templates') && (
          <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />New Template</Button>
        )}
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'New'} Template</CardTitle></CardHeader>
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
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Components</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : templates.length === 0 ? <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No templates found</td></tr>
              : templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.description || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {(t.earnings?.length || 0) + (t.deductions?.length || 0) + (t.benefits?.length || 0)} items
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm"><Copy className="w-4 h-4" /></Button>
                      {canEdit('payroll', 'templates') && <Button variant="ghost" size="sm" onClick={() => { setEditingId(t.id); setFormData({ name: t.name, description: t.description || '' }); setShowForm(true) }}><Edit className="w-4 h-4" /></Button>}
                      {canDelete('payroll', 'templates') && <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4" /></Button>}
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
