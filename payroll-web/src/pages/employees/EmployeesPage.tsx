import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import type { Employee } from '../../types'

export function EmployeesPage() {
  const { currentCompanyId } = useAuth()
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const navigate = useNavigate()
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
    }

    if (editingId) {
      await updateDoc(doc(db, 'employees', editingId), data)
    } else {
      await addDoc(collection(db, 'employees'), data)
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

  const handleDelete = async (id: string) => {
    if (confirm('Delete this employee?')) {
      await deleteDoc(doc(db, 'employees', id))
      fetchEmployees()
    }
  }

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
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Hire Date</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{emp.employeeCode}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          emp.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
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
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(emp.id)}>
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
