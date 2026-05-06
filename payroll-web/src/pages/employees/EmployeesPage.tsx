import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../components/ui/Toast'
import { useTableSort } from '../../hooks/useTableSort'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Pagination } from '../../components/ui/Pagination'
import { Plus, Edit, Trash2, Eye, Search, UserCheck, UserX, ChevronUp, ChevronDown, ChevronsUpDown, CheckSquare, Square } from 'lucide-react'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TableSkeleton } from '../../components/ui/Skeleton'
import type { Employee } from '../../types'

export function EmployeesPage() {
  const { currentCompanyId } = useAuth()
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [employees, setEmployees] = useState<(Employee & { name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    employeeCode: '',
    nameId: '',
    groupId: '',
    positionId: '',
    areaId: '',
    statusId: '',
    hireDate: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkStatus, setShowBulkStatus] = useState(false)
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false)
  const [bulkStatusValue, setBulkStatusValue] = useState<'active' | 'inactive' | 'terminated'>('active')

  useEffect(() => {
    if (currentCompanyId) {
      fetchEmployees()
    }
  }, [currentCompanyId])

  const fetchEmployees = async () => {
    if (!currentCompanyId) return
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'employees'), where('companyId', '==', currentCompanyId)))
    setEmployees(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (Employee & { name?: string })[])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCompanyId) return

    const data = {
      ...formData,
      companyId: currentCompanyId,
      isActive: true,
      updatedAt: new Date()
    }

    if (editingId) {
      await updateDoc(doc(db, 'employees', editingId), data)
      addToast({ type: 'success', title: 'Employee updated', message: `${formData.employeeCode} has been updated` })
    } else {
      await addDoc(collection(db, 'employees'), { ...data, createdAt: new Date() })
      addToast({ type: 'success', title: 'Employee created', message: `${formData.employeeCode} has been added` })
    }

    setShowForm(false)
    setEditingId(null)
    setFormData({ employeeCode: '', nameId: '', groupId: '', positionId: '', areaId: '', statusId: '', hireDate: '' })
    fetchEmployees()
  }

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id)
    setFormData({
      employeeCode: employee.employeeCode,
      nameId: employee.nameId,
      groupId: employee.groupId || '',
      positionId: employee.positionId || '',
      areaId: employee.areaId || '',
      statusId: employee.statusId,
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string, code: string) => {
    await deleteDoc(doc(db, 'employees', id))
    addToast({ type: 'success', title: 'Employee deleted', message: `${code} has been removed` })
    fetchEmployees()
  }

  const handleToggleStatus = async (employee: Employee) => {
    const newStatus = !employee.isActive
    await updateDoc(doc(db, 'employees', employee.id), { isActive: newStatus, updatedAt: new Date() })
    addToast({
      type: 'info',
      title: 'Status updated',
      message: `${employee.employeeCode} is now ${newStatus ? 'active' : 'inactive'}`
    })
    fetchEmployees()
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = searchQuery === '' ||
        emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (emp.nameId?.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && emp.isActive) ||
        (statusFilter === 'inactive' && !emp.isActive)

      return matchesSearch && matchesStatus
    })
  }, [employees, searchQuery, statusFilter])

  const { items: sortedEmployees, handleSort, sortConfig } = useTableSort(
    filteredEmployees.map(emp => ({ ...emp, sortName: emp.name || emp.nameId || '' })),
    'employeeCode'
  )

  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage)
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  if (!canView('employees', 'employees')) {
    return <div className="text-center py-12 text-gray-500">Access denied</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        {canAdd('employees', 'employees') && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Employee' : 'Add Employee'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="employeeCode"
                  label="Employee Code"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  required
                />
                <Input
                  id="nameId"
                  label="Name ID"
                  value={formData.nameId}
                  onChange={(e) => setFormData({ ...formData, nameId: e.target.value })}
                  required
                />
                <Input
                  id="hireDate"
                  label="Hire Date"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
    <span className="text-sm text-gray-500 ml-auto">
      {sortedEmployees.length} employee{sortedEmployees.length !== 1 ? 's' : ''}
    </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('employeeCode')}
                >
                  <div className="flex items-center gap-1">
                    Code
                    {sortConfig?.key === 'employeeCode' ? (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    ) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('isActive')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortConfig?.key === 'isActive' ? (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    ) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </th>
                <th
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => handleSort('hireDate')}
                >
                  <div className="flex items-center gap-1">
                    Hire Date
                    {sortConfig?.key === 'hireDate' ? (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    ) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
                  </div>
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-0 py-0"><TableSkeleton rows={10} columns={4} /></td></tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No employees found</td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{emp.employeeCode}</div>
                      {emp.name && <div className="text-xs text-gray-500">{emp.name}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                          emp.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {emp.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/employees/${emp.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEdit('employees', 'employees') && (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(emp)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete('employees', 'employees') && (
                          <ConfirmDialog
                            title="Delete Employee"
                            message={`Are you sure you want to delete ${emp.employeeCode}? This action cannot be undone.`}
                            confirmText="Delete"
                            onConfirm={() => handleDelete(emp.id, emp.employeeCode)}
                          >
                            {(open) => (
                              <Button variant="ghost" size="sm" onClick={open}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </ConfirmDialog>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={sortedEmployees.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
