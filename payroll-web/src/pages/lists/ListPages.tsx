import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { useTableSort } from '../../hooks/useTableSort'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface ListItem { id: string; name: string; description?: string; isActive: boolean }

interface DeductionItem {
  id: string
  name: string
  description?: string
  type: 'fixed' | 'percentage'
  ruleValue?: number
  isActive: boolean
}

function createListPage({ collectionName, title, department, section }: { collectionName: string; title: string; department: 'lists'; section: 'benefits' | 'earnings' | 'deductions' }) {
  return function ListPage() {
    const { canView, canAdd, canEdit, canDelete } = usePermissions()
    const [items, setItems] = useState<ListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', description: '' })

    useEffect(() => { fetchItems() }, [])

    const fetchItems = async () => {
      setLoading(true)
      const snap = await getDocs(collection(db, collectionName))
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ListItem[])
      setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (editingId) { await updateDoc(doc(db, collectionName, editingId), formData) }
      else { await addDoc(collection(db, collectionName), { ...formData, isActive: true }) }
      setShowForm(false); setEditingId(null); setFormData({ name: '', description: '' }); fetchItems()
    }

    const handleDelete = async (id: string) => {
      if (confirm('Delete this item?')) { await deleteDoc(doc(db, collectionName, id)); fetchItems() }
    }

    if (!canView(department, section)) return <div className="text-center py-12 text-gray-500">Access denied</div>

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {canAdd(department, section) && (
            <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add {title.slice(0, -1)}</Button>
          )}
        </div>
        {showForm && (
          <Card>
            <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} {title.slice(0, -1)}</CardTitle></CardHeader>
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
                : items.length === 0 ? <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No items found</td></tr>
                : items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.description || '-'}</td>
                    <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit(department, section) && <Button variant="ghost" size="sm" onClick={() => { setEditingId(item.id); setFormData({ name: item.name, description: item.description || '' }); setShowForm(true) }}><Edit className="w-4 h-4" /></Button>}
                        {canDelete(department, section) && <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>}
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
}

export const BenefitsPage = createListPage({ collectionName: 'benefits', title: 'Benefits', department: 'lists', section: 'benefits' })
export const EarningsPage = createListPage({ collectionName: 'earnings', title: 'Earnings', department: 'lists', section: 'earnings' })

export function DeductionsPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [items, setItems] = useState<DeductionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', type: 'fixed' as 'fixed' | 'percentage', ruleValue: 0 })

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'deductions'))
    setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DeductionItem[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      ruleValue: formData.type === 'percentage' ? formData.ruleValue : undefined,
      isActive: true
    }
    if (editingId) { await updateDoc(doc(db, 'deductions', editingId), data) }
    else { await addDoc(collection(db, 'deductions'), data) }
    setShowForm(false); setEditingId(null); setFormData({ name: '', description: '', type: 'fixed', ruleValue: 0 }); fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this deduction?')) { await deleteDoc(doc(db, 'deductions', id)); fetchItems() }
  }

  const handleToggleStatus = async (item: DeductionItem) => {
    await updateDoc(doc(db, 'deductions', item.id), { isActive: !item.isActive })
    fetchItems()
  }

  const { items: sortedItems, handleSort, sortConfig } = useTableSort(items, 'name')

  if (!canView('lists', 'deductions')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Deductions</h1>
        {canAdd('lists', 'deductions') && (
          <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add Deduction</Button>
        )}
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} Deduction</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input id="name" label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'fixed' | 'percentage' })}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                <Input id="description" label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                {formData.type === 'percentage' && (
                  <Input id="ruleValue" label="Percentage (%)" type="number" value={String(formData.ruleValue)} onChange={(e) => setFormData({ ...formData, ruleValue: Number(e.target.value) })} />
                )}
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
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Name{sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : sortedItems.length === 0 ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No deductions found</td></tr>
              : sortedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.description || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      item.type === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.type === 'percentage' ? `${item.ruleValue}%` : 'Fixed'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                        item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit('lists', 'deductions') && <Button variant="ghost" size="sm" onClick={() => { setEditingId(item.id); setFormData({ name: item.name, description: item.description || '', type: item.type, ruleValue: item.ruleValue || 0 }); setShowForm(true) }}><Edit className="w-4 h-4" /></Button>}
                      {canDelete('lists', 'deductions') && <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>}
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
