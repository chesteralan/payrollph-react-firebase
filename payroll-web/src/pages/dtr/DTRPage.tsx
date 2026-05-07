import { useState, useEffect, useMemo, useRef } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../components/ui/Toast'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { SearchBar } from '../../components/ui/SearchBar'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  ChevronLeft, ChevronRight, Calendar, Clock, Timer, AlertCircle,
  Trash2, X, Check, Plus, Filter, Download, Upload,
  BarChart3, Table
} from 'lucide-react'
import type { Employee, NameRecord, DTREntry, LeaveApplication, LeaveBalance } from '../../types'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function calcHours(timeIn: string, timeOut: string): number {
  if (!timeIn || !timeOut) return 0
  const [h1, m1] = timeIn.split(':').map(Number)
  const [h2, m2] = timeOut.split(':').map(Number)
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function DTRPage() {
  const { canView, canEdit, canDelete } = usePermissions()
  const { addToast } = useToast()

  const [employees, setEmployees] = useState<(Employee & { name?: string })[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [dtrEntries, setDtrEntries] = useState<DTREntry[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([])
  const [benefits, setBenefits] = useState<{ id: string; name: string }[]>([])
  const [showDayModal, setShowDayModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [dayForm, setDayForm] = useState({ timeIn: '', timeOut: '', overtimeHours: 0, lateHours: 0, absenceType: '' as DTREntry['absenceType'], absenceReason: '', notes: '' })

  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ benefitId: '', startDate: '', endDate: '', reason: '' })

  const [viewMode, setViewMode] = useState<'calendar' | 'summary'>('calendar')
  const [dtrSearchQuery, setDtrSearchQuery] = useState('')
  const [allMonthEntries, setAllMonthEntries] = useState<(DTREntry & { employeeName?: string; employeeCode?: string })[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [importPreview, setImportPreview] = useState<Partial<DTREntry>[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchEmployees = async () => {
    const [empSnap, nameSnap] = await Promise.all([
      getDocs(query(collection(db, 'employees'), where('isActive', '==', true))),
      getDocs(collection(db, 'names'))
    ])
    const namesMap = new Map<string, string>()
    nameSnap.docs.forEach(d => {
      const n = d.data() as NameRecord
      namesMap.set(d.id, `${n.firstName} ${n.middleName || ''} ${n.lastName} ${n.suffix || ''}`.trim())
    })
    const list = empSnap.docs.map(d => {
      const emp = d.data() as Employee
      return { ...emp, id: d.id, name: namesMap.get(emp.nameId) || emp.employeeCode }
    })
    setEmployees(list)
    if (list.length > 0) setSelectedEmployeeId(list[0].id)
  }

  const fetchDTRData = async () => {
    const start = dateStr(selectedYear, selectedMonth, 1)
    const end = dateStr(selectedYear, selectedMonth, daysInMonth(selectedYear, selectedMonth))
    const snap = await getDocs(query(collection(db, 'dtr_entries'), where('employeeId', '==', selectedEmployeeId)))
    const entries = snap.docs.map(d => ({ id: d.id, ...d.data() })) as DTREntry[]
    setDtrEntries(entries.filter(e => e.date >= start && e.date <= end))
  }

  const fetchLeaveData = async () => {
    const [balSnap, appSnap, benSnap] = await Promise.all([
      getDocs(query(collection(db, 'leave_balances'), where('employeeId', '==', selectedEmployeeId), where('year', '==', selectedYear))),
      getDocs(query(collection(db, 'leave_applications'), where('employeeId', '==', selectedEmployeeId))),
      getDocs(query(collection(db, 'benefits')))
    ])
    setLeaveBalances(balSnap.docs.map(d => ({ id: d.id, ...d.data() })) as LeaveBalance[])
    setLeaveApplications(appSnap.docs.map(d => ({ id: d.id, ...d.data() })) as LeaveApplication[])
    setBenefits(benSnap.docs.map(d => ({ id: d.id, name: (d.data() as { name: string }).name })).filter(b => b.name.toLowerCase().includes('leave')))
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchEmployees() }, [])

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (selectedEmployeeId) {
      fetchDTRData()
      fetchLeaveData()
    }
  }, [selectedEmployeeId, selectedMonth, selectedYear])
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const fetchAllMonthEntries = async () => {
    const start = dateStr(selectedYear, selectedMonth, 1)
    const end = dateStr(selectedYear, selectedMonth, daysInMonth(selectedYear, selectedMonth))
    const snap = await getDocs(collection(db, 'dtr_entries'))
    const namesMap = new Map<string, string>()
    const codesMap = new Map<string, string>()
    employees.forEach(e => { namesMap.set(e.id, e.name || ''); codesMap.set(e.id, e.employeeCode) })
    const allEntries = snap.docs.map(d => {
      const entry = { id: d.id, ...d.data() } as DTREntry
      return { ...entry, employeeName: namesMap.get(entry.employeeId) || '', employeeCode: codesMap.get(entry.employeeId) || '' }
    }).filter(e => e.date >= start && e.date <= end).sort((a, b) => a.date.localeCompare(b.date))
    setAllMonthEntries(allEntries)
  }

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (viewMode === 'summary' && employees.length > 0) fetchAllMonthEntries()
  }, [viewMode, selectedMonth, selectedYear, employees])
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const filteredMonthEntries = useMemo(() => {
    if (dtrSearchQuery === '') return allMonthEntries
    const q = dtrSearchQuery.toLowerCase()
    return allMonthEntries.filter(e =>
      (e.employeeName || '').toLowerCase().includes(q) ||
      (e.employeeCode || '').toLowerCase().includes(q) ||
      e.date.includes(q)
    )
  }, [allMonthEntries, dtrSearchQuery])

  const entryMap = useMemo(() => {
    const map = new Map<string, DTREntry>()
    dtrEntries.forEach(e => map.set(e.date, e))
    return map
  }, [dtrEntries])

  const stats = useMemo(() => {
    let daysWorked = 0, totalHours = 0, totalOvertime = 0, totalLate = 0, totalAbsences = 0
    dtrEntries.forEach(e => {
      if (e.hoursWorked > 0) { daysWorked++; totalHours += e.hoursWorked }
      totalOvertime += e.overtimeHours || 0
      totalLate += e.lateHours || 0
      if (e.absenceType) totalAbsences++
    })
    return { daysWorked, totalHours: Math.round(totalHours * 100) / 100, totalOvertime: Math.round(totalOvertime * 100) / 100, totalLate: Math.round(totalLate * 100) / 100, totalAbsences }
  }, [dtrEntries])

  const handlePrevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }

  const handleNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  const openDayModal = (day: number) => {
    setSelectedDay(day)
    const ds = dateStr(selectedYear, selectedMonth, day)
    const existing = entryMap.get(ds)
    if (existing) {
      setDayForm({ timeIn: existing.timeIn || '', timeOut: existing.timeOut || '', overtimeHours: existing.overtimeHours || 0, lateHours: existing.lateHours || 0, absenceType: existing.absenceType || '', absenceReason: existing.absenceReason || '', notes: existing.notes || '' })
    } else {
      setDayForm({ timeIn: '', timeOut: '', overtimeHours: 0, lateHours: 0, absenceType: '', absenceReason: '', notes: '' })
    }
    setShowDayModal(true)
  }

  const saveDayEntry = async () => {
    if (!selectedDay || !selectedEmployeeId) return
    const ds = dateStr(selectedYear, selectedMonth, selectedDay)
    const ti = dayForm.timeIn || undefined
    const to = dayForm.timeOut || undefined
    const hw = ti && to ? calcHours(ti, to) : 0
    const at = dayForm.absenceType || undefined
    const ar = dayForm.absenceReason || undefined
    const nt = dayForm.notes || undefined
    const data = { employeeId: selectedEmployeeId, date: ds, timeIn: ti, timeOut: to, hoursWorked: hw, overtimeHours: dayForm.overtimeHours, lateHours: dayForm.lateHours, absenceType: at, absenceReason: ar, notes: nt, updatedAt: new Date() }

    const existing = entryMap.get(ds)
    if (existing) {
      await updateDoc(doc(db, 'dtr_entries', existing.id), data)
      addToast({ type: 'success', title: 'Entry updated' })
    } else {
      await addDoc(collection(db, 'dtr_entries'), { ...data, createdAt: new Date() })
      addToast({ type: 'success', title: 'Entry created' })
    }
    setShowDayModal(false)
    fetchDTRData()
  }

  const deleteDayEntry = async () => {
    if (!selectedDay) return
    const ds = dateStr(selectedYear, selectedMonth, selectedDay)
    const existing = entryMap.get(ds)
    if (existing) {
      await deleteDoc(doc(db, 'dtr_entries', existing.id))
      addToast({ type: 'success', title: 'Entry deleted' })
      setShowDayModal(false)
      fetchDTRData()
    }
  }

  const applyLeave = async () => {
    if (!leaveForm.benefitId || !leaveForm.startDate || !leaveForm.endDate) return
    const start = new Date(leaveForm.startDate)
    const end = new Date(leaveForm.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    if (days <= 0) { addToast({ type: 'error', title: 'Invalid date range' }); return }

    const bal = leaveBalances.find(b => b.benefitId === leaveForm.benefitId)
    if (bal && bal.remaining < days) { addToast({ type: 'error', title: 'Insufficient leave balance', message: `Available: ${bal.remaining} days` }); return }

    await addDoc(collection(db, 'leave_applications'), {
      employeeId: selectedEmployeeId, benefitId: leaveForm.benefitId,
      startDate: leaveForm.startDate, endDate: leaveForm.endDate, days,
      reason: leaveForm.reason, status: 'pending', createdAt: new Date()
    })
    addToast({ type: 'success', title: 'Leave application submitted' })
    setShowLeaveModal(false)
    setLeaveForm({ benefitId: '', startDate: '', endDate: '', reason: '' })
    fetchLeaveData()
  }

  const approveLeave = async (app: LeaveApplication) => {
    await updateDoc(doc(db, 'leave_applications', app.id), { status: 'approved' })
    const bal = leaveBalances.find(b => b.benefitId === app.benefitId)
    if (bal) {
      await updateDoc(doc(db, 'leave_balances', bal.id), { used: bal.used + app.days, remaining: bal.remaining - app.days })
    }
    addToast({ type: 'success', title: 'Leave approved' })
    fetchLeaveData()
  }

  const rejectLeave = async (app: LeaveApplication) => {
    await updateDoc(doc(db, 'leave_applications', app.id), { status: 'rejected' })
    addToast({ type: 'info', title: 'Leave rejected' })
    fetchLeaveData()
  }

  const handleExport = () => {
    const headers = ['Employee', 'Code', 'Date', 'Time In', 'Time Out', 'Hours Worked', 'Overtime', 'Late', 'Absence Type', 'Reason', 'Notes']
    const rows = allMonthEntries.map(e => [
      e.employeeName || '', e.employeeCode || '', e.date, e.timeIn || '', e.timeOut || '',
      e.hoursWorked, e.overtimeHours, e.lateHours, e.absenceType || '', e.absenceReason || '', e.notes || ''
    ])
    if (selectedEmployeeId) {
      const emp = employees.find(e => e.id === selectedEmployeeId)
      const empEntries = dtrEntries.map(e => [
        emp?.name || '', emp?.employeeCode || '', e.date, e.timeIn || '', e.timeOut || '',
        e.hoursWorked, e.overtimeHours, e.lateHours, e.absenceType || '', e.absenceReason || '', e.notes || ''
      ])
      rows.length = 0
      rows.push(...empEntries)
    }
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DTR_${MONTH_NAMES[selectedMonth]}_${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'DTR exported' })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) { addToast({ type: 'error', title: 'Empty file' }); return }
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const preview: Partial<DTREntry>[] = []
    const errors: string[] = []
    const nameToId = new Map<string, string>()
    employees.forEach(emp => nameToId.set((emp.name || '').toLowerCase(), emp.id))
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      if (values.length < 3) { errors.push(`Line ${i + 1}: Too few columns`); continue }
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => { row[h] = values[idx] || '' })
      const empName = (row['Employee'] || '').toLowerCase()
      const employeeId = nameToId.get(empName) || employees.find(e => e.employeeCode === row['Code'])?.id
      if (!employeeId) { errors.push(`Line ${i + 1}: Employee "${row['Employee']}" not found`); continue }
      if (!row['Date'] || !/^\d{4}-\d{2}-\d{2}$/.test(row['Date'])) { errors.push(`Line ${i + 1}: Invalid date "${row['Date']}"`); continue }
      const ti = row['Time In'] || undefined
      const to = row['Time Out'] || undefined
      const hw = ti && to ? calcHours(ti, to) : 0
      preview.push({
        employeeId, date: row['Date'], timeIn: ti, timeOut: to,
        hoursWorked: hw, overtimeHours: Number(row['Overtime'] || 0), lateHours: Number(row['Late'] || 0),
        absenceType: (row['Absence Type'] || undefined) as DTREntry['absenceType'],
        absenceReason: row['Reason'] || undefined, notes: row['Notes'] || undefined
      })
    }
    setImportPreview(preview)
    setImportErrors(errors)
    setShowImportModal(true)
  }

  const handleImport = async () => {
    let success = 0
    for (const entry of importPreview) {
      if (!entry.employeeId || !entry.date) continue
      const existing = await getDocs(query(collection(db, 'dtr_entries'), where('employeeId', '==', entry.employeeId), where('date', '==', entry.date)))
      if (!existing.empty) {
        await updateDoc(doc(db, 'dtr_entries', existing.docs[0].id), { ...entry, updatedAt: new Date() })
      } else {
        await addDoc(collection(db, 'dtr_entries'), { ...entry, createdAt: new Date(), updatedAt: new Date() })
      }
      success++
    }
    setShowImportModal(false)
    setImportPreview([])
    setImportErrors([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    fetchDTRData()
    fetchAllMonthEntries()
    addToast({ type: 'success', title: `Imported ${success} entries` })
  }

  const dayStatus = (day: number) => {
    const ds = dateStr(selectedYear, selectedMonth, day)
    const entry = entryMap.get(ds)
    if (!entry) return 'none'
    if (entry.absenceType) return 'absent'
    if (entry.timeIn && entry.timeOut) return 'complete'
    if (entry.timeIn || entry.timeOut) return 'partial'
    return 'none'
  }

  const statusColors: Record<string, string> = {
    complete: 'bg-green-100 text-green-700 border-green-200',
    partial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    absent: 'bg-red-100 text-red-700 border-red-200',
    none: 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
  }

  const leaveStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  }

  const today = new Date()
  const dim = daysInMonth(selectedYear, selectedMonth)
  const fdm = firstDayOfMonth(selectedYear, selectedMonth)

  if (!canView('employees', 'calendar')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Daily Time Record</h1>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileSelect} />
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="w-4 h-4 mr-2" />Import</Button>
          <Button variant="secondary" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select className="px-3 py-2 border border-gray-300 rounded-md text-sm" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                <option value="">Select Employee</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm font-medium min-w-[140px] text-center">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
              <Button variant="ghost" size="sm" onClick={handleNextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="flex border rounded-md overflow-hidden">
              <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 text-sm flex items-center gap-1 ${viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}><Calendar className="w-3 h-3" />Calendar</button>
              <button onClick={() => setViewMode('summary')} className={`px-3 py-1.5 text-sm flex items-center gap-1 ${viewMode === 'summary' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}><Table className="w-3 h-3" />Summary</button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'calendar' && selectedEmployeeId && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Calendar className="w-8 h-8 text-blue-500" /><div><p className="text-xs text-gray-500">Days Worked</p><p className="text-xl font-bold">{stats.daysWorked}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-green-500" /><div><p className="text-xs text-gray-500">Total Hours</p><p className="text-xl font-bold">{stats.totalHours}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Timer className="w-8 h-8 text-purple-500" /><div><p className="text-xs text-gray-500">Overtime</p><p className="text-xl font-bold">{stats.totalOvertime}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><AlertCircle className="w-8 h-8 text-orange-500" /><div><p className="text-xs text-gray-500">Late Hours</p><p className="text-xl font-bold">{stats.totalLate}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><X className="w-8 h-8 text-red-500" /><div><p className="text-xs text-gray-500">Absences</p><p className="text-xl font-bold">{stats.totalAbsences}</p></div></div></CardContent></Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1">
                {DAY_NAMES.map(d => <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>)}
                {Array.from({ length: fdm }, (_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: dim }, (_, i) => i + 1).map(day => {
                  const status = dayStatus(day)
                  const entry = entryMap.get(dateStr(selectedYear, selectedMonth, day))
                  const isToday = day === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear()
                  return (
                    <button key={day} onClick={() => openDayModal(day)} className={`relative border rounded-lg p-2 text-left transition-colors ${statusColors[status]} ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                      <span className="text-sm font-medium">{day}</span>
                      {entry && (
                        <div className="mt-1">
                          {entry.timeIn && entry.timeOut && <span className="text-[10px] block">{entry.timeIn}-{entry.timeOut}</span>}
                          {entry.overtimeHours > 0 && <span className="text-[10px] block text-purple-600">OT: {entry.overtimeHours}h</span>}
                          {entry.absenceType && <span className="text-[10px] block capitalize">{entry.absenceType}</span>}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Leave Management</CardTitle>
                <Button size="sm" onClick={() => setShowLeaveModal(true)}><Plus className="w-4 h-4 mr-2" />Apply Leave</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Leave Balances ({selectedYear})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {leaveBalances.length === 0 && <p className="text-sm text-gray-500 col-span-4">No leave benefits configured</p>}
                    {leaveBalances.map(bal => {
                      const benefit = benefits.find(b => b.id === bal.benefitId)
                      return (
                        <div key={bal.id} className="p-3 border rounded-lg">
                          <p className="text-sm font-medium">{benefit?.name || 'Leave'}</p>
                          <div className="flex justify-between mt-2 text-xs">
                            <span className="text-gray-500">Allowance: {bal.totalAllowance}</span>
                            <span className="text-gray-500">Used: {bal.used}</span>
                          </div>
                          <div className="mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${bal.totalAllowance > 0 ? (bal.used / bal.totalAllowance) * 100 : 0}%` }} />
                            </div>
                          </div>
                          <p className="text-xs text-right mt-1 font-medium">{bal.remaining} remaining</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Leave Applications</h3>
                  <div className="space-y-2">
                    {leaveApplications.length === 0 && <p className="text-sm text-gray-500">No leave applications</p>}
                    {leaveApplications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(app => (
                      <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${leaveStatusColors[app.status]}`}>{app.status}</span>
                            <span className="text-sm font-medium">{benefits.find(b => b.id === app.benefitId)?.name || 'Leave'}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{app.startDate} to {app.endDate} ({app.days} days)</p>
                          {app.reason && <p className="text-xs text-gray-500">{app.reason}</p>}
                        </div>
                        {canEdit('employees', 'calendar') && app.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => approveLeave(app)}><Check className="w-4 h-4 text-green-600" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => rejectLeave(app)}><X className="w-4 h-4 text-red-600" /></Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {viewMode === 'summary' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />DTR Summary - {MONTH_NAMES[selectedMonth]} {selectedYear}</CardTitle>
            </div>
          </CardHeader>
          <CardHeader className="py-3">
            <div className="flex items-center gap-4">
              <SearchBar
                value={dtrSearchQuery}
                onChange={setDtrSearchQuery}
                placeholder="Search by employee name or code..."
              />
              <span className="text-sm text-gray-500 ml-auto">
                {filteredMonthEntries.length} entr{filteredMonthEntries.length !== 1 ? 'ies' : 'y'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time In</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time Out</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">OT</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Late</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMonthEntries.length === 0 ? <tr><td colSpan={9} className="px-6 py-4 text-center text-gray-500">No entries for this period</td></tr>
                  : filteredMonthEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.employeeName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.employeeCode || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{entry.date}</td>
                      <td className="px-4 py-3 text-sm text-center">{entry.timeIn || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">{entry.timeOut || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right">{entry.hoursWorked || 0}</td>
                      <td className="px-4 py-3 text-sm text-right">{entry.overtimeHours || 0}</td>
                      <td className="px-4 py-3 text-sm text-right">{entry.lateHours || 0}</td>
                      <td className="px-4 py-3">
                        {entry.absenceType ? <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 capitalize">{entry.absenceType}</span>
                          : entry.timeIn && entry.timeOut ? <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Present</span>
                          : <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Incomplete</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {showDayModal && selectedDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDayModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {MONTH_NAMES[selectedMonth]} {selectedDay}, {selectedYear}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDayModal(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input id="timeIn" label="Time In" type="time" value={dayForm.timeIn} onChange={(e) => setDayForm({ ...dayForm, timeIn: e.target.value })} />
                <Input id="timeOut" label="Time Out" type="time" value={dayForm.timeOut} onChange={(e) => setDayForm({ ...dayForm, timeOut: e.target.value })} />
              </div>
              {dayForm.timeIn && dayForm.timeOut && (
                <p className="text-sm text-gray-600">Hours Worked: <span className="font-medium">{calcHours(dayForm.timeIn, dayForm.timeOut)}</span></p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input id="lateHours" label="Late Hours" type="number" step="0.5" min="0" value={dayForm.lateHours} onChange={(e) => setDayForm({ ...dayForm, lateHours: Number(e.target.value) })} />
                <Input id="overtimeHours" label="Overtime Hours" type="number" step="0.5" min="0" value={dayForm.overtimeHours} onChange={(e) => setDayForm({ ...dayForm, overtimeHours: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Absence Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" value={dayForm.absenceType} onChange={(e) => setDayForm({ ...dayForm, absenceType: e.target.value as DTREntry['absenceType'] })}>
                  <option value="">None</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="undertime">Undertime</option>
                  <option value="sick">Sick Leave</option>
                  <option value="vacation">Vacation Leave</option>
                </select>
              </div>
              {dayForm.absenceType && <Input id="absenceReason" label="Absence Reason" value={dayForm.absenceReason} onChange={(e) => setDayForm({ ...dayForm, absenceReason: e.target.value })} />}
              <Input id="notes" label="Notes" value={dayForm.notes} onChange={(e) => setDayForm({ ...dayForm, notes: e.target.value })} />
              <div className="flex items-center justify-between pt-2">
                {canDelete('employees', 'calendar') && entryMap.get(dateStr(selectedYear, selectedMonth, selectedDay)) && (
                  <ConfirmDialog title="Delete Entry" message="Delete this DTR entry?" confirmText="Delete" onConfirm={deleteDayEntry}>
                    {(open) => <Button variant="ghost" size="sm" onClick={open}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>}
                  </ConfirmDialog>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button variant="ghost" onClick={() => setShowDayModal(false)}>Cancel</Button>
                  <Button onClick={saveDayEntry}>Save</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowLeaveModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Apply for Leave</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowLeaveModal(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" value={leaveForm.benefitId} onChange={(e) => setLeaveForm({ ...leaveForm, benefitId: e.target.value })}>
                  <option value="">Select leave type</option>
                  {benefits.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input id="startDate" label="Start Date" type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
                <Input id="endDate" label="End Date" type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} />
              </div>
              {leaveForm.startDate && leaveForm.endDate && (
                <p className="text-sm text-gray-600">Total Days: <span className="font-medium">{Math.ceil((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}</span></p>
              )}
              <Input id="reason" label="Reason" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
                <Button onClick={applyLeave}>Submit Application</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowImportModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Import DTR Entries</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowImportModal(false)}><X className="w-4 h-4" /></Button>
            </div>
            {importErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">{importErrors.length} error(s) found:</p>
                <ul className="text-xs text-red-700 space-y-0.5">{importErrors.map((err, i) => <li key={i}>{err}</li>)}</ul>
              </div>
            )}
            {importPreview.length > 0 && (
              <>
                <p className="text-sm text-gray-600 mb-2">{importPreview.length} entries ready to import</p>
                <div className="overflow-x-auto border rounded-lg mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2">Date</th>
                        <th className="text-left px-3 py-2">Time In</th>
                        <th className="text-left px-3 py-2">Time Out</th>
                        <th className="text-right px-3 py-2">Hours</th>
                        <th className="text-right px-3 py-2">OT</th>
                        <th className="text-right px-3 py-2">Late</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {importPreview.slice(0, 20).map((p, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{p.date}</td>
                          <td className="px-3 py-2">{p.timeIn || '-'}</td>
                          <td className="px-3 py-2">{p.timeOut || '-'}</td>
                          <td className="px-3 py-2 text-right">{p.hoursWorked || 0}</td>
                          <td className="px-3 py-2 text-right">{p.overtimeHours || 0}</td>
                          <td className="px-3 py-2 text-right">{p.lateHours || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importPreview.length > 20 && <p className="text-xs text-gray-500 mb-4">...and {importPreview.length - 20} more entries</p>}
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowImportModal(false)}>Cancel</Button>
              <Button onClick={handleImport}>Import {importPreview.length} Entries</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
