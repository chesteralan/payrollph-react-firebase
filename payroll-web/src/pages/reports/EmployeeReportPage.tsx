import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { FileSpreadsheet, FileText, Printer, ChevronDown, ChevronUp } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { Employee, EmployeeProfile, EmployeeContact, EmployeeSalary, EmployeeGroup, EmployeePosition, EmployeeArea, EmployeeStatus } from '../../types'

interface EmployeeReportData extends Employee {
  name?: string
  groupName?: string
  positionName?: string
  areaName?: string
  statusName?: string
  salary?: number
  salaryFrequency?: string
  contacts?: EmployeeContact[]
  profile?: EmployeeProfile
}

export function EmployeeReportPage() {
  const { currentCompanyId } = useAuth()
  const { canView } = usePermissions()

  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<EmployeeReportData[]>([])
  const [groups, setGroups] = useState<EmployeeGroup[]>([])
  const [positions, setPositions] = useState<EmployeePosition[]>([])
  const [areas, setAreas] = useState<EmployeeArea[]>([])
  const [statuses, setStatuses] = useState<EmployeeStatus[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)

  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'active' | 'inactive' | 'terminated',
    groupId: '',
    positionId: '',
    areaId: '',
  })

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const fetchLookups = async () => {
    if (!currentCompanyId) return
    const [groupsSnap, positionsSnap, areasSnap, statusesSnap] = await Promise.all([
      getDocs(query(collection(db, 'groups'), where('companyId', '==', currentCompanyId))),
      getDocs(query(collection(db, 'positions'), where('companyId', '==', currentCompanyId))),
      getDocs(query(collection(db, 'areas'), where('companyId', '==', currentCompanyId))),
      getDocs(query(collection(db, 'statuses'), where('companyId', '==', currentCompanyId))),
    ])

    setGroups(groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeGroup)))
    setPositions(positionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as EmployeePosition)))
    setAreas(areasSnap.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeArea)))
    setStatuses(statusesSnap.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeStatus)))
  }

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (currentCompanyId) {
      fetchLookups()
    }
  }, [currentCompanyId])
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const generateReport = async () => {
    if (!currentCompanyId) return
    setLoading(true)
    setHasGenerated(true)

    try {
      const employeesSnap = await getDocs(query(collection(db, 'employees'), where('companyId', '==', currentCompanyId)))
      let emps = employeesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Employee[]

      if (filters.status !== 'all') {
        if (filters.status === 'active') emps = emps.filter(e => e.isActive)
        else if (filters.status === 'inactive') emps = emps.filter(e => !e.isActive)
        else if (filters.status === 'terminated') emps = emps.filter(e => e.statusId === filters.status)
      }
      if (filters.groupId) emps = emps.filter(e => e.groupId === filters.groupId)
      if (filters.positionId) emps = emps.filter(e => e.positionId === filters.positionId)
      if (filters.areaId) emps = emps.filter(e => e.areaId === filters.areaId)

      const [namesSnap, profilesSnap, contactsSnap, salariesSnap] = await Promise.all([
        getDocs(query(collection(db, 'names'), where('companyId', '==', currentCompanyId))),
        getDocs(query(collection(db, 'employeeProfiles'), where('companyId', '==', currentCompanyId))),
        getDocs(query(collection(db, 'employeeContacts'), where('companyId', '==', currentCompanyId))),
        getDocs(query(collection(db, 'employeeSalaries'), where('companyId', '==', currentCompanyId))),
      ])

      const names = namesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as { id: string; nameId?: string; firstName?: string; middleName?: string; lastName?: string; suffix?: string }[]
      const profiles = profilesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as EmployeeProfile[]
      const contacts = contactsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as EmployeeContact[]
      const salaries = salariesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as EmployeeSalary[]

      const reportData: EmployeeReportData[] = emps.map(emp => {
        const name = names.find(n => n.nameId === emp.nameId)
        const fullName = name ? `${name.firstName} ${name.middleName ? name.middleName + ' ' : ''}${name.lastName}${name.suffix ? ' ' + name.suffix : ''}` : emp.nameId
        const group = groups.find(g => g.id === emp.groupId)
        const position = positions.find(p => p.id === emp.positionId)
        const area = areas.find(a => a.id === emp.areaId)
        const status = statuses.find(s => s.id === emp.statusId)
        const profile = profiles.find(p => p.nameId === emp.nameId)
        const empContacts = contacts.filter(c => c.employeeId === emp.id)
        const salary = salaries.filter(s => s.employeeId === emp.id && s.isActive).sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0]

        return {
          ...emp,
          name: fullName.trim(),
          groupName: group?.name,
          positionName: position?.name,
          areaName: area?.name,
          statusName: status?.name,
          salary: salary?.amount,
          salaryFrequency: salary?.frequency,
          contacts: empContacts,
          profile,
        }
      })

      reportData.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setEmployees(reportData)
    } finally {
      setLoading(false)
    }
  }

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExportXLS = () => {
    const wb = XLSX.utils.book_new()

    const data = employees.map(r => ({
      'Employee Code': r.employeeCode,
      'Name': r.name || r.nameId,
      'Group': r.groupName || '',
      'Position': r.positionName || '',
      'Area': r.areaName || '',
      'Status': r.isActive ? 'Active' : 'Inactive',
      'Salary': r.salary || 0,
      'Frequency': r.salaryFrequency || '',
      'Hire Date': r.hireDate ? new Date(r.hireDate).toLocaleDateString() : '',
      'Phone': r.contacts?.find(c => c.type === 'phone' && c.isPrimary)?.value || r.contacts?.find(c => c.type === 'phone')?.value || '',
      'Email': r.contacts?.find(c => c.type === 'email' && c.isPrimary)?.value || r.contacts?.find(c => c.type === 'email')?.value || '',
    }))

    const ws = XLSX.utils.json_to_sheet(data)

    ws['!cols'] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
    ]

    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: 'CCCCCC' } } }
    const range = XLSX.utils.decode_range(ws['!ref'] || '')
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C })
      if (ws[cellAddress]) {
        ws[cellAddress].s = headerStyle
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Employee Master List')
    XLSX.writeFile(wb, `Employee_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleExportCSV = () => {
    const headers = ['Employee Code', 'Name', 'Group', 'Position', 'Area', 'Status', 'Salary', 'Frequency', 'Hire Date', 'Phone', 'Email']
    const rows = employees.map(r => [
      r.employeeCode,
      r.name || r.nameId,
      r.groupName || '',
      r.positionName || '',
      r.areaName || '',
      r.isActive ? 'Active' : 'Inactive',
      r.salary || 0,
      r.salaryFrequency || '',
      r.hireDate ? new Date(r.hireDate).toLocaleDateString() : '',
      r.contacts?.find(c => c.type === 'phone' && c.isPrimary)?.value || r.contacts?.find(c => c.type === 'phone')?.value || '',
      r.contacts?.find(c => c.type === 'email' && c.isPrimary)?.value || r.contacts?.find(c => c.type === 'email')?.value || '',
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Employee_Report_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handlePrint = () => {
    window.print()
  }

  const formatCurrency = (value: number) => value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'

  const getPrimaryContact = (contacts: EmployeeContact[] | undefined, type: 'phone' | 'email' | 'address') => {
    if (!contacts) return ''
    return contacts.find(c => c.type === type && c.isPrimary)?.value || contacts.find(c => c.type === type)?.value || ''
  }

  if (!canView('reports', 'employees')) return <div className="text-center py-12 text-gray-500">Access denied</div>

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Employee Master List Report</h1>
        {hasGenerated && employees.length > 0 && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportXLS}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />Export XLS
            </Button>
            <Button variant="secondary" onClick={handleExportCSV}>
              <FileText className="w-4 h-4 mr-2" />Export CSV
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />Print
            </Button>
          </div>
        )}
      </div>

      <Card className="print:hidden">
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as typeof filters.status })}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filters.groupId}
                onChange={(e) => setFilters({ ...filters, groupId: e.target.value })}
              >
                <option value="">All Groups</option>
                {groups.filter(g => g.isActive).map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filters.positionId}
                onChange={(e) => setFilters({ ...filters, positionId: e.target.value })}
              >
                <option value="">All Positions</option>
                {positions.filter(p => p.isActive).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={filters.areaId}
                onChange={(e) => setFilters({ ...filters, areaId: e.target.value })}
              >
                <option value="">All Areas</option>
                {areas.filter(a => a.isActive).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasGenerated && (
        <>
          {employees.length === 0 ? (
            <Card><CardContent className="pt-6"><p className="text-center text-gray-500 py-8">No employees found with the selected filters.</p></CardContent></Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Employees</div>
                    <div className="text-2xl font-bold">{employees.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Active</div>
                    <div className="text-2xl font-bold text-green-600">{employees.filter(e => e.isActive).length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Inactive</div>
                    <div className="text-2xl font-bold text-gray-600">{employees.filter(e => !e.isActive).length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-500">Total Salary</div>
                    <div className="text-2xl font-bold">{formatCurrency(employees.reduce((s, e) => s + (e.salary || 0), 0))}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="print:hidden"><CardTitle>Employee Master List</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm print:text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 print:bg-gray-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase w-8"></th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Code</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Group</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Position</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Area</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Salary</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hire Date</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {employees.map((emp) => (
                          <>
                            <tr key={emp.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                              <td className="px-4 py-3">
                                <button onClick={() => toggleRow(emp.id)} className="text-gray-500 hover:text-gray-700 print:hidden">
                                  {expandedRows.has(emp.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900">{emp.employeeCode}</td>
                              <td className="px-4 py-3 text-gray-900">{emp.name || emp.nameId}</td>
                              <td className="px-4 py-3 text-gray-500">{emp.groupName || '-'}</td>
                              <td className="px-4 py-3 text-gray-500">{emp.positionName || '-'}</td>
                              <td className="px-4 py-3 text-gray-500">{emp.areaName || '-'}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {emp.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900">
                                {emp.salary ? formatCurrency(emp.salary) : '-'}
                                {emp.salaryFrequency && <span className="text-xs text-gray-500 ml-1">({emp.salaryFrequency})</span>}
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {getPrimaryContact(emp.contacts, 'phone')}
                              </td>
                            </tr>
                            {expandedRows.has(emp.id) && (
                              <tr className="bg-gray-50 print:bg-transparent">
                                <td colSpan={10} className="px-4 py-3">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 uppercase">SSS</div>
                                      <div className="text-gray-900">{emp.profile?.sss || '-'}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 uppercase">TIN</div>
                                      <div className="text-gray-900">{emp.profile?.tin || '-'}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 uppercase">PhilHealth</div>
                                      <div className="text-gray-900">{emp.profile?.philhealth || '-'}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 uppercase">HDMF/Pag-IBIG</div>
                                      <div className="text-gray-900">{emp.profile?.hdmf || '-'}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 uppercase">Bank</div>
                                      <div className="text-gray-900">{emp.profile?.bankName || '-'}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 uppercase">Bank Account</div>
                                      <div className="text-gray-900">{emp.profile?.bankAccount || '-'}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 uppercase">Email</div>
                                      <div className="text-gray-900">{getPrimaryContact(emp.contacts, 'email') || '-'}</div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-gray-500 uppercase">Address</div>
                                      <div className="text-gray-900">{getPrimaryContact(emp.contacts, 'address') || '-'}</div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
