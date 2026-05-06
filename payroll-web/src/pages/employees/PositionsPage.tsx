import { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { useTableSort } from '../../hooks/useTableSort'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import type { EmployeePosition } from '../../types'

export function PositionsPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [positions, setPositions] = useState<EmployeePosition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', department: '' })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { fetchPositions() }, [])

  const fetchPositions = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'employee_positions'))
    setPositions(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as EmployeePosition[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) { await updateDoc(doc(db, 'employee_positions', editingId), formData) }
    else { await addDoc(collection(db, 'employee_positions'), { ...formData, isActive: true }) }
    setShowForm(false); setEditingId(null); setFormData({ name: '', department: '' }); fetchPositions()
  }

  const handleDelete = async (id: string, name: string) => {
    await deleteDoc(doc(db, 'employee_positions', id))
    fetchPositions()
  }

  const handleToggleStatus = async (position: EmployeePosition) => {
    await updateDoc(doc(db, 'employee_positions', position.id), { isActive: !position.isActive })
    fetchPositions()
  }

  const filteredPositions = useMemo(() => {
    if (!searchQuery) return positions
    const q = searchQuery.toLowerCase()
    return positions.filter(p => p.name.toLowerCase().includes(q) || (p.department || '').toLowerCase().includes(q))
  }, [positions, searchQuery])

  const { items: sortedPositions, handleSort, sortConfig } = useTableSort(filteredPositions, 'name')

  if (!canView('employees', 'positions')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Positions</h1>
        {canAdd('employees', 'positions') && (<Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add Position</Button>)}
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
      <Card>
        <CardContent className="pt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search positions..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardContent>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">Name{sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('department')}>
                  <div className="flex items-center gap-1">Department{sortConfig?.key === 'department' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('isActive')}>
                  <div className="flex items-center gap-1">Status{sortConfig?.key === 'isActive' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                : sortedPositions.length === 0 ? <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No positions found</td></tr>
                : sortedPositions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.department || '-'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleStatus(p)} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full transition-colors ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit('employees', 'positions') && <Button variant="ghost" size="sm" onClick={() => { setEditingId(p.id); setFormData({ name: p.name, department: p.department || '' }); setShowForm(true) }}><Edit className="w-4 h-4" /></Button>}
                        {canDelete('employees', 'positions') && (
                          <ConfirmDialog title="Delete Position" message={`Delete "${p.name}"? This cannot be undone.`} confirmText="Delete" onConfirm={() => handleDelete(p.id, p.name)}>
                            {(open) => <Button variant="ghost" size="sm" onClick={open}><Trash2 className="w-4 h-4" /></Button>}
                          </ConfirmDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
