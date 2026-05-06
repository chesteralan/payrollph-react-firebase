import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { usePermissions } from '../../hooks/usePermissions'
import { Plus, Edit, Trash2, Save, X, Check, Shield, ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react'
import type { UserAccount, UserRestriction, Department, Section, CalendarEntry } from '../../types'
import type { AuditEntry } from '../../services/audit'
import { useTableSort } from '../../hooks/useTableSort'
import * as XLSX from 'xlsx'

interface CalendarEvent extends CalendarEntry {
  isPaid?: boolean
}

const DEPARTMENTS: { key: Department; sections: Section[] }[] = [
  { key: 'payroll', sections: ['payroll', 'templates'] },
  { key: 'employees', sections: ['employees', 'calendar', 'groups', 'positions', 'areas'] },
  { key: 'lists', sections: ['names', 'benefits', 'earnings', 'deductions'] },
  { key: 'reports', sections: ['13month'] },
  { key: 'system', sections: ['companies', 'terms', 'calendar', 'users', 'audit', 'database'] }
]

export function CalendarPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState({ date: '', name: '', type: 'holiday' as 'holiday' | 'special' | 'workday', isPaid: true })

  useEffect(() => { fetchEvents() }, [selectedYear])

  const fetchEvents = async () => {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'calendar')))
    const allEvents = snap.docs.map(d => ({ id: d.id, ...d.data() })) as CalendarEvent[]
    setEvents(allEvents.filter(e => {
      const d = new Date(e.date)
      return d.getFullYear() === selectedYear
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...formData, date: new Date(formData.date), companyId: 'global', createdAt: new Date(), updatedAt: new Date() }
    if (editingId) {
      await updateDoc(doc(db, 'calendar', editingId), data)
    } else {
      await addDoc(collection(db, 'calendar'), data)
    }
    setShowForm(false)
    setEditingId(null)
    setFormData({ date: '', name: '', type: 'holiday', isPaid: true })
    fetchEvents()
  }

  const handleEdit = (event: CalendarEvent) => {
    setEditingId(event.id)
    setFormData({
      date: new Date(event.date).toISOString().split('T')[0],
      name: event.name,
      type: event.type,
      isPaid: event.isPaid ?? true
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this calendar entry?')) {
      await deleteDoc(doc(db, 'calendar', id))
      fetchEvents()
    }
  }

  const handleExport = () => {
    const headers = ['Date', 'Name', 'Type', 'Paid']
    const csvRows = [headers.join(',')]
    for (const event of events) {
      const date = new Date(event.date).toLocaleDateString()
      const name = `"${event.name}"`
      const type = event.type
      const paid = event.isPaid ? 'Yes' : 'No'
      csvRows.push([date, name, type, paid].join(','))
    }
    const csv = csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Calendar_${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const groupedByMonth = events.reduce((acc, event) => {
    const month = new Date(event.date).getMonth()
    if (!acc[month]) acc[month] = []
    acc[month].push(event)
    return acc
  }, {} as Record<number, CalendarEvent[]>)

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const typeColors = {
    holiday: 'bg-red-100 text-red-800',
    special: 'bg-blue-100 text-blue-800',
    workday: 'bg-green-100 text-green-800'
  }

  if (!canView('system', 'calendar')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">System Calendar</h1>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          {canAdd('system', 'calendar') && (
            <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add Date</Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} Calendar Entry</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input id="date" label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                <Input id="name" label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'holiday' | 'special' | 'workday' })}
                  >
                    <option value="holiday">Regular Holiday</option>
                    <option value="special">Special Holiday</option>
                    <option value="workday">Special Workday</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isPaid}
                      onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Paid Holiday</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : events.length === 0 ? (
        <Card><CardContent className="pt-6"><p className="text-center text-gray-500 py-8">No calendar entries for {selectedYear}</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthNames.map((month, index) => {
            const monthEvents = groupedByMonth[index] || []
            if (monthEvents.length === 0) return null
            return (
              <Card key={index}>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg">{month}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {monthEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-2 border border-gray-100 rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{new Date(event.date).getDate()}</span>
                          <span className="text-sm">{event.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[event.type]}`}>
                            {event.type}
                          </span>
                          {event.isPaid && <span className="text-xs text-gray-500">Paid</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {canEdit('system', 'calendar') && (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}><Edit className="w-3 h-3" /></Button>
                        )}
                        {canDelete('system', 'calendar') && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}><Trash2 className="w-3 h-3" /></Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function TermsPage() {
  const { canView } = usePermissions()
  if (!canView('system', 'terms')) return <div className="text-center py-12 text-gray-500">Access denied</div>
  return (<div className="space-y-6"><h1 className="text-2xl font-bold text-gray-900">Terms</h1><Card><CardContent className="pt-6"><p className="text-gray-500">Manage terms and conditions.</p></CardContent></Card></div>)
}

export function UsersPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [users, setUsers] = useState<(UserAccount & { restrictions?: UserRestriction[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ username: '', email: '', displayName: '', password: '' })
  const [editingRestrictions, setEditingRestrictions] = useState<string | null>(null)
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([])

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const [usersSnap, restrictionsSnap] = await Promise.all([
      getDocs(collection(db, 'user_accounts')),
      getDocs(collection(db, 'user_accounts_restrictions'))
    ])
    const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as UserAccount[]
    const restrictionsList = restrictionsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as UserRestriction[]
    const usersWithRestrictions = usersList.map(u => ({
      ...u,
      restrictions: restrictionsList.filter(r => r.userId === u.id)
    }))
    setUsers(usersWithRestrictions)
    setLoading(false)
  }

  const { items: sortedUsers, handleSort, sortConfig } = useTableSort(users, 'username')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      username: formData.username,
      email: formData.email,
      displayName: formData.displayName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (editingId) {
      await updateDoc(doc(db, 'user_accounts', editingId), data)
    } else {
      await addDoc(collection(db, 'user_accounts'), data)
    }

    setShowForm(false)
    setEditingId(null)
    setFormData({ username: '', email: '', displayName: '', password: '' })
    fetchUsers()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this user?')) {
      await deleteDoc(doc(db, 'user_accounts', id))
      fetchUsers()
    }
  }

  const handleToggleStatus = async (user: UserAccount) => {
    await updateDoc(doc(db, 'user_accounts', user.id), { isActive: !user.isActive })
    fetchUsers()
  }

  const toggleRestriction = async (userId: string, department: Department, section: Section, action: string) => {
    const existing = restrictions.find(r => r.userId === userId && r.department === department && r.section === section)
    const currentAction = action === 'view' ? 'canView' : action === 'add' ? 'canAdd' : action === 'edit' ? 'canEdit' : 'canDelete'

    if (existing) {
      const updated = { ...existing, [currentAction]: !existing[currentAction as keyof UserRestriction] }
      await updateDoc(doc(db, 'user_accounts_restrictions', existing.id), updated)
    } else {
      await addDoc(collection(db, 'user_accounts_restrictions'), {
        userId, department, section,
        canView: action === 'view',
        canAdd: action === 'add',
        canEdit: action === 'edit',
        canDelete: action === 'delete'
      })
    }
    fetchUsers()
  }

  const startEditRestrictions = async (userId: string) => {
    setEditingRestrictions(userId)
    const snap = await getDocs(query(collection(db, 'user_accounts_restrictions'), where('userId', '==', userId)))
    setRestrictions(snap.docs.map(d => ({ id: d.id, ...d.data() })) as UserRestriction[])
  }

  if (!canView('system', 'users')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Accounts</h1>
        {canAdd('system', 'users') && (
          <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add User</Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} User</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input id="username" label="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                <Input id="email" label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                <Input id="displayName" label="Display Name" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} required />
                {!editingId && <Input id="password" label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />}
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null) }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingRestrictions && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Manage Permissions</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setEditingRestrictions(null); setRestrictions([]) }}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 sticky left-0 bg-gray-50">Department / Section</th>
                    <th className="text-center px-3 py-2">View</th>
                    <th className="text-center px-3 py-2">Add</th>
                    <th className="text-center px-3 py-2">Edit</th>
                    <th className="text-center px-3 py-2">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {DEPARTMENTS.map(dept => (
                    <>
                      <tr key={dept.key} className="bg-gray-100">
                        <td colSpan={5} className="px-3 py-2 font-semibold capitalize">{dept.key}</td>
                      </tr>
                      {dept.sections.map(section => {
                        const restriction = restrictions.find(r => r.department === dept.key && r.section === section)
                        return (
                          <tr key={`${dept.key}-${section}`} className="hover:bg-gray-50">
                            <td className="px-3 py-2 pl-6 capitalize">{section}</td>
                            {['view', 'add', 'edit', 'delete'].map(action => {
                              const actionKey = action === 'view' ? 'canView' : action === 'add' ? 'canAdd' : action === 'edit' ? 'canEdit' : 'canDelete'
                              const isChecked = restriction ? !!restriction[actionKey as keyof UserRestriction] : false
                              return (
                                <td key={action} className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => toggleRestriction(editingRestrictions, dept.key, section, action)}
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded ${
                                      isChecked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    {isChecked ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => { setEditingRestrictions(null); setRestrictions([]); fetchUsers() }}>
                <Save className="w-4 h-4 mr-2" />Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card><CardContent className="p-0">
        <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('username')}>
                  <div className="flex items-center gap-1">Username{sortConfig?.key === 'username' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('displayName')}>
                  <div className="flex items-center gap-1">Display Name{sortConfig?.key === 'displayName' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('email')}>
                  <div className="flex items-center gap-1">Email{sortConfig?.key === 'email' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('isActive')}>
                  <div className="flex items-center justify-center gap-1">Status{sortConfig?.key === 'isActive' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : sortedUsers.length === 0 ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No users found</td></tr>
              : sortedUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{user.displayName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEditRestrictions(user.id)} title="Manage Permissions">
                        <Shield className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(user)}>
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      {canEdit('system', 'users') && (
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(user.id); setFormData({ username: user.username, email: user.email, displayName: user.displayName, password: '' }); setShowForm(true) }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete('system', 'users') && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
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

export function RestrictionsPage() {
  const { canView } = usePermissions()
  if (!canView('system', 'users')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">User Restrictions</h1>
      <Card><CardContent className="pt-6">
        <p className="text-gray-500 mb-4">Use the "Manage Permissions" button (shield icon) in the User Accounts page to configure department and section permissions for each user.</p>
      </CardContent></Card>
    </div>
  )
}

export function AuditPage() {
  const { canView } = usePermissions()
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterModule, setFilterModule] = useState<string>('')
  const [filterUser, setFilterUser] = useState<string>('')

  useEffect(() => { fetchLogs() }, [filterModule, filterUser])

  const fetchLogs = async () => {
    setLoading(true)
    const q = query(collection(db, 'system_audit'), orderBy('timestamp', 'desc'), limit(200))
    const snap = await getDocs(q)
    let allLogs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as AuditEntry[]
    if (filterModule) allLogs = allLogs.filter(l => l.module === filterModule)
    if (filterUser) allLogs = allLogs.filter(l => l.userId === filterUser)
    setLogs(allLogs)
    setLoading(false)
  }

  const { items: sortedLogs, handleSort, sortConfig } = useTableSort(logs, 'timestamp')

  const handleExportCSV = () => {
    const headers = ['Date/Time', 'User', 'Action', 'Module', 'Description', 'Entity ID', 'Entity Type']
    const csvRows = [headers.join(',')]
    for (const log of sortedLogs) {
      const row = [
        log.timestamp ? new Date(log.timestamp).toLocaleString() : '',
        log.userName || log.userId,
        log.action,
        log.module,
        `"${(log.description || '').replace(/"/g, '""')}"`,
        log.entityId || '',
        log.entityType || ''
      ]
      csvRows.push(row.join(','))
    }
    const csv = csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportXLS = () => {
    const data = sortedLogs.map(log => ({
      'Date/Time': log.timestamp ? new Date(log.timestamp).toLocaleString() : '',
      'User': log.userName || log.userId,
      'Action': log.action,
      'Module': log.module,
      'Description': log.description || '',
      'Entity ID': log.entityId || '',
      'Entity Type': log.entityType || ''
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Log')
    XLSX.writeFile(wb, `audit_log_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
    login: 'bg-purple-100 text-purple-800',
    logout: 'bg-gray-100 text-gray-800',
    lock: 'bg-yellow-100 text-yellow-800',
    unlock: 'bg-orange-100 text-orange-800',
    publish: 'bg-indigo-100 text-indigo-800',
    import: 'bg-teal-100 text-teal-800',
    export: 'bg-cyan-100 text-cyan-800'
  }

  const modules = ['', 'payroll', 'employees', 'lists', 'users', 'calendar', 'system']

  if (!canView('system', 'audit')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <Button variant="secondary" onClick={handleExportXLS}>
            <Download className="w-4 h-4 mr-2" />Export XLS
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
              >
                <option value="">All Modules</option>
                {modules.filter(m => m).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <input
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Filter by user ID"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card><CardContent className="p-0">
        <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('timestamp')}>
                  <div className="flex items-center gap-1">Timestamp{sortConfig?.key === 'timestamp' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('userName')}>
                  <div className="flex items-center gap-1">User{sortConfig?.key === 'userName' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('action')}>
                  <div className="flex items-center gap-1">Action{sortConfig?.key === 'action' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('module')}>
                  <div className="flex items-center gap-1">Module{sortConfig?.key === 'module' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}</div>
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : sortedLogs.length === 0 ? <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No audit logs found</td></tr>
              : sortedLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.userName || log.userId}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm capitalize text-gray-900">{log.module}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{log.description}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  )
}

export function DatabasePage() {
  const { canView } = usePermissions()
  if (!canView('system', 'database')) return <div className="text-center py-12 text-gray-500">Access denied</div>
  return (<div className="space-y-6"><h1 className="text-2xl font-bold text-gray-900">Database</h1><Card><CardContent className="pt-6"><p className="text-gray-500">Database maintenance and backup tools.</p></CardContent></Card></div>)
}
