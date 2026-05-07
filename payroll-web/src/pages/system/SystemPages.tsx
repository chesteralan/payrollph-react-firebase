import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, limit, writeBatch } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { SearchBar } from '../../components/ui/SearchBar'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../components/ui/Toast'
import { Plus, Edit, Trash2, Save, X, Check, Shield, ChevronUp, ChevronDown, ChevronsUpDown, Download, CheckSquare, Square, AlertTriangle, CheckCircle, Upload, AlertCircle, Calendar as CalendarIcon, Repeat } from 'lucide-react'
import type { UserAccount, UserRestriction, Department, Section, CalendarEntry, Term } from '../../types'
import type { AuditEntry } from '../../services/audit'
import { useTableSort } from '../../hooks/useTableSort'
import { useActivityMonitor } from '../../hooks/useActivityMonitor'
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
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [formData, setFormData] = useState({ date: '', name: '', type: 'holiday' as 'holiday' | 'special' | 'workday', isPaid: true })
  const [recurringFormData, setRecurringFormData] = useState({
    month: 1,
    day: 1,
    name: '',
    type: 'holiday' as 'holiday' | 'special' | 'workday',
    isPaid: true,
    years: 5,
  })

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

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchEvents() }, [selectedYear])

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

  const handleCreateRecurringHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    const { month, day, name, type, isPaid, years } = recurringFormData
    const currentYear = new Date().getFullYear()
    const batch = writeBatch(db)

    for (let i = 0; i < years; i++) {
      const year = currentYear + i
      const date = new Date(year, month - 1, day)
      const entryData = {
        date,
        name,
        type,
        isPaid,
        companyId: 'global',
        recurring: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const newDocRef = doc(collection(db, 'calendar'))
      batch.set(newDocRef, entryData)
    }

    await batch.commit()
    setShowRecurringForm(false)
    setRecurringFormData({ month: 1, day: 1, name: '', type: 'holiday', isPaid: true, years: 5 })
    fetchEvents()
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
            <>
              <Button variant="secondary" onClick={() => setShowRecurringForm(!showRecurringForm)}>
                <Repeat className="w-4 h-4 mr-2" />Recurring Holiday
              </Button>
              <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add Date</Button>
            </>
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

      {showRecurringForm && (
        <Card>
          <CardHeader><CardTitle><CalendarIcon className="w-4 h-4 mr-2 inline" />Create Recurring Holiday</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRecurringHoliday} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input id="recurringName" label="Holiday Name" value={recurringFormData.name} onChange={(e) => setRecurringFormData({ ...recurringFormData, name: e.target.value })} required />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={recurringFormData.type}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, type: e.target.value as 'holiday' | 'special' | 'workday' })}
                  >
                    <option value="holiday">Regular Holiday</option>
                    <option value="special">Special Holiday</option>
                    <option value="workday">Special Workday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={recurringFormData.month}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, month: Number(e.target.value) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={String(recurringFormData.day)}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, day: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years to Generate</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={recurringFormData.years}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, years: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 5, 10].map(y => (
                      <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={recurringFormData.isPaid}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, isPaid: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Paid Holiday</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Recurring Holiday</Button>
                <Button type="button" variant="ghost" onClick={() => setShowRecurringForm(false)}>Cancel</Button>
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
                           {event.recurring && <Repeat className="w-3 h-3 text-blue-500" />}
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
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', type: 'semi-monthly' as Term['type'], frequency: '', daysPerPeriod: 0, cutOff1: 0, cutOff2: 0 })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<string[]>([])

  const fetchTerms = async () => {
    setLoading(true)
    const snap = await getDocs(query(collection(db, 'payroll_terms'), orderBy('name')))
    setTerms(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Term[])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchTerms() }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    const newWarnings: string[] = []

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else {
      const duplicate = terms.find(t => t.name.toLowerCase() === formData.name.trim().toLowerCase() && t.id !== editingId)
      if (duplicate) newErrors.name = 'Term name must be unique'
    }

    if (formData.daysPerPeriod <= 0 || formData.daysPerPeriod > 31) {
      newErrors.daysPerPeriod = 'Days per period must be between 1 and 31'
    }

    if (formData.type === 'monthly' && (formData.daysPerPeriod < 28 || formData.daysPerPeriod > 31)) {
      newErrors.daysPerPeriod = 'Monthly terms should have 28-31 days'
    }

    if (formData.type === 'semi-monthly') {
      if (!formData.cutOff1 || formData.cutOff1 < 1 || formData.cutOff1 > 31) {
        newErrors.cutOff1 = 'First cutoff day is required (1-31)'
      }
      if (!formData.cutOff2 || formData.cutOff2 < 1 || formData.cutOff2 > 31) {
        newErrors.cutOff2 = 'Second cutoff day is required (1-31)'
      }
    }

    if ((formData.type === 'weekly' || formData.type === 'bi-weekly') && !formData.frequency.trim()) {
      newErrors.frequency = 'Frequency is required for weekly/bi-weekly terms'
    }

    const sameTypeFreq = terms.find(t =>
      t.type === formData.type &&
      t.frequency === formData.frequency &&
      t.id !== editingId
    )
    if (sameTypeFreq) {
      newWarnings.push(`A term with same type and frequency already exists: ${sameTypeFreq.name}`)
    }

    setErrors(newErrors)
    setWarnings(newWarnings)
    return Object.keys(newErrors).length === 0
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (showForm) validateForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, showForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const data: Record<string, unknown> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: formData.type,
      frequency: formData.frequency.trim(),
      daysPerPeriod: formData.daysPerPeriod,
      isActive: true
    }

    if (formData.type === 'semi-monthly') {
      data.cutOff1 = formData.cutOff1
      data.cutOff2 = formData.cutOff2
    }

    if (editingId) {
      await updateDoc(doc(db, 'payroll_terms', editingId), { ...data, updatedAt: new Date() })
    } else {
      await addDoc(collection(db, 'payroll_terms'), { ...data, createdAt: new Date(), updatedAt: new Date() })
    }
    setShowForm(false); setEditingId(null); setFormData({ name: '', description: '', type: 'semi-monthly', frequency: '', daysPerPeriod: 0, cutOff1: 0, cutOff2: 0 }); setErrors({}); setWarnings([]); fetchTerms()
  }

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'payroll_terms', id))
    setConfirmDelete(null); fetchTerms()
  }

  const handleToggleStatus = async (term: Term) => {
    await updateDoc(doc(db, 'payroll_terms', term.id), { isActive: !term.isActive, updatedAt: new Date() })
    fetchTerms()
  }

  const { items: sortedTerms, handleSort, sortConfig } = useTableSort(terms, 'name')

  const typeLabels: Record<string, string> = {
    'semi-monthly': 'Semi-monthly',
    'monthly': 'Monthly',
    'bi-weekly': 'Bi-weekly',
    'weekly': 'Weekly'
  }

  if (!canView('system', 'terms')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Terms</h1>
        {canAdd('system', 'terms') && (
          <Button onClick={() => { setEditingId(null); setFormData({ name: '', description: '', type: 'semi-monthly', frequency: '', daysPerPeriod: 0 }); setShowForm(!showForm) }}><Plus className="w-4 h-4 mr-2" />Add Term</Button>
        )}
      </div>
      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? 'Edit' : 'Add'} Term</CardTitle></CardHeader>
          <CardContent>
            {warnings.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                {warnings.map((w, i) => <p key={i} className="text-sm text-yellow-800">{w}</p>)}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input id="name" label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as Term['type'] })}>
                    <option value="semi-monthly">Semi-monthly</option>
                    <option value="monthly">Monthly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <Input id="frequency" label="Frequency" value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} />
                  {errors.frequency && <p className="text-sm text-red-600 mt-1">{errors.frequency}</p>}
                </div>
                <div>
                  <Input id="daysPerPeriod" label="Days per Period" type="number" value={String(formData.daysPerPeriod)} onChange={(e) => setFormData({ ...formData, daysPerPeriod: Number(e.target.value) })} />
                  {errors.daysPerPeriod && <p className="text-sm text-red-600 mt-1">{errors.daysPerPeriod}</p>}
                </div>
                {formData.type === 'semi-monthly' && (
                  <>
                    <div>
                      <Input id="cutOff1" label="First Cutoff Day" type="number" value={String(formData.cutOff1)} onChange={(e) => setFormData({ ...formData, cutOff1: Number(e.target.value) })} />
                      {errors.cutOff1 && <p className="text-sm text-red-600 mt-1">{errors.cutOff1}</p>}
                    </div>
                    <div>
                      <Input id="cutOff2" label="Second Cutoff Day" type="number" value={String(formData.cutOff2)} onChange={(e) => setFormData({ ...formData, cutOff2: Number(e.target.value) })} />
                      {errors.cutOff2 && <p className="text-sm text-red-600 mt-1">{errors.cutOff2}</p>}
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <Input id="description" label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={Object.keys(errors).length > 0}>{editingId ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); setErrors({}); setWarnings([]) }}>Cancel</Button>
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
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Frequency</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Days/Period</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : sortedTerms.length === 0 ? <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No terms found</td></tr>
              : sortedTerms.map((term) => (
                <tr key={term.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{term.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{typeLabels[term.type] || term.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{term.frequency || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{term.daysPerPeriod || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleStatus(term)} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full transition-colors ${term.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {term.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit('system', 'terms') && <Button variant="ghost" size="sm" onClick={() => { setEditingId(term.id); setFormData({ name: term.name, description: term.description || '', type: term.type, frequency: term.frequency, daysPerPeriod: term.daysPerPeriod, cutOff1: term.cutOff1 || 0, cutOff2: term.cutOff2 || 0 }); setShowForm(true) }}><Edit className="w-4 h-4" /></Button>}
                      {canDelete('system', 'terms') && <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(term.id)}><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </CardContent></Card>
      {confirmDelete && (
        <ConfirmDialog title="Delete Term" message="Delete this term? This cannot be undone." confirmText="Delete" onConfirm={() => handleDelete(confirmDelete)}>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}><Trash2 className="w-4 h-4" /></Button>
        </ConfirmDialog>
      )}
    </div>
  )
}

export function UsersPage() {
  const { canView, canAdd, canEdit, canDelete } = usePermissions()
  const { addToast } = useToast()
  const [users, setUsers] = useState<(UserAccount & { restrictions?: UserRestriction[] })[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ username: '', email: '', displayName: '', password: '' })
  const [editingRestrictions, setEditingRestrictions] = useState<string | null>(null)
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [csvPreview, setCsvPreview] = useState<{ email: string; firstName: string; lastName: string; role: string; department: string; section: string; isValid: boolean; error?: string }[]>([])
  const [csvFileName, setCsvFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [importStats, setImportStats] = useState<{ success: number; failed: number; duplicates: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUsers() }, [])

  const filteredUsers = useMemo(() => {
    if (searchQuery === '') return users
    const q = searchQuery.toLowerCase()
    return users.filter(u =>
      u.username.toLowerCase().includes(q) ||
      (u.displayName || '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    )
  }, [users, searchQuery])

  const { items: sortedUsers, handleSort, sortConfig } = useTableSort(filteredUsers, 'username')

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds((prev) => prev.size === sortedUsers.length ? new Set() : new Set(sortedUsers.map((u) => u.id)))
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    setImportStats(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())

      const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0

      const existingEmails = new Set(users.map(u => u.email.toLowerCase()))

      const validRoles = ['admin', 'manager', 'user']
      const validDepartments = ['payroll', 'employees', 'lists', 'reports', 'system']
      const validSections = ['payroll', 'templates', 'employees', 'calendar', 'groups', 'positions', 'areas', 'names', 'benefits', 'earnings', 'deductions', '13month', 'companies', 'terms', 'users', 'audit', 'database']

      const preview: { email: string; firstName: string; lastName: string; role: string; department: string; section: string; isValid: boolean; error?: string }[] = []
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const columns = line.split(',').map(c => c.trim())

        let email = '', firstName = '', lastName = '', role = 'user', department = '', section = ''
        let isValid = true
        let error = ''

        if (columns.length >= 3) {
          email = columns[0] || ''
          firstName = columns[1] || ''
          lastName = columns[2] || ''
          if (columns.length >= 4) role = columns[3] || 'user'
          if (columns.length >= 5) department = columns[4] || ''
          if (columns.length >= 6) section = columns[5] || ''

          if (!email || !firstName || !lastName) {
            isValid = false
            error = 'Email, firstName, and lastName required'
          } else if (!email.includes('@')) {
            isValid = false
            error = 'Invalid email format'
          } else if (existingEmails.has(email.toLowerCase())) {
            isValid = false
            error = 'Duplicate email'
          } else if (role && !validRoles.includes(role.toLowerCase())) {
            isValid = false
            error = 'Invalid role (must be admin, manager, or user)'
          } else if (department && !validDepartments.includes(department.toLowerCase() as Department)) {
            isValid = false
            error = 'Invalid department'
          } else if (section && !validSections.includes(section.toLowerCase() as Section)) {
            isValid = false
            error = 'Invalid section'
          }
        } else {
          isValid = false
          error = 'Invalid format (need at least email, firstName, lastName)'
        }

        preview.push({ email, firstName, lastName, role: role || 'user', department, section, isValid, error })
      }

      setCsvPreview(preview)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    const validRows = csvPreview.filter(row => row.isValid)
    if (validRows.length === 0) return

    setImporting(true)
    let success = 0
    let failed = 0
    let duplicates = 0

    const existingEmails = new Set(users.map(u => u.email.toLowerCase()))

    for (const row of validRows) {
      const emailLower = row.email.toLowerCase()
      if (existingEmails.has(emailLower)) {
        duplicates++
        continue
      }
      try {
        await addDoc(collection(db, 'user_accounts'), {
          email: row.email,
          username: row.email.split('@')[0],
          displayName: `${row.firstName} ${row.lastName}`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          role: row.role || 'user',
          department: row.department || '',
          section: row.section || ''
        })
        existingEmails.add(emailLower)
        success++
      } catch {
        failed++
      }
    }

    setImportStats({ success, failed, duplicates })
    setImporting(false)
    fetchUsers()
  }

  const resetImport = () => {
    setShowImport(false)
    setCsvPreview([])
    setCsvFileName('')
    setImportStats(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    setBulkLoading(true)
    try {
      const batch = writeBatch(db)
      selectedIds.forEach((id) => {
        batch.update(doc(db, 'user_accounts', id), { isActive, updatedAt: new Date() })
      })
      await batch.commit()
      addToast({ type: 'success', title: `${isActive ? 'Activated' : 'Deactivated'} ${selectedIds.size} user(s)` })
      clearSelection()
      fetchUsers()
    } catch {
      addToast({ type: 'error', title: 'Bulk status update failed' })
    }
    setBulkLoading(false)
  }

  const handleBulkDelete = async () => {
    try {
      const batch = writeBatch(db)
      selectedIds.forEach((id) => batch.delete(doc(db, 'user_accounts', id)))
      await batch.commit()
      addToast({ type: 'success', title: `Deleted ${selectedIds.size} user(s)` })
      clearSelection()
      fetchUsers()
    } catch {
      addToast({ type: 'error', title: 'Bulk delete failed' })
    }
  }

  if (!canView('system', 'users')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  const selectedCount = selectedIds.size

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Accounts</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />Import CSV
          </Button>
          {canAdd('system', 'users') && (
            <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" />Add User</Button>
          )}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="text-sm text-blue-800">{selectedCount} user{selectedCount !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-2">
            {canEdit('system', 'users') && (
              <>
                <Button size="sm" onClick={() => handleBulkStatusUpdate(true)} disabled={bulkLoading}>Activate</Button>
                <Button size="sm" variant="warning" onClick={() => handleBulkStatusUpdate(false)} disabled={bulkLoading}>Deactivate</Button>
              </>
            )}
            {canDelete('system', 'users') && (
              <ConfirmDialog
                title="Bulk Delete Users"
                message={`Delete ${selectedCount} selected user${selectedCount !== 1 ? 's' : ''}? This cannot be undone.`}
                confirmText="Delete All"
                variant="danger"
                onConfirm={handleBulkDelete}
              >
                {(open) => <Button size="sm" variant="danger" onClick={open} disabled={bulkLoading}>Delete</Button>}
              </ConfirmDialog>
            )}
            <Button size="sm" variant="ghost" onClick={clearSelection}>Clear Selection</Button>
          </div>
        </div>
      )}

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

      {showImport && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Import Users from CSV</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetImport}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!csvPreview.length && !importStats && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">Upload a CSV file with user data</p>
                <p className="text-xs text-gray-500 mb-4">
                  Format: email, firstName, lastName, role, department, section
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Select File
                </Button>
              </div>
            )}

            {csvFileName && csvPreview.length > 0 && !importStats && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    File: <span className="font-medium">{csvFileName}</span>
                    <span className="ml-2">({csvPreview.length} rows found)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-sm text-green-600">
                      {csvPreview.filter(r => r.isValid).length} valid
                    </span>
                    <span className="text-sm text-red-600">
                      {csvPreview.filter(r => !r.isValid).length} invalid
                    </span>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">#</th>
                        <th className="text-left px-3 py-2">Email</th>
                        <th className="text-left px-3 py-2">First Name</th>
                        <th className="text-left px-3 py-2">Last Name</th>
                        <th className="text-left px-3 py-2">Role</th>
                        <th className="text-left px-3 py-2">Department</th>
                        <th className="text-left px-3 py-2">Section</th>
                        <th className="text-left px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {csvPreview.map((row, index) => (
                        <tr key={index} className={row.isValid ? '' : 'bg-red-50'}>
                          <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                          <td className="px-3 py-2">{row.email}</td>
                          <td className="px-3 py-2">{row.firstName}</td>
                          <td className="px-3 py-2">{row.lastName}</td>
                          <td className="px-3 py-2">{row.role}</td>
                          <td className="px-3 py-2">{row.department}</td>
                          <td className="px-3 py-2">{row.section}</td>
                          <td className="px-3 py-2">
                            {row.isValid ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="flex items-center gap-1 text-red-600 text-xs">
                                <AlertCircle className="w-3 h-3" />{row.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={resetImport}>Cancel</Button>
                  <Button
                    onClick={handleImport}
                    disabled={importing || csvPreview.filter(r => r.isValid).length === 0}
                  >
                    {importing ? 'Importing...' : `Import ${csvPreview.filter(r => r.isValid).length} Users`}
                  </Button>
                </div>
              </div>
            )}

            {importStats && (
              <div className="text-center py-8">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Import Complete</h3>
                <p className="text-gray-600 mb-4">
                  Successfully imported <span className="font-medium text-green-600">{importStats.success}</span> users
                  {importStats.failed > 0 && (
                    <span>, <span className="font-medium text-red-600">{importStats.failed}</span> failed</span>
                  )}
                  {importStats.duplicates > 0 && (
                    <span>, <span className="font-medium text-yellow-600">{importStats.duplicates}</span> duplicates skipped</span>
                  )}
                </p>
                <Button onClick={resetImport}>Done</Button>
              </div>
            )}
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

      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search users by name, email, or role..."
            />
            <span className="text-sm text-gray-500 ml-auto">
              {sortedUsers.length} user{sortedUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
        <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">
                  <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gray-700">
                    {selectedIds.size === sortedUsers.length && sortedUsers.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
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
            {loading ? <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              : sortedUsers.length === 0 ? <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No users found</td></tr>
              : sortedUsers.map(user => (
                <tr key={user.id} className={selectedIds.has(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-4">
                    <button onClick={() => toggleSelect(user.id)} className="text-gray-500 hover:text-gray-700">
                      {selectedIds.has(user.id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
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

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs() }, [filterModule, filterUser])

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
  const { canView, canAdd } = usePermissions()
  const { addToast } = useToast()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [backups, setBackups] = useState<Array<{ id: string; timestamp: Date; collections: string[]; size: number; status: string }>>([])
  const [loading, setLoading] = useState(true)
  const [backupLoading, setBackupLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState('')
  const [selectedCollection, setSelectedCollection] = useState('')
  const [verificationResults, setVerificationResults] = useState<Array<{ name: string; status: 'Pass' | 'Fail' | 'Warning'; details: string; issueCount: number }>>([])
  const [verifying, setVerifying] = useState(false)
  const [cleanupLoading, setCleanupLoading] = useState('')
  const [cleanupResults, setCleanupResults] = useState<Array<{ name: string; count: number; time: number; success: boolean }>>([])
  const [dtrMonths, setDtrMonths] = useState(6)
  const [softDeleteDays, setSoftDeleteDays] = useState(30)
  const [archiveYears, setArchiveYears] = useState(2)

  const COLLECTIONS = [
    'names', 'employees', 'employee_groups', 'employee_positions', 'employee_areas',
    'employee_statuses', 'earnings', 'deductions', 'benefits', 'payroll',
    'payroll_templates', 'payroll_inclusive_dates', 'payroll_groups',
    'payroll_employees', 'salaries', 'dtr_entries', 'holidays', 'users', 'companies'
  ]

  const fetchStats = async () => {
    setLoading(true)
    const counts: Record<string, number> = {}
    await Promise.all(COLLECTIONS.map(async (col) => {
      try {
        const snap = await getDocs(collection(db, col))
        counts[col] = snap.size
      } catch {
        counts[col] = 0
      }
    }))
    setStats(counts)
    setLoading(false)
  }

  const fetchBackups = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'backups'), orderBy('timestamp', 'desc')))
      setBackups(snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() })) as never[])
    } catch { /* empty - backup list may not exist */ }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchStats(); fetchBackups() }, [])

  const exportCollection = async (collectionName: string) => {
    setExportLoading(collectionName)
    try {
      const snap = await getDocs(collection(db, collectionName))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${collectionName}_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      addToast({ type: 'success', title: `Exported ${collectionName}` })
    } catch (e) {
      addToast({ type: 'error', title: `Export failed: ${e}` })
    }
    setExportLoading('')
  }

  const exportAllData = async () => {
    setExportLoading('all')
    try {
      const allData: Record<string, unknown[]> = {}
      await Promise.all(COLLECTIONS.map(async (col) => {
        const snap = await getDocs(collection(db, col))
        allData[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      }))
      const json = JSON.stringify(allData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `full_backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      addToast({ type: 'success', title: 'Full export complete' })
    } catch (e) {
      addToast({ type: 'error', title: `Export failed: ${e}` })
    }
    setExportLoading('')
  }

  const createBackup = async () => {
    setBackupLoading(true)
    try {
      const allData: Record<string, unknown[]> = {}
      let totalDocs = 0
      await Promise.all(COLLECTIONS.map(async (col) => {
        const snap = await getDocs(collection(db, col))
        allData[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        totalDocs += snap.size
      }))
      const json = JSON.stringify(allData)
      const size = new Blob([json]).size
      await addDoc(collection(db, 'backups'), {
        timestamp: new Date(),
        collections: COLLECTIONS,
        totalDocuments: totalDocs,
        size,
        status: 'completed'
      })
      await exportAllData()
      fetchBackups()
      addToast({ type: 'success', title: 'Backup created' })
    } catch (e) {
      addToast({ type: 'error', title: `Backup failed: ${e}` })
    }
    setBackupLoading(false)
  }

  const runVerification = async () => {
    setVerifying(true)
    setVerificationResults([])
    const results: Array<{ name: string; status: 'Pass' | 'Fail' | 'Warning'; details: string; issueCount: number }> = []

    try {
      const [employeesSnap, namesSnap, payrollSnap, payrollEmpsSnap, payrollGroupsSnap, salariesSnap] = await Promise.all([
        getDocs(collection(db, 'employees')),
        getDocs(collection(db, 'names')),
        getDocs(collection(db, 'payroll')),
        getDocs(collection(db, 'payroll_employees')),
        getDocs(collection(db, 'payroll_groups')),
        getDocs(collection(db, 'salaries'))
      ])

      const employees = employeesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{ id: string; nameId?: string; employeeCode?: string; firstName?: string; lastName?: string }>
      const names = namesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const payroll = payrollSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      const payrollEmps = payrollEmpsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{ id: string; payrollId?: string }>
      const payrollGroups = payrollGroupsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{ id: string; payrollId?: string; groupId?: string }>
      const salaries = salariesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{ id: string; employeeId?: string }>

      const nameIds = new Set(names.map(n => n.id))

      const orphanedEmployees = employees.filter(e => e.nameId && !nameIds.has(e.nameId))
      results.push({
        name: 'Orphaned Employees',
        status: orphanedEmployees.length > 0 ? 'Fail' : 'Pass',
        details: orphanedEmployees.length > 0 ? `Employees with invalid nameId: ${orphanedEmployees.map(e => e.employeeCode || e.id).join(', ')}` : 'All employees have valid name references',
        issueCount: orphanedEmployees.length
      })

      const payrollIds = new Set(payroll.map(p => p.id))
      const orphanedPayrollEmps = payrollEmps.filter(pe => pe.payrollId && !payrollIds.has(pe.payrollId))
      results.push({
        name: 'Orphaned Payroll Employees',
        status: orphanedPayrollEmps.length > 0 ? 'Fail' : 'Pass',
        details: orphanedPayrollEmps.length > 0 ? `${orphanedPayrollEmps.length} payroll_employees with invalid payrollId` : 'All payroll_employees have valid payroll references',
        issueCount: orphanedPayrollEmps.length
      })

      const groupIds = new Set((await getDocs(collection(db, 'employee_groups'))).docs.map(d => d.id))
      const invalidGroups = payrollGroups.filter(pg => pg.groupId && !groupIds.has(pg.groupId))
      results.push({
        name: 'Invalid Payroll Group References',
        status: invalidGroups.length > 0 ? 'Warning' : 'Pass',
        details: invalidGroups.length > 0 ? `${invalidGroups.length} payroll_groups with invalid groupId` : 'All payroll_groups have valid group references',
        issueCount: invalidGroups.length
      })

      const employeeCodes = employees.map(e => e.employeeCode).filter(Boolean) as string[]
      const duplicateCodes = employeeCodes.filter((code, idx) => employeeCodes.indexOf(code) !== idx)
      const uniqueDuplicates = [...new Set(duplicateCodes)]
      results.push({
        name: 'Duplicate Employee Codes',
        status: uniqueDuplicates.length > 0 ? 'Fail' : 'Pass',
        details: uniqueDuplicates.length > 0 ? `Duplicate codes: ${uniqueDuplicates.join(', ')}` : 'No duplicate employee codes found',
        issueCount: uniqueDuplicates.length
      })

      const fullNames = employees.map(e => `${e.firstName || ''} ${e.lastName || ''}`.trim().toLowerCase()).filter(Boolean)
      const duplicateNames = fullNames.filter((name, idx) => fullNames.indexOf(name) !== idx)
      const uniqueNameDuplicates = [...new Set(duplicateNames)]
      results.push({
        name: 'Duplicate Employee Names',
        status: uniqueNameDuplicates.length > 0 ? 'Warning' : 'Pass',
        details: uniqueNameDuplicates.length > 0 ? `${uniqueNameDuplicates.length} duplicate names found` : 'No duplicate employee names found',
        issueCount: uniqueNameDuplicates.length
      })

      const missingFields = employees.filter(e => !e.firstName || !e.lastName || !e.employeeCode)
      results.push({
        name: 'Missing Required Fields (Employees)',
        status: missingFields.length > 0 ? 'Warning' : 'Pass',
        details: missingFields.length > 0 ? `${missingFields.length} employees missing required fields` : 'All employees have required fields',
        issueCount: missingFields.length
      })

      const missingSalaries = employees.filter(e => !salaries.some(s => s.employeeId === e.id))
      results.push({
        name: 'Employees Without Salary Records',
        status: missingSalaries.length > 0 ? 'Warning' : 'Pass',
        details: missingSalaries.length > 0 ? `${missingSalaries.length} employees without salary records` : 'All employees have salary records',
        issueCount: missingSalaries.length
      })

      setVerificationResults(results)
      addToast({ type: 'success', title: 'Verification complete' })
    } catch (e) {
      addToast({ type: 'error', title: `Verification failed: ${e}` })
    }
    setVerifying(false)
  }

  const runCleanup = async (operation: string) => {
    setCleanupLoading(operation)
    // eslint-disable-next-line react-hooks/purity
    const startTime = Date.now()
    let count = 0
    try {
      const batch = writeBatch(db)
      let processed = 0

      if (operation === 'orphaned') {
        const [employeesSnap, namesSnap, payrollSnap] = await Promise.all([
          getDocs(collection(db, 'employees')),
          getDocs(collection(db, 'names')),
          getDocs(collection(db, 'payroll')),
          getDocs(collection(db, 'payroll_employees'))
        ])
        const names = namesSnap.docs.map(d => d.id)
        const nameSet = new Set(names)
        const payroll = payrollSnap.docs.map(d => d.id)
        const payrollSet = new Set(payroll)

        employeesSnap.docs.forEach(d => {
          const data = d.data()
          if (data.nameId && !nameSet.has(data.nameId)) {
            batch.delete(d.ref)
            processed++
          }
        })

        const payrollEmpsSnap = await getDocs(collection(db, 'payroll_employees'))
        payrollEmpsSnap.docs.forEach(d => {
          const data = d.data()
          if (data.payrollId && !payrollSet.has(data.payrollId)) {
            batch.delete(d.ref)
            processed++
          }
        })
      } else if (operation === 'duplicates') {
        const snap = await getDocs(collection(db, 'names'))
        const names = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{ id: string; name?: string }>
        const seen = new Set<string>()
        const toDelete: string[] = []
        names.forEach(n => {
          const nameKey = (n.name || '').toLowerCase().trim()
          if (nameKey && seen.has(nameKey)) {
            toDelete.push(n.id)
          } else if (nameKey) {
            seen.add(nameKey)
          }
        })
        toDelete.forEach(id => {
          batch.delete(doc(db, 'names', id))
          processed++
        })
      } else if (operation === 'oldDtr') {
        const cutoff = new Date()
        cutoff.setMonth(cutoff.getMonth() - dtrMonths)
        const snap = await getDocs(collection(db, 'dtr_entries'))
        snap.docs.forEach(d => {
          const data = d.data()
          const entryDate = data.date?.toDate ? data.date.toDate() : new Date(data.date)
          if (entryDate < cutoff) {
            batch.delete(d.ref)
            processed++
          }
        })
      } else if (operation === 'expiredLeave') {
        const snap = await getDocs(collection(db, 'leave_applications'))
        const now = new Date()
        snap.docs.forEach(d => {
          const data = d.data()
          if (data.status === 'approved' || data.status === 'pending') {
            const endDate = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate)
            if (endDate && endDate < now) {
              batch.update(d.ref, { status: 'expired', updatedAt: new Date() })
              processed++
            }
          }
        })
      } else if (operation === 'softDeleted') {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - softDeleteDays)
        const collections = ['employees', 'names', 'earnings', 'deductions', 'benefits', 'payroll']
        await Promise.all(collections.map(async col => {
          const snap = await getDocs(collection(db, col))
          snap.docs.forEach(d => {
            const data = d.data()
            if (data.isDeleted && data.deletedAt?.toDate() < cutoff) {
              batch.delete(d.ref)
              processed++
            }
          })
        }))
      } else if (operation === 'archivePayroll') {
        const cutoffYear = new Date().getFullYear() - archiveYears
        const payrollSnap = await getDocs(collection(db, 'payroll'))
        const toArchive: string[] = []

        payrollSnap.docs.forEach(d => {
          const data = d.data()
          if (data.year && data.year < cutoffYear) {
            toArchive.push(d.id)
          }
        })

        for (const payrollId of toArchive) {
          const payrollRef = doc(db, 'payroll', payrollId)
          batch.update(payrollRef, { isArchived: true, archivedAt: new Date() })
          processed++

          const relatedCollections = [
            { col: 'payroll_employees', field: 'payrollId' },
            { col: 'payroll_employee_earnings', field: 'payrollId' },
            { col: 'payroll_employee_deductions', field: 'payrollId' },
            { col: 'payroll_employee_benefits', field: 'payrollId' },
            { col: 'payroll_employee_salaries', field: 'payrollId' },
          ]

          for (const { col, field } of relatedCollections) {
            const snap = await getDocs(query(collection(db, col), where(field, '==', payrollId)))
            snap.docs.forEach(d => {
              batch.update(d.ref, { isArchived: true, archivedAt: new Date() })
              processed++
            })
          }
        }
      }

      if (processed > 0) {
        await batch.commit()
      }
      count = processed
      // eslint-disable-next-line react-hooks/purity
      const timeTaken = Date.now() - startTime
      setCleanupResults(prev => [...prev, { name: operation, count, time: timeTaken, success: true }])
      addToast({ type: 'success', title: `Cleanup complete: ${count} records processed` })
      fetchStats()
    } catch (e) {
      // eslint-disable-next-line react-hooks/purity
      const timeTaken = Date.now() - startTime
      setCleanupResults(prev => [...prev, { name: operation, count: 0, time: timeTaken, success: false }])
      addToast({ type: 'error', title: `Cleanup failed: ${e}` })
    }
    setCleanupLoading('')
    setCleanupConfirm(null)
  }

  const totalDocuments = Object.values(stats).reduce((a, b) => a + b, 0)

  if (!canView('system', 'database')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Database Management</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportAllData} disabled={!!exportLoading}>
            <Download className="w-4 h-4 mr-2" />{exportLoading === 'all' ? 'Exporting...' : 'Export All Data'}
          </Button>
          {canAdd('system', 'database') && (
            <Button onClick={createBackup} disabled={backupLoading}>
              <Save className="w-4 h-4 mr-2" />{backupLoading ? 'Creating Backup...' : 'Create Backup'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{COLLECTIONS.length}</div>
            <div className="text-sm text-gray-500">Collections</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{loading ? '...' : totalDocuments}</div>
            <div className="text-sm text-gray-500">Total Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{backups.length}</div>
            <div className="text-sm text-gray-500">Backups Created</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Export Collection</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <select
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
            >
              <option value="">Select a collection...</option>
              {COLLECTIONS.map(c => <option key={c} value={c}>{c} ({stats[c] || 0})</option>)}
            </select>
            <Button
              variant="secondary"
              disabled={!selectedCollection || !!exportLoading}
              onClick={() => selectedCollection && exportCollection(selectedCollection)}
            >
              <Download className="w-4 h-4 mr-2" />{exportLoading ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Collection Statistics</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Collection</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Documents</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
              ) : COLLECTIONS.map(col => (
                <tr key={col} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{col}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-right">{stats[col] || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!!exportLoading}
                      onClick={() => exportCollection(col)}
                    >
                      <Download className="w-4 h-4 mr-1" />{exportLoading === col ? 'Exporting...' : 'Export'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {canView('system', 'database') && (
        <Card>
          <CardHeader><CardTitle>Backup History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Collections</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Documents</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Size</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backups.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No backups yet</td></tr>
                ) : backups.map(backup => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {backup.timestamp ? new Date(backup.timestamp).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{backup.collections?.length || 0} collections</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">{backup.totalDocuments || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">
                      {backup.size ? `${(backup.size / 1024).toFixed(1)} KB` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        backup.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {backup.status || 'unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Database Verification</CardTitle>
            <Button onClick={runVerification} disabled={verifying}>
              <CheckCircle className="w-4 h-4 mr-2" />{verifying ? 'Verifying...' : 'Run Verification'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {verificationResults.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">Click "Run Verification" to check database integrity</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Check Name</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Details</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {verificationResults.map((result, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{result.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        result.status === 'Pass' ? 'bg-green-100 text-green-800' :
                        result.status === 'Fail' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.status === 'Pass' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {result.status === 'Fail' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {result.status === 'Warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {result.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{result.details}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">{result.issueCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Cleanup</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">DTR cutoff:</span>
              <input type="number" value={dtrMonths} onChange={(e) => setDtrMonths(Number(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" min={1} max={36} />
              <span className="text-sm text-gray-500">mo</span>
              <span className="text-sm text-gray-500 ml-4">Soft-delete cutoff:</span>
              <input type="number" value={softDeleteDays} onChange={(e) => setSoftDeleteDays(Number(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" min={1} max={365} />
              <span className="text-sm text-gray-500">days</span>
              <span className="text-sm text-gray-500 ml-4">Archive cutoff:</span>
              <input type="number" value={archiveYears} onChange={(e) => setArchiveYears(Number(e.target.value))} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" min={1} max={20} />
              <span className="text-sm text-gray-500">years</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 'orphaned', name: 'Remove Orphaned Records', desc: 'Delete employees with invalid name refs and payroll_employees without valid payroll', variant: 'danger' as const },
              { id: 'duplicates', name: 'Remove Duplicate Names', desc: 'Delete duplicate names in the names collection (keeps first occurrence)', variant: 'warning' as const },
              { id: 'oldDtr', name: 'Clear Old DTR Entries', desc: `Delete DTR entries older than ${dtrMonths} months`, variant: 'warning' as const },
              { id: 'expiredLeave', name: 'Expire Old Leave Applications', desc: 'Mark approved/pending leave applications as expired if end date passed', variant: 'secondary' as const },
              { id: 'softDeleted', name: 'Purge Soft-Deleted Records', desc: `Permanently delete soft-deleted records older than ${softDeleteDays} days`, variant: 'danger' as const },
              { id: 'archivePayroll', name: 'Archive Old Payroll Runs', desc: `Mark payroll runs and related data older than ${archiveYears} years as archived`, variant: 'secondary' as const }
            ].map(op => (
              <div key={op.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">{op.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{op.desc}</p>
                </div>
                <ConfirmDialog
                  title={`Confirm: ${op.name}`}
                  message={`This operation cannot be undone. Are you sure you want to proceed?`}
                  confirmText="Run Cleanup"
                  variant={op.variant}
                  onConfirm={() => runCleanup(op.id)}
                >
                  {(open) => (
                    <Button
                      variant={op.variant === 'danger' ? 'danger' : op.variant === 'warning' ? 'warning' : 'secondary'}
                      size="sm"
                      onClick={() => open()}
                      disabled={!!cleanupLoading}
                      className="w-full"
                    >
                      {cleanupLoading === op.id ? 'Running...' : 'Run'}
                    </Button>
                  )}
                </ConfirmDialog>
              </div>
            ))}
          </div>

          {cleanupResults.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Cleanup History</h4>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Operation</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Records</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time (ms)</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cleanupResults.map((result, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{result.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">{result.count}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-right">{result.time}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {result.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function UserActivityPage() {
  const { canView } = usePermissions()
  const activity = useActivityMonitor()
  const [filter, setFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const filteredActivities = activity.activities.filter(a => {
    if (filter && !a.entityType.toLowerCase().includes(filter.toLowerCase())) return false
    if (actionFilter && a.action !== actionFilter) return false
    return true
  }).reverse()

  if (!canView('system', 'users')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  const actionTypes = [...new Set(activity.activities.map(a => a.action))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Activity Monitor</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{activity.activityCount} activities logged</span>
          {activity.lastActivity && (
            <span>Last: {activity.lastActivity.timestamp.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <input
                type="text"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="e.g. payroll, employee"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All Actions</option>
                {actionTypes.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <Button variant="ghost" size="sm" onClick={activity.clearActivities}>Clear Log</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Activity Log</CardTitle></CardHeader>
        <CardContent className="p-0">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No activities recorded this session</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Entity</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredActivities.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{a.timestamp.toLocaleTimeString()}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{a.action}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{a.entityType}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{a.entityId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
