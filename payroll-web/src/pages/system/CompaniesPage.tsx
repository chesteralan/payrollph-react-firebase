import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../components/ui/Toast'
import { useTableSort } from '../../hooks/useTableSort'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2, RotateCcw, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import type { Company } from '../../types'

export function CompaniesPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const { addToast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '', address: '', tin: '',
    printHeader: '', printFooter: '', printCss: '',
    defaultWorkdays: 22, currency: 'PHP'
  })

  useEffect(() => { fetchCompanies() }, [])

  const fetchCompanies = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'companies'))
    setCompanies(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Company[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateDoc(doc(db, 'companies', editingId), formData)
      addToast({ type: 'success', title: 'Company updated', message: `${formData.name} has been updated` })
    } else {
      await addDoc(collection(db, 'companies'), { ...formData, isActive: true, createdAt: new Date() })
      addToast({ type: 'success', title: 'Company created', message: `${formData.name} has been added` })
    }
    setShowForm(false); setEditingId(null); setFormData({ name: '', address: '', tin: '', printHeader: '', printFooter: '', printCss: '', defaultWorkdays: 22, currency: 'PHP' }); fetchCompanies()
  }

  const handleEdit = (company: Company) => {
    setEditingId(company.id)
    setFormData({
      name: company.name,
      address: company.address || '',
      tin: company.tin || '',
      printHeader: (company as any).printHeader || '',
      printFooter: (company as any).printFooter || '',
      printCss: (company as any).printCss || '',
      defaultWorkdays: (company as any).defaultWorkdays || 22,
      currency: (company as any).currency || 'PHP'
    })
    setShowForm(true)
  }

  const handleToggleStatus = async (company: Company) => {
    const newStatus = !company.isActive
    await updateDoc(doc(db, 'companies', company.id), { isActive: newStatus })
    addToast({
      type: 'info',
      title: 'Status updated',
      message: `${company.name} is now ${newStatus ? 'active' : 'inactive'}`
    })
    fetchCompanies()
  }

  const handleSoftDelete = async (company: Company) => {
    await updateDoc(doc(db, 'companies', company.id), { isDeleted: true, isActive: false, deletedAt: new Date() })
    addToast({ type: 'success', title: 'Company archived', message: `${company.name} has been archived` })
    fetchCompanies()
  }

  const handleRestore = async (company: Company) => {
    await updateDoc(doc(db, 'companies', company.id), { isDeleted: false, isActive: true, deletedAt: null })
    addToast({ type: 'success', title: 'Company restored', message: `${company.name} has been restored` })
    fetchCompanies()
  }

  const handlePermanentDelete = async (id: string) => {
    await deleteDoc(doc(db, 'companies', id))
    addToast({ type: 'success', title: 'Company permanently deleted' })
    fetchCompanies()
  }

  const preFiltered = companies.filter(c => {
    const matchesSearch = searchQuery === '' || c.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDeleted = showDeleted ? c.isDeleted : !c.isDeleted
    return matchesSearch && matchesDeleted
  })

  const { items: sortedCompanies, handleSort, sortConfig } = useTableSort(preFiltered, 'name')

  if (!canView('system', 'companies')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowDeleted(!showDeleted)}>
            {showDeleted ? 'Show Active' : 'Show Archived'}
          </Button>
          {canAdd('system', 'companies') && (
            <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add Company</Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} Company</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input id="name" label="Company Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <Input id="tin" label="TIN" value={formData.tin} onChange={(e) => setFormData({ ...formData, tin: e.target.value })} />
                <Input id="address" label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                <Input id="defaultWorkdays" label="Default Workdays/Month" type="number" value={String(formData.defaultWorkdays)} onChange={(e) => setFormData({ ...formData, defaultWorkdays: Number(e.target.value) })} />
                <Input id="printHeader" label="Print Header" value={formData.printHeader} onChange={(e) => setFormData({ ...formData, printHeader: e.target.value })} placeholder="Company header for prints" />
                <Input id="printFooter" label="Print Footer" value={formData.printFooter} onChange={(e) => setFormData({ ...formData, printFooter: e.target.value })} placeholder="Company footer for prints" />
              </div>
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
            <input
              type="text"
              placeholder="Search companies..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">Name{sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('address')}>
                  <div className="flex items-center gap-1">Address{sortConfig?.key === 'address' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('tin')}>
                  <div className="flex items-center gap-1">TIN{sortConfig?.key === 'tin' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Workdays</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('isActive')}>
                  <div className="flex items-center gap-1">Status{sortConfig?.key === 'isActive' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                : sortedCompanies.length === 0 ? <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No companies found</td></tr>
                : sortedCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.address || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.tin || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{(c as any).defaultWorkdays || 22}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        c.isDeleted ? 'bg-red-100 text-red-800' : c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {c.isDeleted ? 'Archived' : c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.isDeleted ? (
                          <>
                            <ConfirmDialog
                              title="Restore Company"
                              message={`Restore ${c.name}? It will be marked as active again.`}
                              confirmText="Restore"
                              variant="info"
                              onConfirm={() => handleRestore(c)}
                            >
                              {(open) => (
                                <Button variant="ghost" size="sm" onClick={open} title="Restore">
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              )}
                            </ConfirmDialog>
                            {canDelete('system', 'companies') && (
                              <ConfirmDialog
                                title="Permanently Delete Company"
                                message={`Permanently delete ${c.name}? This action cannot be undone and all associated data will be lost.`}
                                confirmText="Delete Permanently"
                                onConfirm={() => handlePermanentDelete(c.id)}
                              >
                                {(open) => (
                                  <Button variant="ghost" size="sm" onClick={open} title="Permanent delete">
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                )}
                              </ConfirmDialog>
                            )}
                          </>
                        ) : (
                          <>
                            {canEdit('system', 'companies') && <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}><Edit className="w-4 h-4" /></Button>}
                            <ConfirmDialog
                              title={c.isActive ? 'Deactivate Company' : 'Activate Company'}
                              message={`${c.isActive ? 'Deactivate' : 'Activate'} ${c.name}?`}
                              confirmText={c.isActive ? 'Deactivate' : 'Activate'}
                              variant={c.isActive ? 'warning' : 'info'}
                              onConfirm={() => handleToggleStatus(c)}
                            >
                              {(open) => (
                                <Button variant="ghost" size="sm" onClick={open}>
                                  {c.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                              )}
                            </ConfirmDialog>
                            {canDelete('system', 'companies') && (
                              <ConfirmDialog
                                title="Archive Company"
                                message={`Archive ${c.name}? It can be restored later.`}
                                confirmText="Archive"
                                variant="warning"
                                onConfirm={() => handleSoftDelete(c)}
                              >
                                {(open) => (
                                  <Button variant="ghost" size="sm" onClick={open} title="Archive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </ConfirmDialog>
                            )}
                          </>
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
